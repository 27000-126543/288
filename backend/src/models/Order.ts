import mongoose, { Schema, Document } from 'mongoose';
import { IOrder, OrderStatus, LogisticsType, PaymentStatus } from '../types';

const orderSchema: Schema = new Schema({
  orderNo: { type: String, required: true, unique: true },
  wholesalerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    specification: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  logisticsType: { type: String, enum: Object.values(LogisticsType), required: true },
  logisticsCost: { type: Number, required: true },
  warehouse: { type: String, required: true },
  status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
  paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
  creditUsed: { type: Number, default: 0 },
  paymentDueDate: { type: Date },
  deliveryAddress: { type: String, required: true },
  remark: { type: String },
}, { timestamps: true });

orderSchema.index({ wholesalerId: 1, createdAt: -1 });
orderSchema.index({ merchantId: 1, status: 1 });

export default mongoose.model<IOrder & Document>('Order', orderSchema);
