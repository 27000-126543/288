import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Inventory from '../models/Inventory';
import InspectionReport from '../models/InspectionReport';
import { AuthRequest } from '../middleware/authMiddleware';
import { OrderStatus, InspectionStatus, UserRole, MemberLevel } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { category, startDate, endDate } = req.query;
    let dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const [totalOrders, totalRevenue, pendingOrders, totalProducts, totalUsers, totalMerchants, totalWholesalers] = await Promise.all([
      Order.countDocuments({ ...dateQuery }),
      Order.aggregate([
        { $match: { ...dateQuery, status: { $ne: OrderStatus.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ status: OrderStatus.PENDING, ...dateQuery }),
      Product.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ role: UserRole.MERCHANT }),
      User.countDocuments({ role: UserRole.WHOLESALER }),
    ]);

    const categorySales = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: OrderStatus.CANCELLED } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', sales: { $sum: '$items.subtotal' }, count: { $sum: 1 } } },
      { $sort: { sales: -1 } },
    ]);

    const inspectionStats = await InspectionReport.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$overallResult', count: { $sum: 1 } } },
    ]);

    const inventoryAlerts = await Inventory.countDocuments({
      $or: [{ lowStockAlert: true }, { expiryAlert: true }],
    });

    const memberDistribution = await User.aggregate([
      { $group: { _id: '$memberLevel', count: { $sum: 1 } } },
    ]);

    const priceIndex = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', avgPrice: { $avg: '$price' } } },
    ]);

    res.json({
      overview: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        totalProducts,
        totalUsers,
        totalMerchants,
        totalWholesalers,
        inventoryAlerts,
      },
      categorySales,
      inspectionStats: {
        total: inspectionStats.reduce((sum: number, item: any) => sum + item.count, 0),
        passed: inspectionStats.find((i: any) => i._id === InspectionStatus.PASSED)?.count || 0,
        failed: inspectionStats.find((i: any) => i._id === InspectionStatus.FAILED)?.count || 0,
        passRate: inspectionStats.length ? 
          (inspectionStats.find((i: any) => i._id === InspectionStatus.PASSED)?.count || 0) / 
          inspectionStats.reduce((sum: number, item: any) => sum + item.count, 0) * 100 : 0,
      },
      memberDistribution,
      priceIndex,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPriceForecast = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, category, days = 7 } = req.query;
    const products = await Product.find({
      isActive: true,
      ...(category && { category }),
      ...(productId && { _id: productId }),
    }).limit(5);

    const forecasts = products.map(product => {
      const basePrice = product.price;
      const forecast = [];
      const weatherFactor = Math.random() * 0.1 - 0.05;
      const seasonalFactor = product.seasonalTrend / 1000;
      const holidayFactor = Math.random() * 0.05;

      for (let i = 1; i <= Number(days); i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const trend = Math.sin(i * 0.5) * 0.03;
        const predictedPrice = basePrice * (1 + weatherFactor + seasonalFactor + holidayFactor + trend);
        forecast.push({
          date,
          predictedPrice: Math.round(predictedPrice * 100) / 100,
          lowerBound: Math.round(predictedPrice * 0.95 * 100) / 100,
          upperBound: Math.round(predictedPrice * 1.05 * 100) / 100,
          confidence: 75 + Math.random() * 20,
        });
      }

      return {
        productId: product._id,
        productName: product.name,
        category: product.category,
        currentPrice: basePrice,
        forecast,
        recommendation: generateRecommendation(forecast),
      };
    });

    res.json(forecasts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const generateRecommendation = (forecast: any[]) => {
  const avgPrice = forecast.reduce((sum, f) => sum + f.predictedPrice, 0) / forecast.length;
  const firstPrice = forecast[0].predictedPrice;
  const lastPrice = forecast[forecast.length - 1].predictedPrice;
  
  if (lastPrice < firstPrice * 0.95) {
    return { action: 'wait', message: '预计价格将下跌，建议观望后采购', confidence: 'high' };
  } else if (lastPrice > firstPrice * 1.05) {
    return { action: 'buy', message: '预计价格将上涨，建议尽早采购', confidence: 'high' };
  }
  return { action: 'normal', message: '价格趋于稳定，可按需采购', confidence: 'medium' };
};

export const getInventoryWarnings = async (req: AuthRequest, res: Response) => {
  try {
    const lowStockItems = await Inventory.find({ lowStockAlert: true })
      .populate('productId', 'name category price')
      .populate('merchantId', 'companyName phone')
      .limit(20);
    
    const expiringItems = await Inventory.find({ expiryAlert: true })
      .populate('productId', 'name category price')
      .populate('merchantId', 'companyName phone')
      .limit(20);

    res.json({ lowStockItems, expiringItems });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activeUsers = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$wholesalerId', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]);

    res.json(activeUsers.map((u: any) => ({
      userId: u._id,
      username: u.user.username,
      companyName: u.user.companyName,
      memberLevel: u.user.memberLevel,
      orderCount: u.orderCount,
      totalSpent: u.totalSpent,
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
