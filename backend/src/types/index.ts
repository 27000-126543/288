export enum UserRole {
  WHOLESALER = 'wholesaler',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export enum ProductCategory {
  VEGETABLE = '蔬菜',
  FRUIT = '水果',
  MEAT = '肉类',
  AQUATIC = '水产',
  GRAIN = '粮油',
  OTHER = '其他',
}

export enum MemberLevel {
  NORMAL = 'normal',
  SILVER = 'silver',
  GOLD = 'gold',
  DIAMOND = 'diamond',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum LogisticsType {
  FULL_TRUCK = 'full_truck',
  LTL = 'ltl',
}

export enum InspectionStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyName?: string;
  address?: string;
  avatar?: string;
  memberLevel: MemberLevel;
  creditScore: number;
  creditLimit: number;
  annualTransaction: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProduct {
  _id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  specifications: string[];
  images: string[];
  merchantId: string;
  origin: string;
  warehouse: string;
  stock: number;
  shelfLife: number;
  productionDate: Date;
  isActive: boolean;
  inspectionStatus: InspectionStatus;
  traceCode?: string;
  seasonalTrend: number;
  historicalPrices: { date: Date; price: number }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: string;
  orderNo: string;
  wholesalerId: string;
  merchantId: string;
  items: {
    productId: string;
    productName: string;
    specification: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  totalAmount: number;
  logisticsType: LogisticsType;
  logisticsCost: number;
  warehouse: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  creditUsed: number;
  paymentDueDate?: Date;
  deliveryAddress: string;
  remark?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventory {
  _id?: string;
  productId: string;
  merchantId: string;
  warehouse: string;
  quantity: number;
  minStock: number;
  lastRestockDate: Date;
  expiryDate: Date;
  lowStockAlert: boolean;
  expiryAlert: boolean;
}

export interface IInspectionReport {
  _id?: string;
  productId: string;
  merchantId: string;
  reportNumber: string;
  inspectionAgency: string;
  inspectionDate: Date;
  items: { name: string; result: string; standard?: string }[];
  overallResult: InspectionStatus;
  reportUrl: string;
  traceCode: string;
  createdAt?: Date;
}

export interface IPurchaseRequest {
  _id?: string;
  wholesalerId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  expectedPrice: number;
  description: string;
  status: 'open' | 'matched' | 'closed';
  matchedProducts?: string[];
  createdAt?: Date;
}
