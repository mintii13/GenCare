import { Request, Response, NextFunction } from 'express';
import { Consultant } from '../models/Consultant';

export const validateConsultant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtUser?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const consultant = await Consultant.findOne({ user_id: userId });
    
    if (!consultant) {
      return res.status(403).json({
        success: false,
        message: 'User không phải là consultant hợp lệ'
      });
    }

    // Thêm thông tin consultant vào request để các middleware/controller sau có thể sử dụng
    (req as any).consultant = consultant;
    
    next();
  } catch (error) {
    console.error('Validate consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực consultant'
    });
  }
};
