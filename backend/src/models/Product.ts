import mongoose, { Schema, Document } from 'mongoose';
import { IProduct, InspectionStatus } from '../types';

const productSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  specifications: [{ type: String }],
  images: [{ type: String }],
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  origin: { type: String, required: true },
  warehouse: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  shelfLife: { type: Number, required: true },
  productionDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  inspectionStatus: { 
    type: String, 
    enum: Object.values(InspectionStatus), 
    default: InspectionStatus.PENDING 
  },
  traceCode: { type: String, unique: true, sparse: true },
  seasonalTrend: { type: Number, default: 0 },
  historicalPrices: [{
    date: { type: Date, default: Date.now },
    price: { type: Number, required: true }
  }],
}, { timestamps: true });

productSchema.index({ name: 'text', category: 'text', description: 'text' });
productSchema.index({ merchantId: 1, isActive: 1 });

export default mongoose.model<IProduct & Document>('Product', productSchema);
