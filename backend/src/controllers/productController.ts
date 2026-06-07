import { Response } from 'express';
import Product from '../models/Product';
import PurchaseRequest from '../models/PurchaseRequest';
import { AuthRequest } from '../middleware/authMiddleware';
import { InspectionStatus, UserRole } from '../types';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { category, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    let query: any = { isActive: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const products = await Product.find(query)
      .populate('merchantId', 'username companyName')
      .sort(sort as string)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));
    const total = await Product.countDocuments(query);
    res.json({ products, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchantId', 'username companyName phone');
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== UserRole.MERCHANT) {
      return res.status(403).json({ message: '只有商户可以发布商品' });
    }
    const product = await Product.create({
      ...req.body,
      merchantId: req.user._id,
      historicalPrices: [{ date: new Date(), price: req.body.price }],
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    if (product.merchantId.toString() !== req.user._id.toString() && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '无权限修改此商品' });
    }
    if (req.body.price && req.body.price !== product.price) {
      req.body.historicalPrices = [...product.historicalPrices, { date: new Date(), price: req.body.price }];
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    if (product.merchantId.toString() !== req.user._id.toString() && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '无权限删除此商品' });
    }
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: '商品已下架' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSmartRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const { category, budget, quantity } = req.query;
    const products = await Product.find({
      isActive: true,
      inspectionStatus: InspectionStatus.PASSED,
      ...(category && { category }),
      ...(budget && { price: { $lte: Number(budget) } }),
    })
      .sort({ seasonalTrend: -1, price: 1 })
      .limit(10)
      .populate('merchantId', 'username companyName');
    
    const recommendations = products.map(p => ({
      product: p,
      score: calculateScore(p),
      reason: generateReason(p),
    }));
    res.json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const calculateScore = (product: any) => {
  let score = 0;
  score += (100 - product.price / 10) * 0.4;
  score += product.seasonalTrend * 0.3;
  score += (product.stock > 50 ? 30 : product.stock * 0.6) * 0.3;
  return Math.round(score);
};

const generateReason = (product: any) => {
  const reasons = [];
  if (product.price < product.historicalPrices[0]?.price) reasons.push('价格处于历史低位');
  if (product.seasonalTrend > 50) reasons.push('当季热销商品');
  if (product.stock > 100) reasons.push('库存充足');
  if (product.inspectionStatus === InspectionStatus.PASSED) reasons.push('已通过食品安全检测');
  return reasons.join('，') || '优质推荐';
};

export const createPurchaseRequest = async (req: AuthRequest, res: Response) => {
  try {
    const purchaseRequest = await PurchaseRequest.create({
      ...req.body,
      wholesalerId: req.user._id,
    });
    const matchedProducts = await Product.find({
      category: req.body.category,
      isActive: true,
      stock: { $gte: req.body.quantity * 0.5 },
    }).limit(5);
    purchaseRequest.matchedProducts = matchedProducts.map(p => p._id);
    await purchaseRequest.save();
    res.status(201).json({ purchaseRequest, matchedProducts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPurchaseRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await PurchaseRequest.find({ wholesalerId: req.user._id })
      .populate('matchedProducts')
      .sort('-createdAt');
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
