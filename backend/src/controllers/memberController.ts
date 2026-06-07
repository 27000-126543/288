import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { MemberLevel, UserRole } from '../types';

const getLevelRequirements = (level: MemberLevel) => {
  switch (level) {
    case MemberLevel.SILVER:
      return { annualTransaction: 100000, creditScore: 90 };
    case MemberLevel.GOLD:
      return { annualTransaction: 500000, creditScore: 95 };
    case MemberLevel.DIAMOND:
      return { annualTransaction: 2000000, creditScore: 98 };
    default:
      return { annualTransaction: 0, creditScore: 0 };
  }
};

const getLevelBenefits = (level: MemberLevel) => {
  switch (level) {
    case MemberLevel.DIAMOND:
      return {
        priorityDisplay: true,
        paymentDays: 60,
        freeInspections: 10,
        creditLimitMultiplier: 5,
        discountRate: 0.05,
      };
    case MemberLevel.GOLD:
      return {
        priorityDisplay: true,
        paymentDays: 45,
        freeInspections: 5,
        creditLimitMultiplier: 3,
        discountRate: 0.03,
      };
    case MemberLevel.SILVER:
      return {
        priorityDisplay: false,
        paymentDays: 30,
        freeInspections: 2,
        creditLimitMultiplier: 2,
        discountRate: 0.01,
      };
    default:
      return {
        priorityDisplay: false,
        paymentDays: 15,
        freeInspections: 0,
        creditLimitMultiplier: 1,
        discountRate: 0,
      };
  }
};

export const getMemberInfo = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    const currentLevel = user.memberLevel;
    const levels = [MemberLevel.NORMAL, MemberLevel.SILVER, MemberLevel.GOLD, MemberLevel.DIAMOND];
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    const nextRequirements = nextLevel ? getLevelRequirements(nextLevel) : null;
    const progress = nextRequirements ? {
      annualTransaction: Math.min(100, (user.annualTransaction / nextRequirements.annualTransaction) * 100),
      creditScore: Math.min(100, (user.creditScore / nextRequirements.creditScore) * 100),
    } : null;

    res.json({
      currentLevel,
      benefits: getLevelBenefits(currentLevel),
      nextLevel,
      nextRequirements,
      progress,
      stats: {
        annualTransaction: user.annualTransaction,
        creditScore: user.creditScore,
        creditLimit: user.creditLimit,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkLevelUpgrade = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    let newLevel = user.memberLevel;
    if (user.annualTransaction >= 2000000 && user.creditScore >= 98) {
      newLevel = MemberLevel.DIAMOND;
    } else if (user.annualTransaction >= 500000 && user.creditScore >= 95) {
      newLevel = MemberLevel.GOLD;
    } else if (user.annualTransaction >= 100000 && user.creditScore >= 90) {
      newLevel = MemberLevel.SILVER;
    }
    if (newLevel !== user.memberLevel) {
      user.memberLevel = newLevel;
      const benefits = getLevelBenefits(newLevel);
      user.creditLimit = 10000 * benefits.creditLimitMultiplier;
      await user.save();
      res.json({
        upgraded: true,
        newLevel,
        benefits,
        message: `恭喜！您已升级为${getLevelName(newLevel)}会员`,
      });
    } else {
      res.json({ upgraded: false, currentLevel: user.memberLevel });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const getLevelName = (level: MemberLevel) => {
  const names: Record<MemberLevel, string> = {
    [MemberLevel.NORMAL]: '普通',
    [MemberLevel.SILVER]: '银卡',
    [MemberLevel.GOLD]: '金卡',
    [MemberLevel.DIAMOND]: '钻石',
  };
  return names[level];
};

export const getMemberLevels = async (req: AuthRequest, res: Response) => {
  try {
    const levels = [
      { level: MemberLevel.NORMAL, name: '普通会员', ...getLevelRequirements(MemberLevel.NORMAL), benefits: getLevelBenefits(MemberLevel.NORMAL) },
      { level: MemberLevel.SILVER, name: '银卡会员', ...getLevelRequirements(MemberLevel.SILVER), benefits: getLevelBenefits(MemberLevel.SILVER) },
      { level: MemberLevel.GOLD, name: '金卡会员', ...getLevelRequirements(MemberLevel.GOLD), benefits: getLevelBenefits(MemberLevel.GOLD) },
      { level: MemberLevel.DIAMOND, name: '钻石会员', ...getLevelRequirements(MemberLevel.DIAMOND), benefits: getLevelBenefits(MemberLevel.DIAMOND) },
    ];
    res.json(levels);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
