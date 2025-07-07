import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { IStiTest, StiTest } from '../models/StiTest';
import { StiService } from '../services/stiService';
import { validateStiTest, validateStiPackage, validateStiOrder } from '../middlewares/stiValidation';
import { IStiPackage, StiPackage } from '../models/StiPackage';
import { JWTPayload } from '../utils/jwtUtils';
import { StiTestScheduleRepository } from '../repositories/stiTestScheduleRepository';
import { stiAuditLogger } from '../middlewares/stiAuditLogger';
import { TargetType } from '../models/StiAuditLog';
import { StiOrder } from '../models/StiOrder';
import { validateStiOrderPagination } from '../middlewares/paginationValidation';
import { StiOrderQuery } from '../dto/requests/StiRequest';

const router = Router();

/**
 * Get STI orders with pagination and filtering
 * GET /api/sti/orders
 */
router.get('/orders',
    authenticateToken,
    authorizeRoles('staff', 'admin', 'manager'),
    validateStiOrderPagination,
    async (req: Request, res: Response) => {
        try {
            const query = req.query as StiOrderQuery;
            const result = await StiService.getStiOrdersWithPagination(query);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Error in STI orders pagination:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: {
                    items: [],
                    pagination: {
                        current_page: 1,
                        total_pages: 0,
                        total_items: 0,
                        items_per_page: 10,
                        has_next: false,
                        has_prev: false
                    },
                    filters_applied: {}
                },
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Get customer's own STI orders with pagination
 * GET /api/sti/my-orders
 */
router.get('/my-orders',
    authenticateToken,
    authorizeRoles('customer'),
    validateStiOrderPagination,
    async (req: Request, res: Response) => {
        try {
            const customer_id = (req.user as any).userId;
            const query = { ...req.query, customer_id } as StiOrderQuery;

            const result = await StiService.getStiOrdersWithPagination(query);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Error in customer STI orders pagination:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: {
                    items: [],
                    pagination: {
                        current_page: 1,
                        total_pages: 0,
                        total_items: 0,
                        items_per_page: 10,
                        has_next: false,
                        has_prev: false
                    },
                    filters_applied: {}
                },
                timestamp: new Date().toISOString()
            });
        }
    }
);

//create sti-test API
router.post('/createStiTest', validateStiTest, authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiTest', 'Create StiTest'), async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('POST /createStiTest - req.body:', req.body);
        const userId = (req.user as any).userId;
        const stiTest = new StiTest({
            ...req.body,
            createdBy: userId
        });
        const result = await StiService.createStiTest(stiTest);
        console.log('POST /createStiTest - result:', result);
        if (result.success) {
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.log('POST /createStiTest - error:', error);
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
        if (result.success) {
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
        if (!mongoose.Types.ObjectId.isValid(sti_test_id)) {
            res.status(400).json({ success: false, message: 'Invalid test ID' });
            return;
        }
        const result = await StiService.getStiTestById(sti_test_id);
        if (result.success) {
            res.status(200).json(result);
        }
        else if (result.message === 'STI Test not found') {
            res.status(404).json(result);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//update sti-test API
router.put('/updateStiTest/:id', validateStiTest, authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiTest', 'Update StiTest'), async (req: Request, res: Response): Promise<void> => {
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
            is_active: req.body.is_active,
            category: req.body.category,
            sti_test_type: req.body.sti_test_type,
            createdBy: user.userId
        };

        const result = await StiService.updateStiTest(sti_test_id, updateData);
        if (result.success) {
            res.status(200).json(result);
        }
        else if (result.message === 'STI Test not found') {
            res.status(404).json(result);
        }
        else if (result.message === 'STI test code already exists') {
            res.status(400).json(result);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//update sti-test API
router.put('/deleteStiTest/:id', authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiTest', 'Delete StiTest'), async (req: Request, res: Response): Promise<void> => {
    try {
        const sti_test_id = req.params.id;
        const userId = (req.user as any).userId;
        const result = await StiService.deleteStiTest(sti_test_id, userId);
        if (!result.success) {
            res.status(404).json(result);
        }
        else res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//create sti-package API
router.post('/createStiPackage', validateStiPackage, authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiPackage', 'Create StiPackage'), async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('POST /createStiPackage - req.body:', req.body);
        const userId = (req.user as any).userId;
        const stiPackage = new StiPackage({
            ...req.body,
            createdBy: userId
        });
        const result = await StiService.createStiPackage(stiPackage);
        console.log('POST /createStiPackage - result:', result);
        if (result.success) {
            const sti_test_ids: string[] = req.body.sti_test_ids;
            await StiService.insertNewStiPackageTests(sti_test_ids, stiPackage);
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.log('POST /createStiPackage - error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//get all sti-package API
router.get('/getAllStiPackage', async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await StiService.getAllStiPackage();
        if (result.success) {
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

//get sti-package by id API
router.get('/getStiPackage/:id', authenticateToken, authorizeRoles('customer', 'staff', 'admin'), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;
        const result = await StiService.getStiPackageById(id);

        if (!result.success) {
            if (result.message === 'Invalid STI Package ID') {
                res.status(400).json(result);
            } else if (result.message === 'STI Package not found') {
                res.status(404).json(result);
            } else {
                res.status(500).json(result);
            }
            return;
        }
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


//update sti-package API
router.put('/updateStiPackage/:id', validateStiPackage, authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiPackage', 'Update StiPackage'), async (req: Request, res: Response): Promise<void> => {
    try {
        const sti_package_id = req.params.id;
        const user = req.user as any;
        if (!mongoose.Types.ObjectId.isValid(sti_package_id)) {
            res.status(400).json({ success: false, message: 'Invalid test ID' });
            return;
        }

        const updateData: Partial<IStiPackage> = {
            sti_package_name: req.body.sti_package_name,
            sti_package_code: req.body.sti_package_code,
            price: req.body.price,
            description: req.body.description,
            is_active: req.body.is_active,
            createdBy: user.userId
        };
        const result = await StiService.updateStiPackage(sti_package_id, updateData);
        if (result.success) {
            const sti_test_ids: string[] = req.body.sti_test_ids;
            await StiService.updateStiPackageTests(sti_package_id, sti_test_ids);
            res.status(200).json(result);
        }
        else if (result.message === 'STIPackage not found') {
            res.status(404).json(result);
        }
        else if (result.message === 'STI package code already exists') {
            res.status(400).json(result);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});
//delete sti-package API
router.put('/deleteStiPackage/:id', authenticateToken, authorizeRoles('staff', 'admin'), stiAuditLogger('StiPackage', 'Delete StiPackage'), async (req: Request, res: Response): Promise<void> => {
    try {
        const sti_package_id = req.params.id;
        const userId = (req.user as any).userId;
        const result = await StiService.deleteStiPackage(sti_package_id, userId);
        if (!result.success) {
            res.status(404).json(result);
        }
        else res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
});

//create orders                                         (post)
router.post('/createStiOrder', validateStiOrder, authenticateToken, authorizeRoles('customer'), stiAuditLogger('StiOrder', 'Create StiOrder'), async (req: Request, res: Response) => {
    try {
        const customer_id = (req.jwtUser as JWTPayload).userId;
        const { sti_package_id, sti_test_items, order_date, notes } = req.body;
        console.log("BODY===>", req.body)
        const result = await StiService.createStiOrder(customer_id, sti_package_id, sti_test_items, order_date, notes);
        if (result.success) {
            return res.status(201).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
//get orders by customer id                                           (get)
router.get('/getAllStiOrders/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const customer_id = req.params.id;
        const result = await StiService.getOrdersByCustomer(customer_id);
        if (result.success) {
            return res.status(200).json(result);
        }
        else if (result.message === 'Customer_id is invalid') {
            return res.status(400).json(result);
        }
        return res.status(404).json(result);
    } catch (error) {
        console.error('Error getting orders by customer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/getAllStiOrders', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const customer_id = (req.user as any).userId;
        const result = await StiService.getOrdersByCustomer(customer_id);
        if (result.success) {
            return res.status(200).json(result);
        }
        else if (result.message === 'Customer_id is invalid') {
            return res.status(400).json(result);
        }
        return res.status(404).json(result);
    } catch (error) {
        console.error('Error getting orders by customer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

//get order by id                                       (get)
router.get('/getStiOrder/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const order_id = req.params.id;
        const result = await StiService.getOrderById(order_id);
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(404).json(result);
    } catch (error) {
        console.error('Error getting orders by customer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

//update order by id
router.patch('/updateStiOrder/:id', authenticateToken, authorizeRoles('customer', 'staff', 'admin'), stiAuditLogger('StiOrder', 'Update Order'), async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = (req.user as any).userId;
    const role = (req.user as any).role;
    const updates = req.body;

    try {
        const result = await StiService.updateOrder(orderId, updates, userId, role);

        if (!result.success && result.message === 'Order not found')
            return res.status(404).json(result);
        if (!result.success && result.message === 'Unauthorized status update')
            return res.status(403).json(result);
        if (!result.success)
            return res.status(400).json(result);

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false, message: 'Server error'
        });
    }
});


router.get('/viewTestScheduleWithOrders', async (req, res) => {
    try {
        // Get all schedules
        const schedules = await StiTestScheduleRepository.getAllStiTestSchedule();

        // With each schedule, get all orders
        const result = await StiService.viewAllOrdersByTestSchedule(schedules);

        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (error) {
        console.error('Error generating test schedule:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/getAllAuditLogs', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const result = await StiService.getAllAuditLog();
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getAllAuditLogs', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        const result = await StiService.getAllAuditLog();
        if (!result.success)
            return res.status(400).json(result);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getRevenueByCustomer/:id', async (req: Request, res: Response) => {
    try {
        const customerId = req.params.id;
        console.log('GET /getRevenueByCustomer - customerId:', customerId);
        const result = await StiService.getTotalRevenueByCustomer(customerId);
        if (result.success === false) {
            if (result.message === 'Invalid customer ID') {
                return res.status(400).json(result);
            } else if (result.message === 'Customer not found') {
                return res.status(404).json(result);
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

router.get('/getTotalRevenue', async (req: Request, res: Response) => {
    try {
        const result = await StiService.getTotalRevenue();
        if (result.success === false) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

export default router;