import mongoose, { Schema, Document } from 'mongoose';
import { IInventory } from '../types';

const inventorySchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  warehouse: { type: String, required: true },
  quantity: { type: Number, required: true },
  minStock: { type: Number, required: true, default: 10 },
  lastRestockDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  lowStockAlert: { type: Boolean, default: false },
  expiryAlert: { type: Boolean, default: false },
});

inventorySchema.index({ merchantId: 1, warehouse: 1 });
inventorySchema.index({ lowStockAlert: 1 });
inventorySchema.index({ expiryAlert: 1 });

export default mongoose.model<IInventory & Document>('Inventory', inventorySchema);
