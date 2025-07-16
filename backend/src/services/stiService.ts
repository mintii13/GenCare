import { AllStiTestResponse, StiTestResponse, StiPackageResponse, AllStiPackageResponse, StiOrderResponse, AllStiOrderResponse } from '../dto/responses/StiResponse';
import { IStiTest, StiTest, TestTypes } from '../models/StiTest';
import { StiTestRepository } from "../repositories/stiTestRepository";
import { IStiPackage } from "../models/StiPackage";
import { StiPackageRepository } from "../repositories/stiPackageRepository";
import { IStiOrder, StiOrder } from '../models/StiOrder';
import { StiOrderRepository } from '../repositories/stiOrderRepository';
import { StiPackageTestRepository } from '../repositories/stiPackageTestRepository';
import mongoose from 'mongoose';
import { IStiTestSchedule, StiTestSchedule } from '../models/StiTestSchedule';
import { StiTestScheduleRepository } from '../repositories/stiTestScheduleRepository';
import { validTransitions } from '../middlewares/stiValidation';
import { StiAuditLogRepository } from '../repositories/stiAuditLogRepository';
import { MailUtils } from '../utils/mailUtils';
import { UserRepository } from '../repositories/userRepository';
import { StiOrderQuery, UpdateStiResultRequest } from '../dto/requests/StiRequest';
import { StiOrderPaginationResponse } from '../dto/responses/StiOrderPaginationResponse';
import { PaginationUtils } from '../utils/paginationUtils';
import { AuditLogQuery } from '../dto/requests/AuditLogRequest';
import { AuditLogPaginationResponse } from '../dto/responses/AuditLogPaginationResponse';
import { StiResultRepository } from '../repositories/stiResultRepository';
import { IStiResult, Sample } from '../models/StiResult';
import { ConsultantRepository } from '../repositories/consultantRepository';

export class StiService {
    public static async createStiTest(stiTest: IStiTest): Promise<StiTestResponse> {
        try {
            const duplicate = await StiTestRepository.findByStiTestCode(stiTest.sti_test_code);
            if (duplicate){
                if (duplicate.is_active){
                    return{
                        success: false,
                        message: 'Sti test code is duplicated'
                    }
                }
                else {
                    //update is_active thành true
                    const result = await StiTestRepository.updateIsActive(duplicate._id);
                    return{
                        success: true,
                        message: 'Insert StiTest to database successfully',
                        stitest: result
                    }
                }
            }
            const result: Partial<IStiTest> = await StiTestRepository.insertStiTest(stiTest);
            if (!result){
                return{
                    success: false,
                    message: 'Cannot insert StiTest to database'
                }
            }
            return {
                success: true,
                message: 'Insert StiTest to database successfully',
                stitest: result
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiTest(): Promise<AllStiTestResponse> {
        try {
            const allOfTest = await StiTestRepository.getAllStiTest();
            if (!allOfTest){
                return{
                    success: false,
                    message: 'Fail in getting Sti Test'
                }
            }
            const activeTests = allOfTest.filter(test => test.is_active === true);
            return {
                success: true,
                message: 'Get STI tests successfully',
                stitest: activeTests
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getStiTestById(id: string): Promise<StiTestResponse> {
        try {
            const stiTest = await StiTestRepository.getStiTestById(id);
            if (!stiTest && !stiTest.is_active === false) {
                return {
                    success: false,
                    message: 'STI Test not found'
                };
            }

            return {
                success: true,
                message: 'STI Test fetched successfully',
                stitest: stiTest
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    public static async updateStiTest(sti_test_id: string, updateData: Partial<IStiTest>): Promise<StiTestResponse> {
        try {
            // Tìm bản ghi khác có cùng mã nhưng không phải bản ghi đang update
            const exists = await StiTest.findOne({ sti_test_code: updateData.sti_test_code, _id: { $ne: sti_test_id } });
            // if (exists && exists._id.toString() !== sti_test_id) {
            if (exists) {
                return {
                    success: false,
                    message: 'STI test code already exists',
                };
            }
            const sti_test = await StiTestRepository.findByIdAndUpdateStiTest(sti_test_id, updateData);
            if (!sti_test) {
                return {
                    success: false,
                    message: 'StiTest not found or you are not authorized to update it'
                }
            }
          
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return {
                success: true,
                message: 'Update STI Test successfully',
                stitest: sti_test
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    public static async deleteStiTest(sti_test_id: string, userId: string): Promise<StiTestResponse> {
        try {
            const updated = await StiTestRepository.findByIdAndUpdate(sti_test_id, userId);
            if (!updated) {
                return {
                    success: false,
                    message: 'StiTest not found or you are not authorized to delete it'
                };
            }

            return {
                success: true,
                message: 'StiTest is deleted successfully',
                stitest: updated
            };

        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }


    public static async createStiPackage(stiPackage: IStiPackage): Promise<StiPackageResponse> {
        try {
            const duplicate = await StiPackageRepository.findByStiPackageCode(stiPackage.sti_package_code);
            if (duplicate) {
                if (duplicate.is_active) {
                    return {
                        success: false,
                        message: 'Sti package code is duplicated'
                    }
                }
                else {
                    //update is_active thành true
                    const result = await StiPackageRepository.updateIsActive(duplicate._id);
                    return {
                        success: true,
                        message: 'Insert StiPackage to database successfully',
                        stipackage: result
                    }
                }
            }
            const result: Partial<IStiPackage> = await StiPackageRepository.insertStiPackage(stiPackage);
            if (!result) {
                return {
                    success: false,
                    message: 'Cannot insert StiPackage to database'
                }
            }
            return {
                success: true,
                message: 'Insert StiPackage to database successfully',
                stipackage: result
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiPackage(): Promise<AllStiPackageResponse> {
        try {
            const allOfTest = await StiPackageRepository.getAllStiTPackage();
            if (!allOfTest) {
                return {
                    success: false,
                    message: 'Fail in getting StiPackage'
                }
            }
            const activeTests = allOfTest.filter(test => test.is_active);

            return {
                success: true,
                message: 'Get STI packages successfully',
                stipackage: activeTests
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getStiPackageById(sti_package_id: string): Promise<StiPackageResponse> {
        try {
            const stiPackage = await StiPackageRepository.findPackageById(sti_package_id);
            if (!stiPackage) {
                return {
                    success: false,
                    message: 'STI Package not found'
                };
            }
            return {
                success: true,
                message: 'Fetched STI Package successfully',
                stipackage: stiPackage
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }


    public static async updateStiPackage(sti_package_id: string, updateData: Partial<IStiPackage>): Promise<StiPackageResponse> {
        try {
            const exists = await StiPackageRepository.findByStiPackageCode(updateData.sti_package_code);
            if (exists && exists._id.toString() !== sti_package_id) {
                return {
                    success: false,
                    message: 'STI package code already exists',
                };
            }
            const sti_package = await StiPackageRepository.findByIdAndUpdateStiPackage(sti_package_id, updateData);
            if (!sti_package) {
                return {
                    success: false,
                    message: 'STIPackage not found'
                }
            }
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return {
                success: true,
                message: 'Update STIPackage successfully',
                stipackage: sti_package
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    public static async deleteStiPackage(sti_package_id: string, userId: string): Promise<StiPackageResponse> {
        try {
            const updated = await StiPackageRepository.findByIdAndDeactivate(sti_package_id, userId);
            if (!updated) {
                return {
                    success: false,
                    message: 'StiPackage not found or you are not authorized to update it'
                };
            }

            return {
                success: true,
                message: 'StiPackage deactivated successfully',
                stipackage: updated
            };

        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    private static async handleStiPackage(sti_package_id: string) {
        const stiPackage = await StiPackageRepository.findPackageById(sti_package_id);
        if (!stiPackage) {
            return {
                success: false,
                message: 'StiPackage is not found'
            };
        }

        const stiPackageTests = await StiPackageTestRepository.getPackageTest(sti_package_id);
        console.log(stiPackageTests);
        const sti_test_ids = stiPackageTests.map(item => item.sti_test_id);
        return {
            success: true,
            sti_package_item: {
                sti_package_id: new mongoose.Types.ObjectId(sti_package_id),
                sti_test_ids: sti_test_ids.map(id => new mongoose.Types.ObjectId(id))
            },
            amount: stiPackage.price
        };
    }

    private static async handleStiTest(sti_test_ids: string[]) {
        const objectIds = sti_test_ids.filter(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
        const stiTests = await StiTest.find({ _id: { $in: objectIds }, is_active: true });

        if (stiTests.length === 0) {
            return {
                success: false,
                message: 'No valid sti_test_ids found'
            };
        }

        const sti_test_items = stiTests.map(test => ({
            sti_test_id: test._id
        }));

        const total = stiTests.reduce((sum, test) => sum + test.price, 0);

        return {
            success: true,
            sti_test_items,
            amount: total
        };
    }

    public static async createStiOrder(customer_id: string, order_date: Date, notes: string): Promise<StiOrderResponse> {
        try {
            // let sti_package_item = null;
            // let sti_test_items = [];
            // let total_amount = 0;
            // let hasPackage: boolean = false;
            // let hasTest = false;

            if (!order_date){
                return{
                    success: false,
                    message: 'Order date is required'
                }
            }
            
            // // Xử lý package
            // if (sti_package_id) {
            //     const result = await this.handleStiPackage(sti_package_id);
            //     if (result.success) {
            //         sti_package_item = result.sti_package_item;
            //         total_amount += result.amount;
            //         hasPackage = true;
            //     }
            // }

            // // Xử lý test lẻ
            // if (sti_test_items_input && sti_test_items_input.length > 0) {
            //     const result = await this.handleStiTest(sti_test_items_input);
            //     if (result.success) {
            //         sti_test_items = result.sti_test_items.map(item => item.sti_test_id);
            //         total_amount += result.amount;
            //         hasTest = true;
            //     }
            // }

            // if (!hasPackage && !hasTest) {
            //     return {
            //         success: false,
            //         message: 'No valid STI tests or package provided'
            //     };
            // }
            
            const scheduleResult = await this.prepareScheduleForOrder(order_date);
            if (!scheduleResult.success) {
                return {
                    success: false,
                    message: scheduleResult.message
                };
            }
            const schedule = scheduleResult.schedule;
            const sti_order = new StiOrder({
                customer_id,
                // sti_package_item,
                // sti_test_items: sti_test_items.length > 0 ? sti_test_items : undefined,
                sti_schedule_id: schedule._id,
                order_date,
                // total_amount,
                notes
            });
            const result = await StiOrderRepository.insertStiOrder(sti_order);

            if (!result) {
                return {
                    success: false,
                    message: 'Order already exists or failed to insert'
                };
            }
            schedule.number_current_orders += 1;
            if (schedule.number_current_orders >= 10) {
                schedule.is_locked = true;
            }
            await StiTestScheduleRepository.updateStiTestSchedule(schedule);
            const customer = await UserRepository.findById(customer_id);
            
            // let packageName = 'Gói combo';
            // if (sti_package_id) {
            //     const stiPackage = await StiPackageRepository.findPackageById(sti_package_id);
            //     if (stiPackage) {
            //         packageName = stiPackage.sti_package_name;
            //     }
            // }
            
            // await MailUtils.sendStiOrderConfirmation(customer.full_name, order_date.toString(), total_amount, customer.email, packageName, sti_test_items)
            await MailUtils.sendStiOrderConfirmation(customer.full_name, order_date.toString(), customer.email);
            return {
                success: true,
                message: 'StiOrder is inserted successfully',
                stiorder: result
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async prepareScheduleForOrder(order_date: Date) {
        try {
            const orderDate = new Date(order_date);

            // Tìm lịch cũ
            let schedule = await StiTestScheduleRepository.findOrderDate(orderDate);

            // Nếu chưa có thì tạo mới
            if (!schedule) {
                schedule = new StiTestSchedule({
                    order_date: orderDate,
                    number_current_orders: 0,
                    is_locked: false,
                });
                await StiTestScheduleRepository.updateStiTestSchedule(schedule);
            }

            if (schedule.is_locked) {
                return {
                    success: false,
                    message: 'Schedule locked for this date'
                };
            }

            return {
                success: true,
                message: 'Schedule is ready for order',
                schedule
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Failed to process schedule'
            };
        }
    }


    public static async getOrdersByCustomer(customer_id: string): Promise<AllStiOrderResponse> {
        try {
            if (!customer_id) {
                return {
                    success: false,
                    message: 'Customer_id is invalid',
                };
            }
            const result = await StiOrderRepository.getOrdersByCustomer(customer_id);
            if (!result || result.length === 0) {
                return {
                    success: false,
                    message: `Cannot find any orders of this customer ${customer_id}`
                }
            }
            return {
                success: true,
                message: 'Get StiOrder successfully',
                stiorder: result
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getOrderById(order_id: string) {
        try {
            const order = await StiOrderRepository.findOrderById(order_id);

            if (!order) {
                return {
                    success: false,
                    message: 'Order not found'
                };
            }

            return {
                success: true,
                message: 'Order found',
                order
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    public static async viewAllOrdersByTestSchedule(schedules: IStiTestSchedule[]) {
        try {
            const result = await Promise.all(schedules.map(async (schedule) => {
                const orders = await StiOrder.find({ sti_schedule_id: schedule._id }).lean<IStiOrder[]>();
                if (!orders) {
                    return {
                        success: false,
                        message: 'Cannot find StiOrder'
                    }
                }
                return {
                    success: true,
                    message: 'View Orders successfully',
                    date: schedule.order_date.toISOString().slice(0, 10),
                    is_locked: schedule.is_locked,
                    number_current_orders: schedule.number_current_orders,
                    tasks: orders.map(order => ({
                        id: order._id,
                        customer_id: order.customer_id,
                        status: order.order_status,
                        amount: order.total_amount,
                        notes: order.notes || ''
                    }))
                };
            }));
            return {
                success: true,
                message: 'Fetched all schedules with orders',
                result
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            }
        }

    };

    public static async insertNewStiPackageTests(sti_test_ids: string[], stiPackage: IStiPackage): Promise<void> {
        try {
            if (Array.isArray(sti_test_ids) && sti_test_ids.length > 0) {
                const stiPackageTests = sti_test_ids.map(testId => ({
                    sti_package_id: stiPackage._id,
                    sti_test_id: testId,
                    is_active: true
                }));
                await StiPackageTestRepository.insertManyPackageTests(stiPackageTests);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    public static async updateStiPackageTests(sti_package_id: string, sti_test_ids: string[]): Promise<void> {
        try {
            if (!Array.isArray(sti_test_ids)) return;

            // Xoá hết liên kết cũ
            await StiPackageTestRepository.deletePackageTestsByPackageId(sti_package_id);

            // Tạo mới lại danh sách
            const newStiPackageTests = sti_test_ids.map(testId => ({
                sti_package_id,
                sti_test_id: testId,
                is_active: true
            }));

            await StiPackageTestRepository.insertManyPackageTests(newStiPackageTests);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async updateOrder(orderId: string, updates: Partial<IStiOrder>, userId: string, role: string) {
        try {
            const order = await StiOrderRepository.findOrderById(orderId);
            if (!order) {
                return {
                    success: false,
                    message: 'Order not found'
                };
            }
            if (order.order_status === 'Completed' || order.order_status === 'Canceled') {
                return {
                    success: false,
                    message: 'Cannot update order that is already completed or canceled'
                };
            }

            if (role === 'staff' || role === 'admin' || role === 'consultant') {
                if (updates.order_status === 'Completed') {
                    if (
                        !order.payment_status || order.payment_status !== 'Paid' ||
                        !order.order_date ||
                        !order.consultant_id ||
                        !order.staff_id ||
                        !order.sti_package_item ||
                        !order.sti_package_item.sti_package_id ||
                        !order.sti_package_item.sti_test_ids ||
                        order.sti_package_item.sti_test_ids.length === 0 ||
                        order.total_amount <= 0
                    ) {
                        return {
                            success: false,
                            message: 'Cannot complete order: missing required fields (payment_status must be Paid, order_date, consultant, staff, STI package and test items)'
                        };
                    }
                }
            }
            // Xử lý logic update order_status
            if (updates.order_status && updates.order_status !== order.order_status) {
                const currentStatus = order.order_status;
                const nextStatus = updates.order_status;

                if (nextStatus && !validTransitions[currentStatus].includes(nextStatus)) {
                    return {
                        success: false,
                        message: `Invalid order status change: from "${currentStatus}" to "${nextStatus}". Valid order status: ${validTransitions[currentStatus].join(', ') || 'None'}.`
                    };
                }

                if (['Canceled', 'Completed'].includes(currentStatus)) {
                    return {
                        success: false,
                        message: 'Cannot change status of completed or canceled order'
                    };
                }

                if (role === 'customer') {
                    if (currentStatus === nextStatus) {
                    }
                    else if (currentStatus === 'Booked' && nextStatus === 'Canceled') {
                        order.order_status = 'Canceled';
                    }
                    else {
                        return {
                            success: false,
                            message: 'Unauthorized status update'
                        };
                    }
                } else if (role === 'staff' || role === 'admin' || role === 'consultant') {
                    order.order_status = nextStatus;
                    if (order.order_status === 'Processing') {
                        order.payment_status = 'Paid';
                    }
                } else {
                    return {
                        success: false,
                        message: 'Unauthorized role'
                    };
                }
            }

            if (updates.consultant_id) {
                if (['consultant', 'staff', 'admin'].includes(role)) {
                    order.consultant_id = new mongoose.Types.ObjectId(updates.consultant_id);
                } else {
                    return {
                        success: false,
                        message: 'Unauthorized to update consultant_id'
                    };
                }
            }

            if (updates.staff_id) {
                if (['staff', 'admin'].includes(role)) {
                    order.staff_id = new mongoose.Types.ObjectId(updates.staff_id);
                } else {
                    return {
                        success: false,
                        message: 'Unauthorized to update staff_id'
                    };
                }
            }

            if (Array.isArray(updates.sti_test_items)) {
                if (!['staff', 'consultant', 'admin'].includes(role)) {
                    return {
                        success: false,
                        message: 'Unauthorized to update STI test items'
                    };
                }
                order.sti_test_items = updates.sti_test_items.map(id => new mongoose.Types.ObjectId(id));
            }
            let sti_package_name = '';
            if (updates.sti_package_item) {
                if (!['staff', 'consultant', 'admin'].includes(role)) {
                    return {
                        success: false,
                        message: 'Unauthorized to update STI package item'
                    };
                }

                const sti_package_id  = updates.sti_package_item.sti_package_id;
                const stiPackageTests = await StiPackageTestRepository.getPackageTest(sti_package_id.toString());
                sti_package_name = await StiPackageRepository.getPackageNameById(sti_package_id.toString());
                if (!stiPackageTests || stiPackageTests.length === 0) {
                    return {
                        success: false,
                        message: 'No STI tests found for this package'
                    };
                }

                // Gán lại vào order
                order.sti_package_item = {
                    sti_package_id: new mongoose.Types.ObjectId(sti_package_id),
                    sti_test_ids: stiPackageTests.map(test => new mongoose.Types.ObjectId(test.sti_test_id))
                };
            }

            if (updates.payment_status) {
                if (['staff', 'admin'].includes(role)) {
                    order.payment_status = updates.payment_status;
                    if (updates.payment_status === 'Paid' && ['Booked', 'Accepted'].includes(order.order_status)) {
                        order.order_status = 'Processing';
                    }
                } else {
                    return {
                        success: false,
                        message: 'Unauthorized to update payment_status'
                    };
                }
            }

            if (updates.order_date && updates.order_date.toString() !== order.order_date.toString()) {
                let newSchedule = await StiTestScheduleRepository.findOrderDate(updates.order_date);
                const oldSchedule = await StiTestScheduleRepository.findById(order.sti_schedule_id);

                if (!newSchedule) {
                    newSchedule = new StiTestSchedule({
                        order_date: updates.order_date,
                        number_current_orders: 1,
                        is_locked: false,
                    });
                    await newSchedule.save();
                } else {
                    if (newSchedule.is_locked) {
                        return {
                            success: false,
                            message: 'Cannot get schedule on locked date and holiday'
                        };
                    }

                    if (!oldSchedule || oldSchedule._id.toString() !== newSchedule._id.toString()) {
                        newSchedule.number_current_orders += 1;
                        await newSchedule.save();
                    }
                }

                if (oldSchedule && oldSchedule._id.toString() !== newSchedule._id.toString()) {
                    oldSchedule.number_current_orders = Math.max(0, oldSchedule.number_current_orders - 1);
                    oldSchedule.is_locked = false;
                    await oldSchedule.save();
                }

                order.order_date = updates.order_date;
                order.sti_schedule_id = newSchedule._id;
            }

            const validFields = Object.keys(order.toObject());
            for (const [key, value] of Object.entries(updates)) {
                if (
                    key !== 'order_status' && 
                    key !== 'sti_test_items' &&
                    key !== 'sti_package_item' && 
                    key !== 'consultant_id' && 
                    key !== 'staff_id' && 
                    key !== 'order_date' &&
                    key !== 'payment_status' &&
                    validFields.includes(key)
                ){
                    (order as any)[key] = value;
                }
            }

            const result = await StiOrderRepository.saveOrder(order);
            return {
                success: true,
                message: 'Order updated successfully',
                data: result,
                updatedBy: userId,
                sti_package_name: sti_package_name || undefined
            };

        } catch (error) {
            console.error(error);
            return { success: false, message: 'Server error' };
        }
    }

    public static async getAllAuditLog() {
        try {
            const result = await StiAuditLogRepository.getAllAuditLogs();
            if (!result) {
                return {
                    success: false,
                    message: 'Cannot find the audit logs'
                }
            }
            return {
                success: true,
                message: 'Fetched All Audit Logs successfully',
                audit_logs: result
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return {
                success: true,
                message: 'Internal server error'
            };
        }
    }

    public static async getTotalRevenueByCustomer(customerId: string) {
        try {
            if (!customerId) {
                return {
                    success: false,
                    message: 'Customer ID is invalid',
                };
            }
            const total = await StiOrderRepository.getTotalRevenueByCustomer(customerId);
            console.log('Total revenue for customer:', total);
            if (total === null || total === undefined) {
                return {
                    success: false,
                    message: 'Customer revenue not found',
                };
            }
            return {
                success: true,
                message: 'Fetched customer revenue',
                total_revenue: total
            };
        } catch (err) {
            return {
                success: false,
                message: 'Failed to fetch customer revenue'
            };
        }
    }

    public static async getTotalRevenue() {
        try {
            const total = await StiOrderRepository.getTotalRevenue();
            if (total === null || total === undefined) {
                return {
                    success: false,
                    message: 'Total revenue not found',
                };
            }
            return {
                success: true,
                message: 'Fetched total revenue',
                total_revenue: total
            };
        } catch (err) {
            return { success: false, message: 'Failed to fetch total revenue' };
        }
    }

    /**
 * Get STI orders with pagination and filtering
 */
    public static async getStiOrdersWithPagination(query: StiOrderQuery): Promise<StiOrderPaginationResponse> {
        try {
            console.log('🔍 [DEBUG] STI Service - Input query:', query);
            
            // Validate pagination parameters
            const { page, limit, sort_by, sort_order } = PaginationUtils.validateStiOrderPagination(query);
            console.log('📊 [DEBUG] STI Service - Validated params:', { page, limit, sort_by, sort_order });

            // Build filter query
            const filters = PaginationUtils.buildStiOrderFilter(query);
            console.log('🎯 [DEBUG] STI Service - MongoDB filters:', filters);

            // Get data từ repository
            const result = await StiOrderRepository.findWithPagination(
                filters,
                page,
                limit,
                sort_by,
                sort_order
            );

            // Calculate pagination info
            const pagination = PaginationUtils.calculatePagination(
                result.total,
                page,
                limit
            );

            // Build filters_applied object
            const filters_applied: Record<string, any> = {};
            if (query.customer_id) filters_applied.customer_id = query.customer_id;
            if (query.order_status) filters_applied.order_status = query.order_status;
            if (query.payment_status) filters_applied.payment_status = query.payment_status;
            if (query.date_from) filters_applied.date_from = query.date_from;
            if (query.date_to) filters_applied.date_to = query.date_to;
            if (query.min_amount) filters_applied.min_amount = query.min_amount;
            if (query.max_amount) filters_applied.max_amount = query.max_amount;
            if (query.consultant_id) filters_applied.consultant_id = query.consultant_id;
            if (query.staff_id) filters_applied.staff_id = query.staff_id;
            if (query.sti_package_id) filters_applied.sti_package_id = query.sti_package_id;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            return {
                success: true,
                message: result.orders.length > 0
                    ? `Found ${result.orders.length} STI orders`
                    : 'No STI orders found with the given criteria',
                data: {
                    items: result.orders,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting STI orders with pagination:', error);
            return {
                success: false,
                message: 'Internal server error when getting STI orders',
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
            };
        }
    }

    /**
 * Get audit logs with pagination and filtering
 */
    public static async getAuditLogsWithPagination(query: AuditLogQuery): Promise<AuditLogPaginationResponse> {
        try {
            const {
                page = 1,
                limit = 10,
                sort_by = 'timestamp',
                sort_order = 'desc',
            } = query;

            const filters = PaginationUtils.buildAuditLogFilter(query);

            const { auditLogs: items, total } = await StiAuditLogRepository.findWithPagination(
                filters,
                page,
                limit,
                sort_by,
                sort_order === 'desc' ? -1 : 1
            );

            const paginationDetails = PaginationUtils.calculatePagination(total, page, limit);

            return {
                success: true,
                message: "Audit logs retrieved successfully.",
                data: {
                    items,
                    pagination: paginationDetails,
                    filters_applied: query
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching audit logs with pagination:', error);
            return {
                success: false,
                message: 'Internal server error when getting audit logs',
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
            };
        }
    }

    //STI RESULT SERVICE
    public static async createStiResult(orderId: string, additionalData?: Partial<IStiResult>){
        try {
            if (!orderId){
                return{
                    success: false,
                    message: 'Result id is not found'
                }
            }
            // Get order information
            const order = await StiResultRepository.getStiOrderWithTests(orderId);
            
            if (!order) {
                return{
                    success: false,
                    message: 'Cannot find the order'
                }
            }

            const existing = await StiResultRepository.findExistedResult(orderId);

            if (existing) {
                return {
                    success: false,
                    message: 'STI result for this order already exists and is active'
                };
            }

            if (order.order_status === 'Booked' || order.order_status === 'Accepted' || order.order_status === 'Canceled'){
                return {
                    success: false,
                    message: 'STI result can be created where order_status after processing (money is paid)'
                };
            }
            const allTests: any[] = [];

            // Collect all tests from direct tests
            if (order.sti_test_items && order.sti_test_items.length > 0) {
                allTests.push(...order.sti_test_items);
            }

            // Collect all tests from package items
            if (order.sti_package_item && order.sti_package_item.sti_test_ids?.length > 0) {
                allTests.push(...order.sti_package_item.sti_test_ids);
            }

            const sampleQualities: Partial<Record<TestTypes, boolean | null>> = {};
            // Tạo StiResult cho từng test
            for (const test of allTests) {
                if (test?.sti_test_type) {
                    sampleQualities[test.sti_test_type] = null; // Mặc định "Đạt"
                }
            }

            const sample: Sample = {
                sampleQualities,
                timeReceived: new Date(),
                timeTesting: new Date()
            };

            const stiResultData: Partial<IStiResult> = {
                sti_order_id: new mongoose.Types.ObjectId(orderId),
                sample,
                ...additionalData
            };
            const result = await StiResultRepository.create(stiResultData);
            if (!result){
                return{
                    success: false,
                    message: 'Fail to create sti result'
                }
            }
            return {
                success: true,
                message: 'Create sti result successfully',
                data: result
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getStiResultByOrderId(orderId: string, userId: string, role: string){
        try {
            const result = await StiResultRepository.findByOrderId(orderId);
            if (!result){
                return{
                    success: false,
                    message: 'Fail to fetch sti result by order'
                }
            }
            if (role === 'Customer' && result.sti_order_id.customer_id.toString() !== userId) {
                return {
                    success: false,
                    message: 'Access denied'
                };
            }
            return{
                success: true,
                message: 'Fetched sti result by order successfully',
                data: result
            }
        } catch (error) {
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiResult(){
        try {
            const result = await StiResultRepository.findAll();
            if (!result){
                return{
                    success: false,
                    message: 'Fail to fetch sti result'
                }
            }
            return{
                success: true,
                message: 'Fetched sti result successfully',
                data: result
            }
        } catch (error) {
            return{
                success: false,
                message: 'Server error'
            }
        }
    }


    public static async updateStiResult(resultId: string, updateData: UpdateStiResultRequest, userId: string) {
        try {
            // Validate input
            if (!resultId || !updateData) {
                return {
                    success: false,
                    message: 'ID và updated data cannot be null'
                };
            }

            // Check if result exists
            const result = await StiResultRepository.findById(resultId);
            if (!result) {
                return {
                    success: false,
                    message: 'Cannot find the sti result'
                };
            }

            // Check if result is active
            if (!result.is_active) {
                return {
                    success: false,
                    message: 'Sti result is deactivated'
                };
            }

            if (updateData.hasOwnProperty('is_confirmed')) {
                const consultant = await ConsultantRepository.findByUserId(userId);
                if (!consultant || consultant._id.toString() != result.sti_order_id.consultant_id?.toString()) {
                    return {
                        success: false,
                        message: 'You are not authorized to confirm this result'
                    };
                }
            }

            // Set time_result if result_value is provided and time_result is not set
            if (updateData.result_value && !updateData.time_result && !result.time_result) {
                updateData.time_result = new Date();
            }

            if (updateData.sample?.sampleQualities) {
                const existingQualities = result.sample?.sampleQualities || {};
                const newQualities = updateData.sample.sampleQualities;

                const updatedQualities: Record<string, boolean | null> = {};
                const invalidKeys: string[] = [];

                for (const key in newQualities) {
                    if (key in existingQualities) {
                        updatedQualities[key] = newQualities[key];
                    } else {
                        invalidKeys.push(key);
                    }
                }

                // Trả lỗi nếu có key không hợp lệ (không nằm trong existingQualities)
                if (invalidKeys.length > 0) {
                    return {
                        success: false,
                        message: `Invalid sampleQualities keys: ${invalidKeys.join(', ')}`
                    };
                }

                updateData.sample.sampleQualities = {
                    ...existingQualities,
                    ...updatedQualities
                };
            }
            // Update the result
            const updatedResult = await StiResultRepository.updateById(resultId, updateData);

            if (!updatedResult) {
                return {
                    success: false,
                    message: 'Cannot update sti result'
                };
            }

            return {
                success: true,
                message: 'Update sti result successfully',
                data: updatedResult
            };

        } catch (error) {
            console.error('StiResultService - updateStiResult error:', error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    private static async getTestTypesFromOrder(order: IStiOrder): Promise<string[]> {
        const testIds: mongoose.Types.ObjectId[] = [];

        // Lấy test IDs từ package
        if (order.sti_package_item?.sti_test_ids) {
        testIds.push(...order.sti_package_item.sti_test_ids);
        }

        // Lấy test IDs từ individual tests
        if (order.sti_test_items) {
        testIds.push(...order.sti_test_items);
        }

        // Loại bỏ duplicates
        const uniqueTestIds = [...new Set(testIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

        if (uniqueTestIds.length === 0) {
            return [];
        }

        // Lấy test types từ database
        return await StiTestRepository.getTestTypesByIds(uniqueTestIds);
    }

    public static async syncSampleFromOrder(orderId: string) {
        try {
            // Validate order_id
            if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
                return {
                    success: false,
                    message: 'Invalid order id'
                };
            }

            // Lấy order với tests
            const order = await StiOrderRepository.getOrderWithTests(orderId);
            if (!order) {
                return {
                success: false,
                message: 'Order not found'
                };
            }

            // Lấy tất cả test types từ order
            const orderTestTypes = await this.getTestTypesFromOrder(order);
            if (orderTestTypes.length === 0) {
                return {
                success: false,
                message: 'No test types found in order'
                };
            }

            // Tìm hoặc tạo result record
            let result = await StiResultRepository.findByOrderId(orderId);

            if (!result) {
                return{
                    success: false,
                    message: 'Cannot find the sti result'
                }
            }
            const currentQualities = result.sample.sampleQualities || {};
            const newSampleQualities: Partial<Record<TestTypes, boolean | null>> = {};

            // Maintain the old type and quality in sampleQualities
            orderTestTypes.forEach(testType => {
            if (currentQualities.hasOwnProperty(testType)) {
                newSampleQualities[testType] = currentQualities[testType];
            } else {
                newSampleQualities[testType] = null;
            }
            });

            // Update new sample qualities
            result = await StiResultRepository.updateById(result._id.toString(), {
                sample: {
                    ...result.sample,
                    sampleQualities: newSampleQualities
                }
            });

            return {
                success: true,
                message: 'Updated sti result successfully',
                data: result
            };
        } catch (error) {
            console.error('Error syncing sample qualities:', error);
            return {
                success: false,
                message: 'Internal server error',
            };
        }
    }

    public static async sendStiResultNotificationFromDB(stiResultId: string) {
        try {
            const result = await StiResultRepository.getFullResult(stiResultId);
            if (!result || !result.sti_order_id) {
                return { 
                    success: false, 
                    message: "Cannot find the result" 
                };
            }
            if (!result.is_confirmed) {
                return {
                    success: false,
                    message: 'Result is not confirmed.'
                };
            }
            if (result.is_notified) {
                return {
                    success: false,
                    message: 'Result is sent before.'
                };
            }
            const order = result.sti_order_id as any;
            const user = order.customer_id;
            const consultantUser = order.consultant_id?.user_id;
            const staffUser = order.staff_id?.user_id;

            const customerName = user?.full_name ?? 'Khách hàng';
            const birthYear = user?.date_of_birth ? new Date(user.date_of_birth).getFullYear() : null;
            const gender = user?.gender ?? 'Không rõ';
            const diagnosis = result.diagnosis ?? '';
            const resultValue = result.result_value ?? '';
            const notes = result.notes ?? '';
            const isCritical = result.is_critical ?? false;
            const consultantName = consultantUser?.full_name ?? 'Chưa có';
            const staffName = staffUser?.full_name ?? 'Chưa có';
            let testNames: string[] = [];
            
            if (staffName === 'Chưa có' && consultantName === 'Chưa có') {
                return {
                    success: false,
                    message: 'Consultant and Staff is not found'
                };
            }

            // Nếu có sti_test_items
            if (order.sti_test_items && order.sti_test_items.length > 0) {
                // Populate trước đó để có sti_test_items là mảng StiTest
                testNames = order.sti_test_items.map((t: IStiTest) => t.sti_test_name);
            }

            // Nếu không có mà có package item
            else if (order.sti_package_item?.sti_test_ids && order.sti_package_item.sti_test_ids.length > 0) {
                // Cần populate sti_package_item.sti_test_ids (vì là ObjectId)
                testNames = order.sti_package_item.sti_test_ids.map((t: IStiTest) => t.sti_test_name);
            }

            const sampleInfo = {
                timeReceived: result.sample?.timeReceived,
                timeTesting: result.sample?.timeTesting,
                sampleQualities: result.sample?.sampleQualities ?? {}
            };

            const resultDate = result.time_result;
            const emailSendTo = user?.email;

            if (!emailSendTo) {
                return { success: false, message: 'Người dùng không có email' };
            }

            const mailResult = await MailUtils.sendStiResultNotification(
                customerName,
                birthYear,
                gender,
                diagnosis,
                resultValue,
                notes,
                isCritical,
                consultantName,
                staffName,
                sampleInfo,
                testNames,
                resultDate,
                emailSendTo
            );
            if (!mailResult){
                return{
                    success: false,
                    message: 'Fail to send mail'
                }
            }
            return mailResult;
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Internal server error'
            }
        }    
    }

    public static async getStiResultById(resultId: string){
        try {
            const result = await StiResultRepository.getFullResult(resultId);
            if (!result || !result.sti_order_id) {
                return { 
                    success: false, 
                    message: "Cannot find the result" 
                };
            }
            const order = result.sti_order_id as any;
            const user = order.customer_id;
            const consultantUser = order.consultant_id?.user_id;
            const staffUser = order.staff_id?.user_id;

            const customerName = user?.full_name ?? 'Khách hàng';
            const birthYear = user?.date_of_birth ? new Date(user.date_of_birth).getFullYear() : null;
            const gender = user?.gender ?? 'Không rõ';
            const diagnosis = result.diagnosis ?? '';
            const resultValue = result.result_value ?? '';
            const notes = result.notes ?? '';
            const isCritical = result.is_critical ?? false;
            const consultantName = consultantUser?.full_name ?? 'Chưa có';
            const staffName = staffUser?.full_name ?? 'Chưa có';
            let testNames: string[] = [];
            // Nếu có sti_test_items
            if (order.sti_test_items && order.sti_test_items.length > 0) {
                // Populate trước đó để có sti_test_items là mảng StiTest
                testNames = order.sti_test_items.map((t: IStiTest) => t.sti_test_name);
            }

            // Nếu không có mà có package item
            else if (order.sti_package_item?.sti_test_ids && order.sti_package_item.sti_test_ids.length > 0) {
                // Cần populate sti_package_item.sti_test_ids (vì là ObjectId)
                testNames = order.sti_package_item.sti_test_ids.map((t: IStiTest) => t.sti_test_name);
            }

            const resultDate = result.time_result;
            return {
                success: true,
                message: 'Send result successfully',
                customerName,
                birthYear,
                gender,
                diagnosis,
                resultValue,
                notes,
                isCritical,
                consultantName,
                staffName,
                sample: {
                    timeReceived: result.sample?.timeReceived,
                    timeTesting: result.sample?.timeTesting,
                    sampleQualities: result.sample?.sampleQualities ?? {}
                },
                testNames,
                resultDate,
            };
        } catch (error) {
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    /**
     * Lấy tất cả STI orders của một customer
     */
    public static async getStiOrdersByCustomer(customerId: string) {
        try {
            if (!customerId) {
                return {
                    success: false,
                    message: 'Customer ID is required'
                };
            }

            const orders = await StiOrderRepository.getOrdersByCustomer(customerId);
            
            return {
                success: true,
                message: 'STI orders retrieved successfully',
                data: orders
            };
        } catch (error) {
            console.error('Error getting STI orders by customer:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }

    /**
     * Lấy STI order theo ID
     */
    public static async getStiOrderById(orderId: string) {
        try {
            if (!orderId) {
                return {
                    success: false,
                    message: 'Order ID is required'
                };
            }

            const order = await StiOrderRepository.findOrderById(orderId);
            
            if (!order) {
                return {
                    success: false,
                    message: 'Order not found'
                };
            }

            return {
                success: true,
                message: 'STI order retrieved successfully',
                data: order
            };
        } catch (error) {
            console.error('Error getting STI order by ID:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }

    /**
     * Lấy STI result theo order ID cho customer
     */
    public static async getCustomerStiResultByOrderId(orderId: string) {
        try {
            if (!orderId) {
                return {
                    success: false,
                    message: 'Order ID is required'
                };
            }

            const result = await StiResultRepository.findByOrderId(orderId);
            
            if (!result) {
                return {
                    success: false,
                    message: 'STI result not found'
                };
            }

            return {
                success: true,
                message: 'STI result retrieved successfully',
                data: result
            };
        } catch (error) {
            console.error('Error getting STI result by order ID:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }

    
}
