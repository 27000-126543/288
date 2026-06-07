import { Response } from 'express';
import InspectionReport from '../models/InspectionReport';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';
import { InspectionStatus, UserRole } from '../types';
import crypto from 'crypto';

const generateTraceCode = () => {
  return 'TRACE' + crypto.randomBytes(8).toString('hex').toUpperCase();
};

export const createInspectionReport = async (req: AuthRequest, res: Response) => {
  try {
    const traceCode = generateTraceCode();
    const report = await InspectionReport.create({
      ...req.body,
      merchantId: req.user._id,
      traceCode,
    });
    await Product.findByIdAndUpdate(req.body.productId, {
      inspectionStatus: req.body.overallResult,
      traceCode,
    });
    if (req.body.overallResult === InspectionStatus.FAILED) {
      await Product.findByIdAndUpdate(req.body.productId, { isActive: false });
    }
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyInspectionReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await InspectionReport.find({ merchantId: req.user._id })
      .populate('productId', 'name category')
      .sort('-createdAt');
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInspectionByTraceCode = async (req: AuthRequest, res: Response) => {
  try {
    const report = await InspectionReport.findOne({ traceCode: req.params.traceCode })
      .populate('productId', 'name category origin images')
      .populate('merchantId', 'companyName address phone');
    if (!report) {
      return res.status(404).json({ message: '追溯码不存在' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportNumber, items } = req.body;
    const report = await InspectionReport.findOne({ reportNumber });
    if (!report) {
      return res.status(404).json({ message: '检测报告不存在' });
    }
    let isValid = report.overallResult === InspectionStatus.PASSED;
    if (items) {
      for (const item of items) {
        const reportItem = report.items.find((i: any) => i.name === item.name);
        if (!reportItem || reportItem.result !== item.result) {
          isValid = false;
          break;
        }
      }
    }
    res.json({
      valid: isValid,
      report,
      verificationDate: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
