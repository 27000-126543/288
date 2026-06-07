import { Response } from 'express';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../types';

export const getMyInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouse, lowStock, expiring } = req.query;
    let query: any = { merchantId: req.user._id };
    if (warehouse) query.warehouse = warehouse;
    if (lowStock === 'true') query.lowStockAlert = true;
    if (expiring === 'true') query.expiryAlert = true;

    const inventory = await Inventory.find(query)
      .populate('productId', 'name category price unit images')
      .sort('-createdAt');
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInventory = async (req: AuthRequest, res: Response) => {
  try {
    const { quantity, minStock } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: '库存记录不存在' });
    }
    if (inventory.merchantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作此库存' });
    }
    inventory.quantity = quantity;
    inventory.minStock = minStock;
    inventory.lowStockAlert = quantity <= minStock;
    if (quantity > inventory.quantity) {
      inventory.lastRestockDate = new Date();
    }
    await inventory.save();
    await Product.findByIdAndUpdate(inventory.productId, { stock: quantity });
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInventory = async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await Inventory.create({
      ...req.body,
      merchantId: req.user._id,
      lowStockAlert: req.body.quantity <= req.body.minStock,
    });
    await Product.findByIdAndUpdate(req.body.productId, { stock: req.body.quantity });
    res.status(201).json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const lowStock = await Inventory.countDocuments({
      merchantId: req.user._id,
      lowStockAlert: true,
    });
    const expiring = await Inventory.countDocuments({
      merchantId: req.user._id,
      expiryAlert: true,
    });
    const restockSuggestions = await Inventory.find({
      merchantId: req.user._id,
      quantity: { $lte: 5 },
    }).populate('productId', 'name category');

    res.json({
      lowStockCount: lowStock,
      expiringCount: expiring,
      restockSuggestions: restockSuggestions.map(item => ({
        product: item.productId,
        currentStock: item.quantity,
        suggestedAmount: item.minStock * 2,
        urgency: item.quantity <= item.minStock * 0.3 ? 'high' : 'medium',
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
