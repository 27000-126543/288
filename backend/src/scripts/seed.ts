import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import Order from '../models/Order';
import InspectionReport from '../models/InspectionReport';
import PurchaseRequest from '../models/PurchaseRequest';
import { UserRole, MemberLevel, ProductCategory, OrderStatus, InspectionStatus } from '../types';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-market');
    console.log('MongoDB 连接成功');

    await User.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Order.deleteMany({});
    await InspectionReport.deleteMany({});
    await PurchaseRequest.deleteMany({});

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = await User.insertMany([
      {
        name: '系统管理员',
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '13800000001',
        role: UserRole.ADMIN,
        memberLevel: MemberLevel.DIAMOND,
        creditScore: 100,
        creditLimit: 1000000,
        yearlyAmount: 5000000,
      },
      {
        name: '张批发商',
        email: 'wholesaler@example.com',
        password: hashedPassword,
        phone: '13800000002',
        role: UserRole.WHOLESALER,
        memberLevel: MemberLevel.GOLD,
        creditScore: 85,
        creditLimit: 500000,
        yearlyAmount: 1200000,
        companyName: '张氏果蔬批发有限公司',
      },
      {
        name: '李商户',
        email: 'merchant@example.com',
        password: hashedPassword,
        phone: '13800000003',
        role: UserRole.MERCHANT,
        memberLevel: MemberLevel.SILVER,
        creditScore: 78,
        creditLimit: 200000,
        yearlyAmount: 450000,
        companyName: '李家农场',
      },
      {
        name: '王批发商',
        email: 'wang@example.com',
        password: hashedPassword,
        phone: '13800000004',
        role: UserRole.WHOLESALER,
        memberLevel: MemberLevel.SILVER,
        creditScore: 72,
        creditLimit: 150000,
        yearlyAmount: 280000,
        companyName: '王氏水产批发',
      },
      {
        name: '赵商户',
        email: 'zhao@example.com',
        password: hashedPassword,
        phone: '13800000005',
        role: UserRole.MERCHANT,
        memberLevel: MemberLevel.NORMAL,
        creditScore: 65,
        creditLimit: 50000,
        yearlyAmount: 80000,
        companyName: '赵家果园',
      },
    ]);

    console.log('用户数据创建完成');

    const merchant = users.find((u) => u.role === UserRole.MERCHANT)!;
    const merchant2 = users.find((u) => u.email === 'zhao@example.com')!;

    const products = await Product.insertMany([
      {
        name: '西红柿',
        category: ProductCategory.VEGETABLE,
        description: '新鲜有机西红柿，产地直供',
        price: 4.5,
        unit: '公斤',
        stock: 500,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '山东寿光',
        seasonalTrend: 85,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401001',
        priceHistory: [{ date: new Date('2024-01-01'), price: 4.2 }, { date: new Date('2024-01-15'), price: 4.5 }],
        specs: [{ name: '普通', price: 4.5, stock: 300 }, { name: '精品', price: 6.0, stock: 200 }],
      },
      {
        name: '黄瓜',
        category: ProductCategory.VEGETABLE,
        description: '清脆爽口，新鲜采摘',
        price: 3.2,
        unit: '公斤',
        stock: 800,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '河北固安',
        seasonalTrend: 78,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401002',
        priceHistory: [{ date: new Date('2024-01-01'), price: 3.0 }, { date: new Date('2024-01-15'), price: 3.2 }],
        specs: [{ name: '普通', price: 3.2, stock: 500 }, { name: '有机', price: 5.5, stock: 300 }],
      },
      {
        name: '苹果',
        category: ProductCategory.FRUIT,
        description: '红富士苹果，脆甜多汁',
        price: 6.8,
        unit: '公斤',
        stock: 1200,
        merchantId: merchant2._id,
        merchantName: merchant2.companyName,
        origin: '陕西洛川',
        seasonalTrend: 92,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401003',
        priceHistory: [{ date: new Date('2024-01-01'), price: 6.5 }, { date: new Date('2024-01-15'), price: 6.8 }],
        specs: [{ name: '75mm', price: 5.8, stock: 500 }, { name: '80mm', price: 6.8, stock: 400 }, { name: '85mm', price: 8.8, stock: 300 }],
      },
      {
        name: '香蕉',
        category: ProductCategory.FRUIT,
        description: '进口香蕉，香甜软糯',
        price: 5.5,
        unit: '公斤',
        stock: 600,
        merchantId: merchant2._id,
        merchantName: merchant2.companyName,
        origin: '菲律宾',
        seasonalTrend: 70,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401004',
        priceHistory: [{ date: new Date('2024-01-01'), price: 5.2 }, { date: new Date('2024-01-15'), price: 5.5 }],
        specs: [{ name: '普通', price: 5.5, stock: 600 }],
      },
      {
        name: '猪肉',
        category: ProductCategory.MEAT,
        description: '新鲜冷鲜肉，检疫合格',
        price: 28.0,
        unit: '公斤',
        stock: 300,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '河南周口',
        seasonalTrend: 65,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401005',
        priceHistory: [{ date: new Date('2024-01-01'), price: 26.5 }, { date: new Date('2024-01-15'), price: 28.0 }],
        specs: [{ name: '五花肉', price: 32.0, stock: 100 }, { name: '瘦肉', price: 28.0, stock: 150 }, { name: '排骨', price: 35.0, stock: 50 }],
      },
      {
        name: '牛肉',
        category: ProductCategory.MEAT,
        description: '优质黄牛肉，鲜嫩多汁',
        price: 68.0,
        unit: '公斤',
        stock: 150,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '内蒙古',
        seasonalTrend: 72,
        inspectionStatus: InspectionStatus.PENDING,
        traceCode: 'TRACE202401006',
        priceHistory: [{ date: new Date('2024-01-01'), price: 65.0 }, { date: new Date('2024-01-15'), price: 68.0 }],
        specs: [{ name: '牛腩', price: 58.0, stock: 50 }, { name: '牛腱', price: 68.0, stock: 60 }, { name: '牛排', price: 98.0, stock: 40 }],
      },
      {
        name: '草鱼',
        category: ProductCategory.AQUATIC,
        description: '活鱼现杀，新鲜配送',
        price: 12.0,
        unit: '公斤',
        stock: 200,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '江苏洪泽湖',
        seasonalTrend: 60,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401007',
        priceHistory: [{ date: new Date('2024-01-01'), price: 11.5 }, { date: new Date('2024-01-15'), price: 12.0 }],
        specs: [{ name: '2-3斤/条', price: 12.0, stock: 120 }, { name: '3-4斤/条', price: 13.5, stock: 80 }],
      },
      {
        name: '基围虾',
        category: ProductCategory.AQUATIC,
        description: '鲜活基围虾，肉质紧实',
        price: 45.0,
        unit: '公斤',
        stock: 80,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '广东湛江',
        seasonalTrend: 80,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401008',
        priceHistory: [{ date: new Date('2024-01-01'), price: 42.0 }, { date: new Date('2024-01-15'), price: 45.0 }],
        specs: [{ name: '中等大小', price: 45.0, stock: 80 }],
      },
      {
        name: '土豆',
        category: ProductCategory.VEGETABLE,
        description: '黄心土豆，粉糯香甜',
        price: 2.5,
        unit: '公斤',
        stock: 50,
        merchantId: merchant._id,
        merchantName: merchant.companyName,
        origin: '甘肃定西',
        seasonalTrend: 55,
        inspectionStatus: InspectionStatus.PASSED,
        traceCode: 'TRACE202401009',
        priceHistory: [{ date: new Date('2024-01-01'), price: 2.3 }, { date: new Date('2024-01-15'), price: 2.5 }],
        specs: [{ name: '普通', price: 2.5, stock: 50 }],
      },
      {
        name: '橙子',
        category: ProductCategory.FRUIT,
        description: '赣南脐橙，甜蜜多汁',
        price: 8.5,
        unit: '公斤',
        stock: 25,
        merchantId: merchant2._id,
        merchantName: merchant2.companyName,
        origin: '江西赣州',
        seasonalTrend: 88,
        inspectionStatus: InspectionStatus.FAILED,
        traceCode: 'TRACE202401010',
        priceHistory: [{ date: new Date('2024-01-01'), price: 8.0 }, { date: new Date('2024-01-15'), price: 8.5 }],
        specs: [{ name: '70mm', price: 7.5, stock: 10 }, { name: '75mm', price: 8.5, stock: 15 }],
      },
    ]);

    console.log('商品数据创建完成');

    await Inventory.insertMany(
      products.map((product) => ({
        productId: product._id,
        productName: product.name,
        category: product.category,
        stock: product.stock,
        minStock: product.category === ProductCategory.AQUATIC ? 100 : 200,
        unit: product.unit,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        warehouse: 'A区1号库',
      }))
    );

    console.log('库存数据创建完成');

    const wholesaler = users.find((u) => u.role === UserRole.WHOLESALER)!;

    await Order.insertMany([
      {
        orderNo: 'ORD202401001',
        buyerId: wholesaler._id,
        buyerName: wholesaler.name,
        items: [
          { productId: products[0]._id, productName: '西红柿', spec: '精品', quantity: 50, price: 6.0, unit: '公斤' },
          { productId: products[1]._id, productName: '黄瓜', spec: '普通', quantity: 100, price: 3.2, unit: '公斤' },
        ],
        totalAmount: 620.0,
        logisticsType: '整车',
        logisticsCost: 50.0,
        origin: '山东寿光',
        destination: '北京新发地',
        status: OrderStatus.DELIVERED,
        paymentMethod: 'credit',
        paymentDays: 45,
        paymentDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        creditUsed: 620.0,
      },
      {
        orderNo: 'ORD202401002',
        buyerId: wholesaler._id,
        buyerName: wholesaler.name,
        items: [
          { productId: products[2]._id, productName: '苹果', spec: '80mm', quantity: 200, price: 6.8, unit: '公斤' },
        ],
        totalAmount: 1360.0,
        logisticsType: '零担',
        logisticsCost: 80.0,
        origin: '陕西洛川',
        destination: '北京新发地',
        status: OrderStatus.SHIPPED,
        paymentMethod: 'credit',
        paymentDays: 45,
        paymentDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        creditUsed: 1360.0,
      },
      {
        orderNo: 'ORD202401003',
        buyerId: wholesaler._id,
        buyerName: wholesaler.name,
        items: [
          { productId: products[4]._id, productName: '猪肉', spec: '五花肉', quantity: 30, price: 32.0, unit: '公斤' },
        ],
        totalAmount: 960.0,
        logisticsType: '整车',
        logisticsCost: 100.0,
        origin: '河南周口',
        destination: '北京新发地',
        status: OrderStatus.PENDING,
        paymentMethod: 'cash',
      },
    ]);

    console.log('订单数据创建完成');

    await InspectionReport.insertMany([
      {
        productId: products[0]._id,
        productName: '西红柿',
        traceCode: 'TRACE202401001',
        inspectionDate: new Date(),
        inspector: '王检测员',
        items: [
          { name: '农药残留', result: '合格', standard: '≤0.5mg/kg', value: '0.02mg/kg' },
          { name: '重金属', result: '合格', standard: '≤0.1mg/kg', value: '0.01mg/kg' },
        ],
        overallStatus: InspectionStatus.PASSED,
        reportUrl: '/reports/trace202401001.pdf',
      },
      {
        productId: products[2]._id,
        productName: '苹果',
        traceCode: 'TRACE202401003',
        inspectionDate: new Date(),
        inspector: '李检测员',
        items: [
          { name: '农药残留', result: '合格', standard: '≤0.5mg/kg', value: '0.03mg/kg' },
          { name: '重金属', result: '合格', standard: '≤0.1mg/kg', value: '0.01mg/kg' },
        ],
        overallStatus: InspectionStatus.PASSED,
        reportUrl: '/reports/trace202401003.pdf',
      },
      {
        productId: products[9]._id,
        productName: '橙子',
        traceCode: 'TRACE202401010',
        inspectionDate: new Date(),
        inspector: '张检测员',
        items: [
          { name: '农药残留', result: '不合格', standard: '≤0.5mg/kg', value: '0.8mg/kg' },
          { name: '重金属', result: '合格', standard: '≤0.1mg/kg', value: '0.02mg/kg' },
        ],
        overallStatus: InspectionStatus.FAILED,
        reportUrl: '/reports/trace202401010.pdf',
      },
    ]);

    console.log('检测报告数据创建完成');

    await PurchaseRequest.insertMany([
      {
        requesterId: wholesaler._id,
        requesterName: wholesaler.name,
        productName: '西红柿',
        category: ProductCategory.VEGETABLE,
        quantity: 500,
        unit: '公斤',
        expectedPrice: 4.0,
        description: '需要精品西红柿，长期合作',
        status: 'open',
      },
      {
        requesterId: wholesaler._id,
        requesterName: wholesaler.name,
        productName: '草莓',
        category: ProductCategory.FRUIT,
        quantity: 100,
        unit: '公斤',
        expectedPrice: 25.0,
        description: '新鲜草莓，奶油草莓优先',
        status: 'open',
      },
    ]);

    console.log('求购信息数据创建完成');

    console.log('\n========================================');
    console.log('种子数据填充完成！');
    console.log('========================================');
    console.log('\n测试账号：');
    console.log('管理员：admin@example.com / 123456');
    console.log('批发商：wholesaler@example.com / 123456');
    console.log('商户：merchant@example.com / 123456');
    console.log('\n========================================');

    process.exit(0);
  } catch (error) {
    console.error('种子数据填充失败:', error);
    process.exit(1);
  }
};

seedDatabase();
