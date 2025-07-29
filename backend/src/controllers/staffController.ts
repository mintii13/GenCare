import { Router } from 'express';
import { StaffService } from '../services/staffService';
import { authenticateToken } from '../middlewares/jwtMiddleware';
import { Staff } from '../models/Staff';
const router = Router();

router.get('/dropdown', async (req, res) => {
    try {
        const result = await StaffService.getDropdownStaffs();
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error'
        });
    }
});

router.get('/by-user', authenticateToken, async (req, res) => {
  const userId = req.jwtUser.userId;
  try {
    const staff = await Staff.findOne({ user_id: userId }).populate('user_id');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    return res.status(200).json({
        success:true, message: "Fetch staff by user id successfully", data: staff
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;