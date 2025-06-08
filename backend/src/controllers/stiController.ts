import { Router, Request, Response } from 'express';
import mongoose, { ObjectId } from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { IStiTest, StiTest } from '../models/StiTest';
import { StiService } from '../services/stiService';
import { validateStiTest } from '../middlewares/stiValidation';
import { StiRepository } from '../repositories/stiRepository';
import { IUser } from '../models/User';

const router = Router();

//create sti-test API
router.post('/createStiTest', validateStiTest, authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).userId;
        const stiTest = new StiTest({
            ...req.body,
            createdBy: userId
        });
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
router.get('/getAllStiTest', async (req: Request, res: Response): Promise<void> => {

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
router.get('/getStiTest/:id', async (req: Request, res: Response): Promise<void> => {
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

//update sti-test API
router.put('/updateStiTest/:id', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const sti_test_id = req.params.id;
        const user = req.user as any;
        if (!mongoose.Types.ObjectId.isValid(sti_test_id)) {
            res.status(400).json({ success: false, message: 'Invalid test ID' });
            return;
        }

        const updateData: Partial<IStiTest> = {
            sti_test_name: req.body.sti_test_name,
            sti_test_code: req.body.sti_test_code,
            description: req.body.description,
            price: req.body.price,
            duration: req.body.duration,
            isActive: req.body.isActive,
            category: req.body.category,
            sti_test_type: req.body.sti_test_type
        };
        
        const result = await StiService.updateStiTest(sti_test_id, updateData, user);
        if (result.success){
            res.status(200).json(result);
        }
        else if (result.message === 'STI Test not found'){
            res.status(404).json(result);
        }
        else if (result.message === 'Not authorized to update this test'){
            res.status(403).json(result);
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});
export default router;