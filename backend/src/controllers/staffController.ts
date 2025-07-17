import { Router } from 'express';
import { StaffService } from '../services/staffService';
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
export default router;