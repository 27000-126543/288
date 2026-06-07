import { Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { OrderStatus, LogisticsType, PaymentStatus, UserRole, MemberLevel } from '../types';

const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
};

const calculateLogisticsCost = (distance: number, weight: number, type: LogisticsType) => {
  if (type === LogisticsType.FULL_TRUCK) {
    return distance * 5 + weight * 0.5;
  }
  return distance * 3 + weight * 0.8 + 20;
};

const getMemberPaymentDays = (level: MemberLevel) => {
  switch (level) {
    case MemberLevel.DIAMOND: return 60;
    case MemberLevel.GOLD: return 45;
    case MemberLevel.SILVER: return 30;
    default: return 15;
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, logisticsType, deliveryAddress, useCredit } = req.body;
    let totalAmount = 0;
    const orderItems = [];
    let merchantId: string = '';

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `商品 ${item.productId} 不存在或已下架` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `商品 ${product.name} 库存不足` });
      }
      merchantId = product.merchantId.toString();
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        productId: product._id,
        productName: product.name,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      });
    }

    const logisticsCost = calculateLogisticsCost(50, totalAmount / 10, logisticsType);
    let creditUsed = 0;
    let paymentDueDate;
    
    if (useCredit) {
      const user = await User.findById(req.user._id);
      if (user && totalAmount <= user.creditLimit) {
        creditUsed = totalAmount;
        const paymentDays = getMemberPaymentDays(user.memberLevel);
        paymentDueDate = new Date();
        paymentDueDate.setDate(paymentDueDate.getDate() + paymentDays);
      }
    }

    const order = await Order.create({
      orderNo: generateOrderNo(),
      wholesalerId: req.user._id,
      merchantId,
      items: orderItems,
      totalAmount,
      logisticsType,
      logisticsCost,
      warehouse: '主仓库',
      status: OrderStatus.PENDING,
      paymentStatus: creditUsed > 0 ? PaymentStatus.UNPAID : PaymentStatus.PAID,
      creditUsed,
      paymentDueDate,
      deliveryAddress,
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: { annualTransaction: totalAmount } });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query: any = {};
    if (req.user.role === UserRole.WHOLESALER) {
      query.wholesalerId = req.user._id;
    } else if (req.user.role === UserRole.MERCHANT) {
      query.merchantId = req.user._id;
    }
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('wholesalerId', 'username companyName phone')
      .populate('merchantId', 'username companyName phone')
      .sort('-createdAt')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));
    
    const total = await Order.countDocuments(query);
    res.json({ orders, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('wholesalerId', 'username companyName phone')
      .populate('merchantId', 'username companyName phone');
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    if (req.user.role === UserRole.MERCHANT && order.merchantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作此订单' });
    }
    order.status = status;
    await order.save();
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLogisticsRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const { productIds, quantities, address } = req.body;
    let totalWeight = 0;
    for (let i = 0; i < productIds.length; i++) {
      const product = await Product.findById(productIds[i]);
      if (product) totalWeight += quantities[i] * 0.5;
    }
    const recommendations = [
      {
        type: LogisticsType.FULL_TRUCK,
        name: '整车运输',
        estimatedCost: calculateLogisticsCost(50, totalWeight, LogisticsType.FULL_TRUCK),
        estimatedTime: '1-2天',
        description: '整车直送，适合大批量采购',
      },
      {
        type: LogisticsType.LTL,
        name: '零担物流',
        estimatedCost: calculateLogisticsCost(50, totalWeight, LogisticsType.LTL),
        estimatedTime: '3-5天',
        description: '拼车配送，适合小批量采购',
      },
    ];
    res.json({ recommendations, totalWeight, suggestedWarehouse: '主仓库' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
