import mongoose, { Schema, Document } from 'mongoose';
import { IPurchaseRequest } from '../types';

const purchaseRequestSchema: Schema = new Schema({
  wholesalerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  expectedPrice: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'matched', 'closed'], default: 'open' },
  matchedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

purchaseRequestSchema.index({ wholesalerId: 1, createdAt: -1 });
purchaseRequestSchema.index({ status: 1, category: 1 });

export default mongoose.model<IPurchaseRequest & Document>('PurchaseRequest', purchaseRequestSchema);
