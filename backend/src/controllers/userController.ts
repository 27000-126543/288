import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../types';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    let query: any = {};
    if (role) query.role = role;
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));
    const total = await User.countDocuments(query);
    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCreditInfo = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({
      creditScore: user.creditScore,
      creditLimit: user.creditLimit,
      availableCredit: user.creditLimit,
      annualTransaction: user.annualTransaction,
      memberLevel: user.memberLevel,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const makePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, amount } = req.body;
    res.json({
      success: true,
      transactionId: 'TXN' + Date.now(),
      amount,
      paymentDate: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentReminders = async (req: AuthRequest, res: Response) => {
  try {
    const reminders = [
      {
        id: '1',
        orderNo: 'ORD202401001',
        amount: 5000,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        daysLeft: 3,
        status: 'upcoming',
      },
      {
        id: '2',
        orderNo: 'ORD202401002',
        amount: 3000,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        daysLeft: -1,
        status: 'overdue',
      },
    ];
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
