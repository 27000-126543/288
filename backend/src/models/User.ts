import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole, MemberLevel } from '../types';

const userSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  companyName: { type: String },
  address: { type: String },
  avatar: { type: String },
  memberLevel: { 
    type: String, 
    enum: Object.values(MemberLevel), 
    default: MemberLevel.NORMAL 
  },
  creditScore: { type: Number, default: 100 },
  creditLimit: { type: Number, default: 10000 },
  annualTransaction: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IUser & Document>('User', userSchema);
