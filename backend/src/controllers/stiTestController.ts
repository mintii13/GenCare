import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/jwtMiddleware';
import STITest,{ ISTITest } from '../models/STITest';
import Customer, { ICustomer } from '../models/Customer';
import User, { IUser } from '../models/User';

const router = Router();

// API lưu kết quả kiểm tra STI, chỉ cho phép customer đã đăng nhập
router.post('/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Lấy userId từ token
    const userId = (req.user as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    // Join User và Customer
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    const customer = await Customer.findOne({ user_id: userId }).lean();
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy customer' });

    // Lấy data từ body
    const {
      gender, ageGroup, sexualActivity, symptoms, symptomDetails, duration, severity,
      recentRisks, sexType, pastSTIs, lastTest, purpose, urgency, budget, result
    } = req.body;

    // Tạo bản ghi STI Test
    const stiTest = await STITest.create({
      userId,
      customer_id: customer.customer_id,
    //   medical_history: customer.medical_history,
    //   custom_avatar: customer.custom_avatar,
      gender, ageGroup, sexualActivity, symptoms, symptomDetails, duration, severity,
      recentRisks, sexType, pastSTIs, lastTest, purpose, urgency, budget, result
    });

    res.json({ success: true, stiTest });
  } catch (error) {
    console.error('STI Test submit error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

// (Có thể bổ sung API GET lịch sử kiểm tra nếu cần)

export default router; 