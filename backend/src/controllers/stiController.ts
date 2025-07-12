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
import { StiOrderQuery, UpdateStiResultRequest } from '../dto/requests/StiRequest';
import { validateAuditLogPagination } from '../middlewares/paginationValidation';
import { AuditLogQuery } from '../dto/requests/AuditLogRequest';
import { StiResultRepository } from '../repositories/stiResultRepository';

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
    authorizeRoles('staff', 'admin', 'manager'),
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
        const customer_id = (req.user as any).userId;
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
router.patch('/updateStiOrder/:id', authenticateToken, authorizeRoles('customer', 'staff', 'admin', 'consultant'), stiAuditLogger('StiOrder', 'Update Order'), async (req: Request, res: Response) => {
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

/*
* api tạo mới một sti-result theo sti_order_id sẽ lấy khi nhấn vào 1 order nào đó trên frontend(truyền qua query)
* (làm theo kiểu bấm tạo result cái nào thì lấy từ đó)
*/
router.post('/sti-result', authenticateToken, authorizeRoles('staff', 'consultant'), async (req: Request, res: Response): Promise<void> => {
    try {
        const order_id  = req.query.orderId.toString();

        if (!order_id) {
            res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
            return;
        }

        // Check if STI Result already exists for this order
        const existingResults = await StiResultRepository.findExistedResult(order_id);
        if (existingResults) {
            res.status(409).json({
                success: false,
                message: 'STI Result already exists for this order',
                data: existingResults
            });
            return;
        }

        const additionalData = req.body || {};
        const result = await StiService.createStiResult(order_id, additionalData);
        if (result.success)
            res.status(201).json(result);
        else res.status(400).json(result);
    } catch (error) {
        console.error('Error creating STI Result:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

//api lấy sti-result, nếu có query orderId thì sẽ lấy theo orderId, không thì lấy hết
router.get('/sti-result', authenticateToken, authorizeRoles('staff', 'consultant', 'customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const order_id  = req.query.orderId?.toString();
        const {userId, role} = req.user as JWTPayload; 
        const result = (order_id) ? await StiService.getStiResultByOrderId(order_id, userId, role): await StiService.getAllStiResult();

        if (!result.success) {
            res.status(404).json(result);
        }
        else res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching STI Result:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.get('/sti-result/notify', authenticateToken, authorizeRoles('staff', 'consultant'), async (req: Request, res: Response): Promise<void> => {
    try {
        const stiResultId = req.query.result_id.toString();

        if (!stiResultId) {
            res.status(400).json({
                success: false,
                message: 'Result id is not found'
            });
            return;
        }

        const result = await StiService.sendStiResultNotificationFromDB(stiResultId);

        if (!result.success) {
            res.status(400).json(result);
            return;
        }
        await StiResultRepository.updateById(stiResultId, {
            is_notified: true
        });
<<<<<<< HEAD
=======

>>>>>>> 234d4f5ae314bf5ec8c39bd9633ea41e9c634320
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

//api lấy từ sti_result_id
router.get('/sti-result/:id', authenticateToken, authorizeRoles('staff', 'consultant', 'customer'), async (req: Request, res: Response): Promise<void> => {
    try {
        const result_id  = req.params.id;
        console.log(result_id)
        const result = await StiService.getStiResultById(result_id)

        if (!result.success) {
            res.status(404).json(result);
        }
        else res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching STI Result:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * update từ việc nhập frontend, có thể dùng để xóa mềm luôn (bằng cách truyền vào is_active = false)
 * sample: có 3 thuộc tính
    * thuộc tính sampleQualities có thể cập nhật phần value trong bộ <key:value>, với value = boolean | null, nhưng ko được cập nhật key,
    nếu ko sẽ báo lỗi
    * hai thuộc tính còn lại vẫn gửi từ frontend bình thường, nhưng chú ý vì nó là 1 phần của sample nên phải gửi trong object
    vd: "sample": {
            "sampleQualities": {
                "máu": false,
                "dịch ngoáy": true
            },
            "timeReceived": "2025-07-08T10:00:00.000Z",
            "timeTesting": "2025-07-08T12:00:00.000Z"
        },
 * Những thuộc tính dưới đây sẽ lấy từ frontend:
        time_result?: Date;         => thời gian nhận kết quả
        result_value?: string;      => kết quả
        diagnosis?: string;         
        is_confirmed: boolean;      => confirm by consultant (bắt buộc phải là consultant trong order)
        is_critical?: boolean;      => đã thông qua hay chưa để trả về cho customer chưa
        notes?: string;             
        is_active: boolean;         => deactivation result
 */

router.patch('/sti-result/:id', authenticateToken, authorizeRoles('staff', 'consultant'), async (req: Request, res: Response): Promise<void> => {
        try {
            const result_id = req.params.id;
            const user_id = (req.user as any).userId;
            const updateData: UpdateStiResultRequest = req.body;
            // Validate at least one field is provided for update
            const allowedFields = [
                'sample', 'time_result', 'result_value', 'diagnosis', 
                'is_confirmed', 'is_critical', 'is_notified', 'notes', 'is_active'
            ];
            
            const hasValidField = allowedFields.some(field => 
                updateData[field as keyof UpdateStiResultRequest] !== undefined
            );

            if (!hasValidField) {
                res.status(400).json({
                    success: false,
                    message: 'At least one field for updating'
                });
                return;
            }

            // Call service to update
            const result = await StiService.updateStiResult(result_id, updateData, user_id);

            if (result.success) {
                res.status(200).json(result);
            } else if (result.message === 'Cannot find the sti result') {
                res.status(404).json(result);
            } else if (result.message === 'Sti result is deactivated') {
                res.status(409).json(result);
            }
            else res.status(400).json(result);
        } catch (error) {
            console.error('StiResultController - updateStiResult error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
});

// API đồng bộ sample từ order, truyền order id từ query vào khi nhấn vào result của order tương ứng (1:1)
router.patch('/sti-result/sync-sample', authenticateToken, authorizeRoles('staff', 'consultant'), async (req: Request, res: Response): Promise<void> => {
    try {
        const order_id = req.query.orderId.toString();
        
        if (!order_id) {
            res.status(400).json({
                success: false,
                message: 'order id is required'
            });
            return;
        }

        const result = await StiService.syncSampleFromOrder(order_id);
        
        if (!result.success) {
            res.status(400).json(result);
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        console.error('Error syncing sample from order:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;