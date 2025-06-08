import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { StiTest } from '../models/StiTest';
import { StiService } from '../services/stiService';
import { validateStiTest } from '../middlewares/stiValidation';

const router = Router();

//create sti-test API
router.post('/createStiTest', validateStiTest, authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        const stiTest = new StiTest(req.body);
        stiTest.sti_test_id = stiTest._id;
        const result = await StiService.createStiTest(stiTest, userId);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//get all sti-test API
router.get('/getAllStiTest', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await StiService.getAllStiTest();
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//get sti-test API
router.get('/getStiTest/:id', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const sti_test_id = req.params.id;
        const result = await StiService.getStiTestById(sti_test_id);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

export default router;