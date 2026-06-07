import bcrypt from 'bcryptjs';
import { UserRole, MemberLevel, ProductCategory, OrderStatus, InspectionStatus, LogisticsType, PaymentStatus } from '../types';

let idCounter = 1;
const generateId = () => `id_${Date.now()}_${idCounter++}`;

const hashedPassword = bcrypt.hashSync('123456', 10);

export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyName?: string;
  address?: string;
  memberLevel: MemberLevel;
  creditScore: number;
  creditLimit: number;
  yearlyAmount: number;
  annualTransaction: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  merchantId: string;
  merchantName: string;
  origin: string;
  seasonalTrend: number;
  inspectionStatus: InspectionStatus;
  traceCode?: string;
  priceHistory: { date: Date; price: number }[];
  specs: { name: string; price: number; stock: number }[];
  isActive: boolean;
  createdAt: Date;
}

export interface Order {
  _id: string;
  orderNo: string;
  buyerId: string;
  buyerName: string;
  items: {
    productId: string;
    productName: string;
    spec: string;
    quantity: number;
    price: number;
    unit: string;
    subtotal: number;
  }[];
  totalAmount: number;
  logisticsType: LogisticsType;
  logisticsCost: number;
  origin: string;
  destination: string;
  warehouse: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentDays?: number;
  paymentDueDate?: Date;
  creditUsed?: number;
  createdAt: Date;
}

export interface Inventory {
  _id: string;
  productId: string;
  productName: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: Date;
  warehouse: string;
  lowStockAlert: boolean;
  expiryAlert: boolean;
}

export interface InspectionReport {
  _id: string;
  productId: string;
  productName: string;
  traceCode: string;
  inspectionDate: Date;
  inspector: string;
  items: { name: string; result: string; standard?: string; value?: string }[];
  overallStatus: InspectionStatus;
  reportUrl: string;
}

export interface PurchaseRequest {
  _id: string;
  requesterId: string;
  requesterName: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  expectedPrice: number;
  description: string;
  status: 'open' | 'matched' | 'closed';
  createdAt: Date;
}

const users: User[] = [
  {
    _id: 'admin_1',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    password: hashedPassword,
    phone: '13800000001',
    role: UserRole.ADMIN,
    memberLevel: MemberLevel.DIAMOND,
    creditScore: 100,
    creditLimit: 1000000,
    yearlyAmount: 5000000,
    annualTransaction: 5000000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'wholesaler_1',
    username: 'wholesaler',
    name: '张批发商',
    email: 'wholesaler@example.com',
    password: hashedPassword,
    phone: '13800000002',
    role: UserRole.WHOLESALER,
    companyName: '张氏果蔬批发有限公司',
    memberLevel: MemberLevel.GOLD,
    creditScore: 85,
    creditLimit: 500000,
    yearlyAmount: 1200000,
    annualTransaction: 1200000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'merchant_1',
    username: 'merchant',
    name: '李商户',
    email: 'merchant@example.com',
    password: hashedPassword,
    phone: '13800000003',
    role: UserRole.MERCHANT,
    companyName: '李家农场',
    memberLevel: MemberLevel.SILVER,
    creditScore: 78,
    creditLimit: 200000,
    yearlyAmount: 450000,
    annualTransaction: 450000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const products: Product[] = [
  {
    _id: 'prod_1',
    name: '西红柿',
    category: ProductCategory.VEGETABLE,
    description: '新鲜有机西红柿，产地直供，自然成熟，口感酸甜',
    price: 4.5,
    unit: '公斤',
    stock: 500,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '山东寿光',
    seasonalTrend: 85,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401001',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 4.2 }, { date: new Date(), price: 4.5 }],
    specs: [{ name: '普通', price: 4.5, stock: 300 }, { name: '精品', price: 6.0, stock: 200 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_2',
    name: '黄瓜',
    category: ProductCategory.VEGETABLE,
    description: '清脆爽口，新鲜采摘，绿色无农药',
    price: 3.2,
    unit: '公斤',
    stock: 800,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '河北固安',
    seasonalTrend: 78,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401002',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 3.0 }, { date: new Date(), price: 3.2 }],
    specs: [{ name: '普通', price: 3.2, stock: 500 }, { name: '有机', price: 5.5, stock: 300 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_3',
    name: '红富士苹果',
    category: ProductCategory.FRUIT,
    description: '陕西洛川红富士，脆甜多汁，糖度高',
    price: 6.8,
    unit: '公斤',
    stock: 1200,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '陕西洛川',
    seasonalTrend: 92,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401003',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 6.5 }, { date: new Date(), price: 6.8 }],
    specs: [{ name: '75mm', price: 5.8, stock: 500 }, { name: '80mm', price: 6.8, stock: 400 }, { name: '85mm', price: 8.8, stock: 300 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_4',
    name: '香蕉',
    category: ProductCategory.FRUIT,
    description: '进口香蕉，香甜软糯，自然催熟',
    price: 5.5,
    unit: '公斤',
    stock: 600,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '菲律宾',
    seasonalTrend: 70,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401004',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 5.2 }, { date: new Date(), price: 5.5 }],
    specs: [{ name: '普通', price: 5.5, stock: 600 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_5',
    name: '猪肉',
    category: ProductCategory.MEAT,
    description: '新鲜冷鲜肉，检疫合格，肉质鲜嫩',
    price: 28.0,
    unit: '公斤',
    stock: 300,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '河南周口',
    seasonalTrend: 65,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401005',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 26.5 }, { date: new Date(), price: 28.0 }],
    specs: [{ name: '五花肉', price: 32.0, stock: 100 }, { name: '瘦肉', price: 28.0, stock: 150 }, { name: '排骨', price: 35.0, stock: 50 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_6',
    name: '牛肉',
    category: ProductCategory.MEAT,
    description: '优质黄牛肉，鲜嫩多汁，草饲喂养',
    price: 68.0,
    unit: '公斤',
    stock: 150,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '内蒙古',
    seasonalTrend: 72,
    inspectionStatus: InspectionStatus.PENDING,
    traceCode: 'TRACE202401006',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 65.0 }, { date: new Date(), price: 68.0 }],
    specs: [{ name: '牛腩', price: 58.0, stock: 50 }, { name: '牛腱', price: 68.0, stock: 60 }, { name: '牛排', price: 98.0, stock: 40 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_7',
    name: '草鱼',
    category: ProductCategory.AQUATIC,
    description: '活鱼现杀，新鲜配送，肉质细嫩',
    price: 12.0,
    unit: '公斤',
    stock: 200,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '江苏洪泽湖',
    seasonalTrend: 60,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401007',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 11.5 }, { date: new Date(), price: 12.0 }],
    specs: [{ name: '2-3斤/条', price: 12.0, stock: 120 }, { name: '3-4斤/条', price: 13.5, stock: 80 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_8',
    name: '基围虾',
    category: ProductCategory.AQUATIC,
    description: '鲜活基围虾，肉质紧实，口感鲜甜',
    price: 45.0,
    unit: '公斤',
    stock: 80,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '广东湛江',
    seasonalTrend: 80,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401008',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 42.0 }, { date: new Date(), price: 45.0 }],
    specs: [{ name: '中等大小', price: 45.0, stock: 80 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_9',
    name: '土豆',
    category: ProductCategory.VEGETABLE,
    description: '黄心土豆，粉糯香甜，产地直供',
    price: 2.5,
    unit: '公斤',
    stock: 50,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '甘肃定西',
    seasonalTrend: 55,
    inspectionStatus: InspectionStatus.PASSED,
    traceCode: 'TRACE202401009',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 2.3 }, { date: new Date(), price: 2.5 }],
    specs: [{ name: '普通', price: 2.5, stock: 50 }],
    isActive: true,
    createdAt: new Date(),
  },
  {
    _id: 'prod_10',
    name: '橙子',
    category: ProductCategory.FRUIT,
    description: '赣南脐橙，甜蜜多汁，维C丰富',
    price: 8.5,
    unit: '公斤',
    stock: 25,
    merchantId: 'merchant_1',
    merchantName: '李家农场',
    origin: '江西赣州',
    seasonalTrend: 88,
    inspectionStatus: InspectionStatus.FAILED,
    traceCode: 'TRACE202401010',
    priceHistory: [{ date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: 8.0 }, { date: new Date(), price: 8.5 }],
    specs: [{ name: '70mm', price: 7.5, stock: 10 }, { name: '75mm', price: 8.5, stock: 15 }],
    isActive: false,
    createdAt: new Date(),
  },
];

const orders: Order[] = [
  {
    _id: 'order_1',
    orderNo: 'ORD202401001',
    buyerId: 'wholesaler_1',
    buyerName: '张批发商',
    items: [
      { productId: 'prod_1', productName: '西红柿', spec: '精品', quantity: 50, price: 6.0, unit: '公斤', subtotal: 300 },
      { productId: 'prod_2', productName: '黄瓜', spec: '普通', quantity: 100, price: 3.2, unit: '公斤', subtotal: 320 },
    ],
    totalAmount: 620.0,
    logisticsType: LogisticsType.FULL_TRUCK,
    logisticsCost: 50.0,
    origin: '山东寿光',
    destination: '北京新发地',
    warehouse: 'A区1号库',
    status: OrderStatus.DELIVERED,
    paymentMethod: 'credit',
    paymentStatus: PaymentStatus.UNPAID,
    paymentDays: 45,
    paymentDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    creditUsed: 620.0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'order_2',
    orderNo: 'ORD202401002',
    buyerId: 'wholesaler_1',
    buyerName: '张批发商',
    items: [
      { productId: 'prod_3', productName: '红富士苹果', spec: '80mm', quantity: 200, price: 6.8, unit: '公斤', subtotal: 1360 },
    ],
    totalAmount: 1360.0,
    logisticsType: LogisticsType.LTL,
    logisticsCost: 80.0,
    origin: '陕西洛川',
    destination: '北京新发地',
    warehouse: 'A区2号库',
    status: OrderStatus.SHIPPED,
    paymentMethod: 'credit',
    paymentStatus: PaymentStatus.UNPAID,
    paymentDays: 45,
    paymentDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    creditUsed: 1360.0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'order_3',
    orderNo: 'ORD202401003',
    buyerId: 'wholesaler_1',
    buyerName: '张批发商',
    items: [
      { productId: 'prod_5', productName: '猪肉', spec: '五花肉', quantity: 30, price: 32.0, unit: '公斤', subtotal: 960 },
    ],
    totalAmount: 960.0,
    logisticsType: LogisticsType.FULL_TRUCK,
    logisticsCost: 100.0,
    origin: '河南周口',
    destination: '北京新发地',
    warehouse: 'B区1号库',
    status: OrderStatus.PENDING,
    paymentMethod: 'cash',
    paymentStatus: PaymentStatus.UNPAID,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const inventory: Inventory[] = products.map((product) => ({
  _id: `inv_${product._id}`,
  productId: product._id,
  productName: product.name,
  category: product.category,
  stock: product.stock,
  minStock: product.category === ProductCategory.AQUATIC ? 100 : 200,
  unit: product.unit,
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  warehouse: 'A区1号库',
  lowStockAlert: product.stock < (product.category === ProductCategory.AQUATIC ? 100 : 200),
  expiryAlert: false,
}));

const inspectionReports: InspectionReport[] = [
  {
    _id: 'report_1',
    productId: 'prod_1',
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
    _id: 'report_2',
    productId: 'prod_3',
    productName: '红富士苹果',
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
];

const purchaseRequests: PurchaseRequest[] = [
  {
    _id: 'pr_1',
    requesterId: 'wholesaler_1',
    requesterName: '张批发商',
    productName: '西红柿',
    category: ProductCategory.VEGETABLE,
    quantity: 500,
    unit: '公斤',
    expectedPrice: 4.0,
    description: '需要精品西红柿，长期合作，每周配送',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'pr_2',
    requesterId: 'wholesaler_1',
    requesterName: '张批发商',
    productName: '草莓',
    category: ProductCategory.FRUIT,
    quantity: 100,
    unit: '公斤',
    expectedPrice: 25.0,
    description: '新鲜草莓，奶油草莓优先，每日配送',
    status: 'open',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

export const db = {
  users,
  products,
  orders,
  inventory,
  inspectionReports,
  purchaseRequests,
  generateId,
};

export default db;
