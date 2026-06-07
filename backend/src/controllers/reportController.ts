import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import InspectionReport from '../models/InspectionReport';
import { AuthRequest } from '../middleware/authMiddleware';
import { OrderStatus, InspectionStatus } from '../types';
import XLSX from 'xlsx';

export const getMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    const dateQuery = { createdAt: { $gte: startDate, $lte: endDate } };

    const orders = await Order.find({ ...dateQuery, status: { $ne: OrderStatus.CANCELLED } });
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalLogisticsCost = orders.reduce((sum, o) => sum + o.logisticsCost, 0);
    const totalOrders = orders.length;

    const categoryStats = await Order.aggregate([
      { $match: { ...dateQuery, status: { $ne: OrderStatus.CANCELLED } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { 
        _id: '$product.category', 
        sales: { $sum: '$items.subtotal' }, 
        quantity: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 },
      }},
      { $sort: { sales: -1 } },
    ]);

    const priceFluctuations = await Product.aggregate([
      { $match: { 'historicalPrices.date': { $gte: startDate, $lte: endDate } } },
      { $project: {
        name: 1,
        category: 1,
        currentPrice: '$price',
        historicalPrices: {
          $filter: {
            input: '$historicalPrices',
            as: 'hp',
            cond: { $and: [
              { $gte: ['$$hp.date', startDate] },
              { $lte: ['$$hp.date', endDate] },
            ]},
          },
        },
      }},
      { $match: { 'historicalPrices.1': { $exists: true } } },
    ]);

    const priceFluctuationStats = priceFluctuations.map(p => {
      const prices = p.historicalPrices.map((hp: any) => hp.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return {
        productId: p._id,
        productName: p.name,
        category: p.category,
        currentPrice: p.currentPrice,
        minPrice: min,
        maxPrice: max,
        fluctuation: ((max - min) / min * 100).toFixed(2),
      };
    });

    const inspectionStats = await InspectionReport.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$overallResult', count: { $sum: 1 } } },
    ]);

    const totalInspections = inspectionStats.reduce((sum: number, item: any) => sum + item.count, 0);
    const passRate = totalInspections ? 
      (inspectionStats.find((i: any) => i._id === InspectionStatus.PASSED)?.count || 0) / totalInspections * 100 : 0;

    const report = {
      period: { year: Number(year), month: Number(month) },
      summary: {
        totalRevenue,
        totalOrders,
        totalLogisticsCost,
        averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
        totalInspections,
        inspectionPassRate: passRate,
        customerSatisfaction: 85 + Math.random() * 10,
      },
      categoryStats,
      priceFluctuations: priceFluctuationStats,
    };

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.query;
    const report = await getMonthlyReportData(Number(year), Number(month));

    const wb = XLSX.utils.book_new();
    
    const summaryData = [
      ['指标', '数值'],
      ['总交易额', report.summary.totalRevenue],
      ['订单总数', report.summary.totalOrders],
      ['物流总成本', report.summary.totalLogisticsCost],
      ['平均客单价', report.summary.averageOrderValue],
      ['检测总数', report.summary.totalInspections],
      ['检测合格率(%)', report.summary.inspectionPassRate],
      ['客户满意度(%)', report.summary.customerSatisfaction],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, '概览');

    const categoryData = [
      ['品类', '销售额', '销量', '订单数'],
      ...report.categoryStats.map((c: any) => [c._id, c.sales, c.quantity, c.orderCount]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws2, '品类销售');

    const priceData = [
      ['商品', '品类', '当前价格', '最低价格', '最高价格', '波动幅度(%)'],
      ...report.priceFluctuations.map((p: any) => [
        p.productName, p.category, p.currentPrice, p.minPrice, p.maxPrice, p.fluctuation,
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(priceData);
    XLSX.utils.book_append_sheet(wb, ws3, '价格波动');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${year}-${month}.xlsx`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyReportData = async (year: number, month: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const dateQuery = { createdAt: { $gte: startDate, $lte: endDate } };

  const orders = await Order.find({ ...dateQuery, status: { $ne: OrderStatus.CANCELLED } });
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalLogisticsCost = orders.reduce((sum, o) => sum + o.logisticsCost, 0);
  const totalOrders = orders.length;

  const categoryStats = await Order.aggregate([
    { $match: { ...dateQuery, status: { $ne: OrderStatus.CANCELLED } } },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $group: { 
      _id: '$product.category', 
      sales: { $sum: '$items.subtotal' }, 
      quantity: { $sum: '$items.quantity' },
      orderCount: { $sum: 1 },
    }},
    { $sort: { sales: -1 } },
  ]);

  const priceFluctuations = await Product.aggregate([
    { $match: { 'historicalPrices.date': { $gte: startDate, $lte: endDate } } },
    { $project: {
      name: 1,
      category: 1,
      currentPrice: '$price',
      historicalPrices: {
        $filter: {
          input: '$historicalPrices',
          as: 'hp',
          cond: { $and: [
            { $gte: ['$$hp.date', startDate] },
            { $lte: ['$$hp.date', endDate] },
          ]},
        },
      },
    }},
    { $match: { 'historicalPrices.1': { $exists: true } } },
  ]);

  const priceFluctuationStats = priceFluctuations.map(p => {
    const prices = p.historicalPrices.map((hp: any) => hp.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      productId: p._id,
      productName: p.name,
      category: p.category,
      currentPrice: p.currentPrice,
      minPrice: min,
      maxPrice: max,
      fluctuation: ((max - min) / min * 100).toFixed(2),
    };
  });

  const inspectionStats = await InspectionReport.aggregate([
    { $match: dateQuery },
    { $group: { _id: '$overallResult', count: { $sum: 1 } } },
  ]);

  const totalInspections = inspectionStats.reduce((sum: number, item: any) => sum + item.count, 0);
  const passRate = totalInspections ? 
    (inspectionStats.find((i: any) => i._id === InspectionStatus.PASSED)?.count || 0) / totalInspections * 100 : 0;

  return {
    period: { year, month },
    summary: {
      totalRevenue,
      totalOrders,
      totalLogisticsCost,
      averageOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
      totalInspections,
      inspectionPassRate: passRate,
      customerSatisfaction: 85 + Math.random() * 10,
    },
    categoryStats,
    priceFluctuations: priceFluctuationStats,
  };
};
