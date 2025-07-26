import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { IStiTest, StiTest } from '../models/StiTest';
import { StiService } from '../services/stiService';
import { validateStiTest, validateStiPackage, validateStiOrderUpdate, validateStiOrderCreate } from '../middlewares/stiValidation';
import { IStiPackage, StiPackage } from '../models/StiPackage';
import { JWTPayload } from '../utils/jwtUtils';
import { StiTestScheduleRepository } from '../repositories/stiTestScheduleRepository';
import { stiAuditLogger } from '../middlewares/stiAuditLogger';
import { TargetType } from '../models/StiAuditLog';
import { StiOrder } from '../models/StiOrder';
import { validateStiOrderPagination } from '../middlewares/paginationValidation';
import { StiOrderQuery } from '../dto/requests/StiRequest';
import { validateAuditLogPagination } from '../middlewares/paginationValidation';
import { AuditLogQuery } from '../dto/requests/AuditLogRequest';
import { StiResultRepository } from '../repositories/stiResultRepository';
import { StiOrderRepository } from '../repositories/stiOrderRepository';
import session from 'express-session';
import { StiTestRepository } from '../repositories/stiTestRepository';
import { StiResult } from '../models/StiResult';
import { StiPackageTest } from '../models/StiPackageTest';

const router = Router();
/**
 * Get audit logs with pagination and filtering
 * GET /api/sti/audit-logs
 * 
 * Query parameters:
 * - page: số trang (default: 1)
 * - limit: số item per page (default: 10, max: 100)
 * - sort_by: field để sort (default: timestamp)
 * - sort_order: asc/desc (default: desc - newest first)
 * - target_type: filter theo target type
 * - target_id: filter theo target ID
 * - user_id: filter theo user ID
 * - action: filter theo action (partial match)
 * - date_from: filter từ ngày (YYYY-MM-DD)
 * - date_to: filter đến ngày (YYYY-MM-DD)
 */
router.get('/audit-logs',
    authenticateToken,
    authorizeRoles('admin'),
    validateAuditLogPagination,
    async (req: Request, res: Response) => {
        try {
            const query = req.query as AuditLogQuery;
            const result = await StiService.getAuditLogsWithPagination(query);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Error in audit logs pagination:', error);
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
 * Get STI orders with pagination and filtering
 * GET /api/sti/orders
 */
router.get('/orders',
    authenticateToken,
    authorizeRoles('staff', 'admin', 'consultant'),
    validateStiOrderPagination,
    async (req: Request, res: Response) => {
        try {
            const query = req.query as StiOrderQuery;
            const result = await StiService.getStiOrdersWithPagination(query);
            
            console.log('📊 [DEBUG] Service result:', {
                success: result.success,
                message: result.message,
                itemsCount: result.data?.items?.length || 0,
                totalItems: result.data?.pagination?.total_items || 0
            });

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error in STI orders pagination:', error);
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
            created_by: userId
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
            created_by: user.userId
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
            created_by: userId
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
            created_by: user.userId
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

router.get('/getStiTestByPackageId/:id', authenticateToken, async (req: Request, res: Response) => {
    const sti_package_id  = req.params.id;
  
    if (!sti_package_id) {
      return res.status(400).json({
        success: false,
        message: 'sti_package_id is required'
      });
    }
    try {
      const packageTests = await StiPackageTest.find({
        sti_package_id,
        is_active: true
      }).populate('sti_test_id');
  
      const stiTests = packageTests.map(item => item.sti_test_id);
  
      return res.status(200).json({
        success: true,
        message: 'STI tests fetched successfully',
        data: stiTests
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching STI tests',
        error: error.message
      });
    }});
//create orders                                         (post)
router.post('/createStiOrder', validateStiOrderCreate, authenticateToken, authorizeRoles('customer'), stiAuditLogger('StiOrder', 'Create StiOrder'), async (req: Request, res: Response) => {
    try {
        const customer_id = (req.user as any).userId;
        const {order_date, notes } = req.body;
        console.log("BODY===>", req.body)
        
        // Convert order_date string to Date object
        const orderDate = new Date(order_date);
        
        const result = await StiService.createStiOrder(customer_id, orderDate, notes);
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
router.patch('/updateStiOrder/:id', validateStiOrderUpdate, authenticateToken, authorizeRoles('customer', 'staff', 'admin', 'consultant'), stiAuditLogger('StiOrder', 'Update Order'), async (req: Request, res: Response) => {
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
/**
 * PATCH /api/sti/order/:orderId/status
 * Cập nhật trạng thái STI order (cho staff/consultant)
 */
router.patch('/order/:orderId/status',
    authenticateToken,
    authorizeRoles('staff', 'consultant', 'admin'), stiAuditLogger('StiOrder', 'Update Sti Order Status'),
    async (req: Request, res: Response) => {
        try {
            const orderId  = req.params.orderId;
            const {order_status, is_paid} = req.body;
            const user = req.jwtUser as JWTPayload;

            if (!order_status) {
                return res.status(400).json({
                    success: false,
                    message: 'Order status is required'
                });
            }

            const updateData: any = { order_status, is_paid };

            const result = await StiService.updateOrder(orderId, updateData, user.userId, user.role);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Order status updated successfully',
                    data: result.data
                });
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * Get available status transitions for an order
 * GET /api/sti/orders/:id/available-transitions
 */
// router.get('/orders/:id/available-transitions', authenticateToken, authorizeRoles('staff', 'admin', 'consultant'), async (req: Request, res: Response) => {
//     try {
//         const orderId = req.params.id;
//         const order = await StiOrderRepository.findOrderById(orderId);
        
//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Order not found'
//             });
//         }
//         const { getAvailableTransitions } = await import('../middlewares/stiValidation');
//         const availableTransitions = getAvailableTransitions(order.order_status, order.is_paid);

//         return res.status(200).json({
//             success: true,
//             message: 'Available transitions retrieved successfully',
//             data: {
//                 current: {
//                     order_status: order.order_status,
//                     is_paid: order.is_paid
//                 },
//                 available: availableTransitions
//             }
//         });
//     } catch (error) {
//         console.error('Error getting available transitions:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error'
//         });
//     }
// });

router.get('/sti-test/dropdown/:orderId', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const result = await StiService.getStiTestDropdownByOrderId(orderId);
        
        return (result.success) 
            ? res.status(200).json(result)
            : res.status(400).json(result);
    } catch (error) {
        console.error('Error fetching STI tests for dropdown:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/sti-result/:orderId', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const { sti_result_items } = req.body;
        const order_id = req.params.orderId;
        const user = req.user as any;

        if (!sti_result_items || !Array.isArray(sti_result_items)) {
            return res.status(400).json({
                success: false,
                message: 'Missing or invalid sti_result_items'
            });
        }

        const existing = await StiResultRepository.findByOrderId(order_id);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'STI result already exists. Use UPDATE to update items.'
            });
        }

        const resultItems = [];

        for (const item of sti_result_items) {
            const { sti_test_id, result } = item;

            if (!sti_test_id || !result?.sample_quality)
                continue;

            const sti_test_type = await StiTestRepository.getStiTestTypeById(sti_test_id);
            if (!sti_test_type)
                continue;

            const resultItem = await StiService.buildStiResultItem(user, sti_test_id, sti_test_type, result);
            if (resultItem) {
                resultItems.push(resultItem);
            }
        }

        if (resultItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid STI result items to create'
            });
        }

        const finalResult = new StiResult({
            sti_order_id: order_id,
            sti_result_items: resultItems
        });

        const savedResult = await finalResult.save();

        return res.status(201).json({
            success: true,
            message: 'Created STI results successfully',
            data: savedResult
        });

    } catch (error) {
        console.error('Error creating STI results:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});


router.patch('/sti-result/:orderId', authenticateToken, authorizeRoles('staff', 'admin', 'consultant'), async (req: Request, res: Response) => {
    try {
        const order_id = req.params.orderId;
        const user = req.user as any;
        const { sti_result_items, diagnosis, is_confirmed, medical_notes } = req.body;
        
        // Validate: chỉ chấp nhận 1 item duy nhất
        if (!sti_result_items || !Array.isArray(sti_result_items) || sti_result_items.length !== 1) {
            if (!diagnosis && !is_confirmed && !medical_notes){
                return res.status(400).json({
                    success: false,
                    message: 'You must provide exactly one result item to update.'
                });
            }
        }
        let updateResult = null;
        if (!diagnosis && !is_confirmed && !medical_notes){
            const { sti_test_id, result } = sti_result_items[0];
  
            if (!sti_test_id || !result?.sample_quality) {
                return res.status(400).json({
                success: false,
                message: 'Missing sti_test_id or sample_quality in result'
                });
            }
    
            const sti_test_type = await StiTestRepository.getStiTestTypeById(sti_test_id);
            if (!sti_test_type) {
                return res.status(400).json({
                success: false,
                message: 'Invalid sti_test_id'
                });
            }
            updateResult = await StiService.updateStiResult(
                user,
                order_id,
                sti_test_id,
                sti_test_type,
                result.sample_quality,
                result.urine,
                result.blood,
                result.swab
            );
        }
        else{
            updateResult = await StiService.updateStiResult(
                user,
                order_id,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                diagnosis,
                is_confirmed,
                medical_notes
            );
        }
        
      if (!updateResult || !updateResult.success) {
        return res.status(400).json({
          success: false,
          message: updateResult?.message || 'Failed to update result'
        });
      }
  
      return res.status(200).json(updateResult);
  
    } catch (error) {
      console.error('Error updating STI result:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  

router.get('/sti-test/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await StiOrderRepository.getStiTestInOrder(orderId);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order is not found'
        });
    }

    // Gộp và loại bỏ trùng lặp test (nếu có)
    const packageTests = order.sti_package_item?.sti_test_ids || [];
    const singleTests = order.sti_test_items || [];

    const allTests = [...packageTests, ...singleTests];
    const uniqueTestsMap = new Map<string, any>();

    allTests.forEach(test => {
        uniqueTestsMap.set(test._id.toString(), test);
    });

    return res.json({
        success: true,
        message: 'Fetch tests from order successfully',
        data: Array.from(uniqueTestsMap.values())
    });
  } catch (error) {
    console.error('Error fetching STI tests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/my-results', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const user = req.user as any; // giả sử user đã được decode trong middleware

        const results = await StiResultRepository.getStiResultsByCustomerId(user._id);
        if (!results){
            return res.status(400).json({
                success: false,
                message: 'Get results by user fail'
            })
        }
        return res.status(200).json({
            success: true,
            message: 'Get results by user successfully',
            data: results
        });
    } catch (error) {
        console.error('Error fetching my STI results:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.get('/my-result/:orderId', authenticateToken, authorizeRoles('customer'), async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const orderId = req.params.orderId;

        const result = await StiResultRepository.getMyStiResultByOrder(user, orderId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'No STI result found for this order.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Fetch result by order and user successfully',
            data: result
        });
    } catch (error) {
        console.error('Error fetching STI result:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.get('/sti-result/:orderId', authenticateToken, authorizeRoles('staff', 'admin', 'customer'), async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        if (!orderId){
            return res.status(400).json({
                success: false,
                message: 'Order id not found'
            });
        }
        const result = await StiService.getStiResultByOrderId(orderId);
        if (!result.success){
            return res.status(404).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error getting STI result:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/sti-test/non-updated/:orderId', authenticateToken, authorizeRoles('staff', 'admin', 'customer'), async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const stiOrder = await StiOrderRepository.getStiTestInOrder(orderId);
        if (!stiOrder) 
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        // Kết hợp cả 2 nguồn test (nếu có)
        const stiTestsRaw: any[] = [
            ...(stiOrder.sti_test_items || []),
            ...(stiOrder.sti_package_item?.sti_test_ids || [])
          ];
          
        // Lọc unique theo _id
        const stiTests = Array.from(
            new Map(stiTestsRaw.map(test => [test._id.toString(), test])).values()
        );
        const stiResult = await StiResult.findOne({ sti_order_id: orderId });
        const updatedTestIds = stiResult?.sti_result_items?.map(item => item.sti_test_id.toString()) || [];
        
        const nonUpdatedTests = stiTests.filter(test => !updatedTestIds.includes(test._id.toString()));
        
        res.status(200).json({
            success: true,
            message: 'Fetched non-updated tests',
            data: nonUpdatedTests,
        });
    } catch (error) {
        console.error('Error Getting non-updated tests:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

  
export default router;