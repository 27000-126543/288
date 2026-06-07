import mongoose, { Schema, Document } from 'mongoose';
import { IInspectionReport, InspectionStatus } from '../types';

const inspectionReportSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportNumber: { type: String, required: true, unique: true },
  inspectionAgency: { type: String, required: true },
  inspectionDate: { type: Date, required: true },
  items: [{
    name: { type: String, required: true },
    result: { type: String, required: true },
    standard: { type: String }
  }],
  overallResult: { type: String, enum: Object.values(InspectionStatus), required: true },
  reportUrl: { type: String, required: true },
  traceCode: { type: String, required: true, unique: true },
}, { timestamps: true });

inspectionReportSchema.index({ productId: 1 });
inspectionReportSchema.index({ traceCode: 1 });

export default mongoose.model<IInspectionReport & Document>('InspectionReport', inspectionReportSchema);
