import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import db from './data/inMemoryDB';
import { UserRole, MemberLevel, OrderStatus, InspectionStatus, LogisticsType, PaymentStatus, ProductCategory } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未授权' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = db.users.find((u: any) => u._id === decoded.id);
    if (!req.user) return res.status(401).json({ message: '用户不存在' });
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token无效' });
  }
};

// ==================== 认证接口 ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.users.find((u: any) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      memberLevel: user.memberLevel,
      companyName: user.companyName,
      token: generateToken(user._id),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, phone, role, companyName, address } = req.body;
    if (db.users.find((u: any) => u.email === email || u.username === username)) {
      return res.status(400).json({ message: '用户已存在' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: any = {
      _id: db.generateId(),
      username,
      name: username,
      email,
      password: hashedPassword,
      phone,
      role: role || UserRole.WHOLESALER,
      companyName,
      address,
      memberLevel: MemberLevel.NORMAL,
      creditScore: 100,
      creditLimit: 10000,
      yearlyAmount: 0,
      annualTransaction: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.users.push(user);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/profile', authMiddleware, (req: any, res) => {
  res.json(req.user);
});

// ==================== 商品接口 ====================
app.get('/api/products', (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query as any;
    let products = [...db.products.filter((p: any) => p.isActive)];
    if (category) products = products.filter((p: any) => p.category === category);
    if (search) products = products.filter((p: any) => p.name.includes(search));
    const total = products.length;
    const start = (page - 1) * limit;
    const paginated = products.slice(start, start + parseInt(limit));
    res.json({ products: paginated, total, page, limit });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.products.find((p: any) => p._id === req.params.id);
    if (!product) return res.status(404).json({ message: '商品不存在' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/recommendations', (req, res) => {
  try {
    const calculateScore = (product: any) => {
      let score = 0;
      score += (100 - product.price / 10) * 0.4;
      score += product.seasonalTrend * 0.3;
      score += (product.stock > 50 ? 30 : product.stock * 0.6) * 0.3;
      if (product.inspectionStatus === InspectionStatus.PASSED) score += 10;
      return Math.round(score);
    };
    const recommendations = db.products
      .filter((p: any) => p.isActive)
      .map((p: any) => ({ ...p, score: calculateScore(p) }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 8);
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products/purchase-requests', authMiddleware, (req: any, res) => {
  try {
    const pr: any = {
      _id: db.generateId(),
      requesterId: req.user._id,
      requesterName: req.user.name,
      ...req.body,
      status: 'open',
      createdAt: new Date(),
    };
    db.purchaseRequests.push(pr);
    res.status(201).json(pr);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/purchase-requests', (req, res) => {
  res.json(db.purchaseRequests);
});

// ==================== 订单接口 ====================
app.get('/api/orders', authMiddleware, (req: any, res) => {
  try {
    let orders = [...db.orders];
    if (req.user.role === UserRole.WHOLESALER) {
      orders = orders.filter((o: any) => o.buyerId === req.user._id);
    } else if (req.user.role === UserRole.MERCHANT) {
      // 商户看到所有订单
    }
    const { status } = req.query;
    if (status) orders = orders.filter((o: any) => o.status === status);
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ orders, total: orders.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.orders.find((o: any) => o._id === req.params.id);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  res.json(order);
});

app.post('/api/orders', authMiddleware, (req: any, res) => {
  try {
    const { items, logisticsType, destination, paymentMethod } = req.body;
    const orderItems = items.map((item: any) => ({
      ...item,
      subtotal: item.price * item.quantity,
    }));
    const totalAmount = orderItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const logisticsCost = logisticsType === LogisticsType.FULL_TRUCK ? 100 : 50;
    const warehouses = ['A区1号库', 'A区2号库', 'B区1号库'];
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    
    const getMemberPaymentDays = (level: MemberLevel) => {
      switch (level) {
        case MemberLevel.DIAMOND: return 60;
        case MemberLevel.GOLD: return 45;
        case MemberLevel.SILVER: return 30;
        default: return 15;
      }
    };

    const order: any = {
      _id: db.generateId(),
      orderNo: `ORD${Date.now()}`,
      buyerId: req.user._id,
      buyerName: req.user.name,
      items: orderItems,
      totalAmount,
      logisticsType,
      logisticsCost,
      origin: items[0]?.origin || '产地直供',
      destination,
      warehouse,
      status: OrderStatus.PENDING,
      paymentMethod,
      paymentStatus: PaymentStatus.UNPAID,
      paymentDays: paymentMethod === 'credit' ? getMemberPaymentDays(req.user.memberLevel) : undefined,
      paymentDueDate: paymentMethod === 'credit' 
        ? new Date(Date.now() + getMemberPaymentDays(req.user.memberLevel) * 24 * 60 * 60 * 1000) 
        : undefined,
      creditUsed: paymentMethod === 'credit' ? totalAmount : 0,
      createdAt: new Date(),
    };
    db.orders.push(order);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const order = db.orders.find((o: any) => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: '订单不存在' });
    order.status = req.body.status;
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders/logistics-recommendations', (req, res) => {
  try {
    const { weight, distance } = req.body;
    const recommendations = [];
    if (weight >= 1000) {
      recommendations.push({
        type: LogisticsType.FULL_TRUCK,
        name: '整车运输',
        cost: Math.round(distance * 2.5),
        estimatedDays: Math.ceil(distance / 500),
        description: '适合大批量货物，直达配送',
      });
    }
    recommendations.push({
      type: LogisticsType.LTL,
      name: '零担物流',
      cost: Math.round(distance * 1.5 + weight * 0.5),
      estimatedDays: Math.ceil(distance / 300) + 1,
      description: '适合中小批量，经济实惠',
    });
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== 库存接口 ====================
app.get('/api/inventory', (req, res) => {
  res.json(db.inventory);
});

app.get('/api/inventory/alerts', (req, res) => {
  const alerts = db.inventory.filter((i: any) => i.lowStockAlert || i.expiryAlert);
  res.json({
    alerts,
    summary: {
      lowStock: db.inventory.filter((i: any) => i.lowStockAlert).length,
      expiry: db.inventory.filter((i: any) => i.expiryAlert).length,
    },
  });
});

// ==================== 检测报告接口 ====================
app.get('/api/inspection', (req, res) => {
  res.json(db.inspectionReports);
});

app.post('/api/inspection', authMiddleware, (req: any, res) => {
  try {
    const { productId, productName, items, inspector } = req.body;
    const traceCode = `TRACE${Date.now()}`;
    const overallStatus = items.every((i: any) => i.result === '合格') 
      ? InspectionStatus.PASSED 
      : InspectionStatus.FAILED;
    
    const report: any = {
      _id: db.generateId(),
      productId,
      productName,
      traceCode,
      inspectionDate: new Date(),
      inspector,
      items,
      overallStatus,
      reportUrl: `/reports/${traceCode}.pdf`,
    };
    db.inspectionReports.push(report);

    const product = db.products.find((p: any) => p._id === productId);
    if (product) {
      product.inspectionStatus = overallStatus;
      product.traceCode = traceCode;
      if (overallStatus === InspectionStatus.FAILED) {
        product.isActive = false;
      }
    }

    res.status(201).json({ report, traceCode, autoOffline: overallStatus === InspectionStatus.FAILED });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/inspection/trace/:code', (req, res) => {
  const report = db.inspectionReports.find((r: any) => r.traceCode === req.params.code);
  if (!report) return res.status(404).json({ message: '追溯码不存在' });
  res.json(report);
});

// ==================== 会员接口 ====================
app.get('/api/member', authMiddleware, (req: any, res) => {
  const levels = [
    { level: MemberLevel.NORMAL, name: '普通会员', minAmount: 0, minCredit: 0, benefits: ['基础功能'] },
    { level: MemberLevel.SILVER, name: '银卡会员', minAmount: 100000, minCredit: 60, benefits: ['延长账期至30天', '每月1次免费检测'] },
    { level: MemberLevel.GOLD, name: '金卡会员', minAmount: 500000, minCredit: 75, benefits: ['延长账期至45天', '每月3次免费检测', '商品优先展示'] },
    { level: MemberLevel.DIAMOND, name: '钻石会员', minAmount: 2000000, minCredit: 90, benefits: ['延长账期至60天', '无限次免费检测', '专属客服'] },
  ];
  
  const currentLevel = levels.find((l) => l.level === req.user.memberLevel);
  const nextLevel = levels[levels.findIndex((l) => l.level === req.user.memberLevel) + 1];
  
  const progress = nextLevel 
    ? Math.min(100, Math.round((req.user.yearlyAmount / nextLevel.minAmount) * 100))
    : 100;

  res.json({
    user: req.user,
    currentLevel,
    nextLevel,
    upgradeProgress: progress,
    levels,
  });
});

// ==================== 用户/信用接口 ====================
app.get('/api/users/credit', authMiddleware, (req: any, res) => {
  const usedCredit = db.orders
    .filter((o: any) => o.buyerId === req.user._id && o.paymentMethod === 'credit' && o.paymentStatus === PaymentStatus.UNPAID)
    .reduce((sum: number, o: any) => sum + (o.creditUsed || 0), 0);
  
  const paymentReminders = db.orders
    .filter((o: any) => o.buyerId === req.user._id && o.paymentStatus === PaymentStatus.UNPAID && o.paymentDueDate)
    .map((o: any) => ({
      orderId: o._id,
      orderNo: o.orderNo,
      amount: o.creditUsed,
      dueDate: o.paymentDueDate,
      daysLeft: Math.ceil((new Date(o.paymentDueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    }));

  res.json({
    creditLimit: req.user.creditLimit,
    usedCredit,
    availableCredit: req.user.creditLimit - usedCredit,
    creditScore: req.user.creditScore,
    paymentReminders,
  });
});

app.get('/api/users/payment-reminders', authMiddleware, (req: any, res) => {
  const reminders = db.orders
    .filter((o: any) => o.buyerId === req.user._id && o.paymentStatus === PaymentStatus.UNPAID && o.paymentDueDate)
    .map((o: any) => ({
      orderId: o._id,
      orderNo: o.orderNo,
      amount: o.creditUsed,
      dueDate: o.paymentDueDate,
      daysLeft: Math.ceil((new Date(o.paymentDueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    }))
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft);
  res.json(reminders);
});

app.post('/api/users/payment', authMiddleware, (req: any, res) => {
  const { orderId, amount } = req.body;
  const order = db.orders.find((o: any) => o._id === orderId);
  if (!order) return res.status(404).json({ message: '订单不存在' });
  order.paymentStatus = PaymentStatus.PAID;
  res.json({ message: '支付成功' });
});

// ==================== 管理员接口 ====================
app.get('/api/admin/dashboard', (req, res) => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const transactionTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      amount: Math.round(50 + Math.random() * 50),
      orders: Math.round(20 + Math.random() * 30),
    };
  });

  const categorySales = [
    { category: '蔬菜', sales: 125.6, orders: 156 },
    { category: '水果', sales: 98.3, orders: 89 },
    { category: '肉类', sales: 156.2, orders: 78 },
    { category: '水产', sales: 87.5, orders: 45 },
  ];

  const priceIndex = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    vegetable: 95 + Math.random() * 10,
    fruit: 102 + Math.random() * 8,
    meat: 98 + Math.random() * 12,
    aquatic: 105 + Math.random() * 6,
  }));

  const inventoryList = db.inventory
    .filter((i: any) => i.lowStockAlert)
    .map((i: any) => ({
      ...i,
      alertLevel: i.stock < i.minStock * 0.3 ? 'high' : i.stock < i.minStock * 0.6 ? 'medium' : 'low',
    }));

  const activeMembers = db.users
    .filter((u: any) => u.role !== UserRole.ADMIN)
    .map((u: any) => ({
      ...u,
      activity: Math.round(50 + Math.random() * 50),
    }))
    .sort((a: any, b: any) => b.activity - a.activity)
    .slice(0, 5);

  res.json({
    todayAmount: 256.8,
    todayOrders: 89,
    inventoryAlerts: inventoryList.length,
    highAlerts: inventoryList.filter((i: any) => i.alertLevel === 'high').length,
    inspectionRate: 96.5,
    totalInspections: 156,
    transactionTrend,
    categorySales,
    priceIndex,
    inventoryList,
    activeMembers,
  });
});

app.get('/api/admin/price-forecast', (req, res) => {
  const { category } = req.query;
  const forecasts = [
    {
      productId: 'prod_1',
      productName: '西红柿',
      category: '蔬菜',
      currentPrice: 4.5,
      avgPredictedPrice: 4.8,
      priceTrend: 'up',
      priceChange: 6.7,
      confidence: 85,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predictedPrice: 4.5 + i * 0.1 + Math.random() * 0.2,
        lowerBound: 4.3 + i * 0.08,
        upperBound: 4.7 + i * 0.12,
      })),
      recommendation: {
        action: 'buy',
        message: '价格呈上涨趋势，建议提前备货',
      },
      factors: {
        season: '应季蔬菜，供应充足',
        weather: '近期天气晴好，利于运输',
        holiday: '无',
      },
    },
    {
      productId: 'prod_3',
      productName: '红富士苹果',
      category: '水果',
      currentPrice: 6.8,
      avgPredictedPrice: 6.5,
      priceTrend: 'down',
      priceChange: -4.4,
      confidence: 78,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predictedPrice: 6.8 - i * 0.05 + Math.random() * 0.1,
        lowerBound: 6.6 - i * 0.04,
        upperBound: 7.0 - i * 0.06,
      })),
      recommendation: {
        action: 'wait',
        message: '价格呈下降趋势，建议观望',
      },
      factors: {
        season: '存储量充足',
        weather: '正常',
        holiday: '无',
      },
    },
    {
      productId: 'prod_5',
      productName: '猪肉',
      category: '肉类',
      currentPrice: 28.0,
      avgPredictedPrice: 28.5,
      priceTrend: 'stable',
      priceChange: 1.8,
      confidence: 92,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        predictedPrice: 28.0 + Math.random() * 0.5,
        lowerBound: 27.5,
        upperBound: 29.0,
      })),
      recommendation: {
        action: 'hold',
        message: '价格稳定，按需采购即可',
      },
      factors: {
        season: '消费需求平稳',
        weather: '正常',
        holiday: '无',
      },
    },
  ];

  const result = category 
    ? forecasts.filter((f) => f.category === category)
    : forecasts;
  
  res.json(result);
});

// ==================== 报表接口 ====================
app.get('/api/reports/monthly', (req, res) => {
  const categorySales = [
    { category: '蔬菜', sales: 380.5, orders: 456, avgPrice: 4.2, priceChange: 5.2, logisticsCost: 28.5, inspectionRate: 97.2, satisfaction: 4.6 },
    { category: '水果', sales: 295.8, orders: 267, avgPrice: 7.5, priceChange: -2.1, logisticsCost: 22.3, inspectionRate: 95.8, satisfaction: 4.5 },
    { category: '肉类', sales: 468.2, orders: 234, avgPrice: 35.6, priceChange: 3.8, logisticsCost: 35.6, inspectionRate: 98.5, satisfaction: 4.7 },
    { category: '水产', sales: 262.4, orders: 145, avgPrice: 28.8, priceChange: 1.2, logisticsCost: 31.2, inspectionRate: 96.3, satisfaction: 4.4 },
  ];

  const priceFluctuation = {
    '蔬菜': [95, 98, 102, 100, 105, 103, 108],
    '水果': [102, 100, 98, 96, 95, 97, 94],
    '肉类': [98, 100, 103, 102, 105, 104, 106],
    '水产': [100, 102, 101, 103, 102, 104, 103],
  };

  const logisticsAnalysis = [
    { type: '整车运输', orders: 156, cost: 68.5, percentage: 60 },
    { type: '零担物流', orders: 104, cost: 45.6, percentage: 40 },
  ];

  const satisfactionAnalysis = [
    { rating: '5星', count: 456, percentage: 52 },
    { rating: '4星', count: 289, percentage: 33 },
    { rating: '3星', count: 98, percentage: 11 },
    { rating: '2星及以下', count: 35, percentage: 4 },
  ];

  res.json({
    totalSales: 1406.9,
    totalOrders: 1102,
    totalLogisticsCost: 117.6,
    avgInspectionRate: 96.95,
    categorySales,
    priceFluctuation,
    logisticsAnalysis,
    satisfactionAnalysis,
  });
});

app.get('/api/reports/monthly/export', (req, res) => {
  try {
    const data = [
      ['品类', '销售额(万元)', '订单量', '平均价格(元/公斤)', '价格波动(%)', '物流成本(万元)', '检测合格率(%)', '客户满意度'],
      ['蔬菜', 380.5, 456, 4.2, 5.2, 28.5, 97.2, 4.6],
      ['水果', 295.8, 267, 7.5, -2.1, 22.3, 95.8, 4.5],
      ['肉类', 468.2, 234, 35.6, 3.8, 35.6, 98.5, 4.7],
      ['水产', 262.4, 145, 28.8, 1.2, 31.2, 96.3, 4.4],
      ['合计', 1406.9, 1102, '-', '-', 117.6, 97.0, 4.55],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '月度交易报表');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="monthly-report.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '智慧农贸管理系统API运行正常', 
    timestamp: new Date().toISOString(),
    database: '内存数据库运行中',
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
  console.log(`💊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`\n测试账号：`);
  console.log(`管理员: admin@example.com / 123456`);
  console.log(`批发商: wholesaler@example.com / 123456`);
  console.log(`商户: merchant@example.com / 123456`);
  console.log(`\n========================================`);
});

export default app;
