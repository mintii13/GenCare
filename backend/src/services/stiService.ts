import { AllStiTestResponse, StiTestResponse, StiPackageResponse, AllStiPackageResponse, StiOrderResponse, AllStiOrderResponse } from '../dto/responses/StiResponse';
import { IStiTest, StiTest } from '../models/StiTest';
import { StiRepository } from "../repositories/stiRepository";
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

export class StiService{
    public static async createStiTest(stiTest: IStiTest): Promise<StiTestResponse>{
        try {
            const duplicate = await StiRepository.findByStiTestCode(stiTest.sti_test_code);
            if (duplicate){
                if (duplicate.is_active){
                    return{
                        success: false,
                        message: 'Sti test code is duplicated'
                    }
                }
                else{
                    //update is_active thành true
                    const result = await StiRepository.updateIsActive(duplicate._id);
                    return{
                        success: true,
                        message: 'Insert StiTest to database successfully',
                        stitest: result
                    }
                }
            }
            const result: Partial<IStiTest> = await StiRepository.insertStiTest(stiTest);
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
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiTest(): Promise<AllStiTestResponse>{
        try {
            const allOfTest = await StiRepository.getAllStiTest();
            if (!allOfTest){
                return{
                    success: false,
                    message: 'Fail in getting Sti Test'
                }
            }
            const activeTests = allOfTest.filter(test => test.is_active);
            return{
                success: true,
                message: 'Get STI tests successfully',
                stitest: activeTests
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getStiTestById(id: string): Promise<StiTestResponse> {
        try {
            const stiTest = await StiRepository.getStiTestById(id);
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
            if (exists && exists._id.toString() !== sti_test_id) {
                return {
                    success: false,
                    message: 'STI test code already exists',
                };
            }
            const sti_test = await StiRepository.findByIdAndUpdateStiTest(sti_test_id, updateData);
            if (!sti_test) {
                return{
                    success: false, 
                    message: 'StiTest not found or you are not authorized to update it'
                }
            }
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return{
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
            const updated = await StiRepository.findByIdAndUpdate(sti_test_id, userId);
            if (!updated) {
                return {
                    success: false,
                    message: 'StiTest not found or you are not authorized to delete it'
                };
            }

            return{
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


    public static async createStiPackage(stiPackage: IStiPackage): Promise<StiPackageResponse>{
        try {
            const duplicate = await StiPackageRepository.findByStiPackageCode(stiPackage.sti_package_code);
            if (duplicate){
                if (duplicate.is_active){
                    return{
                        success: false,
                        message: 'Sti package code is duplicated'
                    }
                }
                else{
                    //update is_active thành true
                    const result = await StiPackageRepository.updateIsActive(duplicate._id);
                    return{
                        success: true,
                        message: 'Insert StiPackage to database successfully',
                        stipackage: result
                    }
                }
            }
            const result: Partial<IStiPackage> = await StiPackageRepository.insertStiPackage(stiPackage);
            if (!result){
                return{
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
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiPackage(): Promise<AllStiPackageResponse>{
        try {
            const allOfTest = await StiPackageRepository.getAllStiTPackage();
            if (!allOfTest){
                return{
                    success: false,
                    message: 'Fail in getting StiPackage'
                }
            }
            const activeTests = allOfTest.filter(test => test.is_active);

            return{
                success: true,
                message: 'Get STI packages successfully',
                stipackage: activeTests
            }
        } catch (error) {
            console.error(error);
            return{
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
                return{
                    success: false, 
                    message: 'STIPackage not found'
                }
            }
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return{
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

            return{
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


    public static async createStiOrder(customer_id: string, sti_package_id: string, sti_test_items_input: string[], order_date: Date, notes: string): Promise<StiOrderResponse>{
        try {
            let sti_package_item = null;
            let sti_test_items = [];
            let total_amount = 0;
            let noPackage: boolean = false;
            let noTest: boolean = false;

            // Xử lý package
            if (sti_package_id) {
                const result = await this.handleStiPackage(sti_package_id);
                if (!result.success) 
                    noPackage = true;
                else{
                    sti_package_item = result.sti_package_item;
                    total_amount += result.amount;
                }
                
            }
            else{
                noPackage = true;
            }

            // Xử lý test lẻ
            if (sti_test_items_input && sti_test_items_input.length > 0) {
                const result = await this.handleStiTest(sti_test_items_input);
                if (!result.success) 
                    noTest = true;
                else{
                    sti_test_items = result.sti_test_items.map((item) => item.sti_test_id);
                    total_amount += result.amount;
                }
            }
            else{
                noTest = true;
            }

            if (noPackage && noTest){
                return {
                    success: false,
                    message: 'No valid STI tests or package provided'
                };
            }
            if (!noPackage && !noTest){
                return {
                    success: false,
                    message: 'Cannot provide both STI package and individual tests'
                };
            }

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
                sti_package_item,
                sti_test_items,
                sti_schedule_id: schedule._id,
                order_date,
                total_amount,
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
            return {
                success: true,
                message: 'StiOrder is inserted successfully',
                stiorder: result
            };
        } catch (error) {
            console.error(error);
            return{
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
                    is_holiday: false
                });
                await StiTestScheduleRepository.updateStiTestSchedule(schedule);
            }

            // Check điều kiện không hợp lệ
            if (schedule.is_holiday) {
                return {
                    success: false,
                    message: 'Cannot create order on holiday'
                };
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


    public static async getOrdersByCustomer(customer_id: string): Promise<AllStiOrderResponse>{
        try {
            if (!customer_id) {
                return {
                    success: false,
                    message: 'Customer_id is invalid',
                };
            }
            const result = await StiOrderRepository.getOrdersByCustomer(customer_id);
            if (!result || result.length === 0){
                return{
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
            return{
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

    public static async viewAllOrdersByTestSchedule(schedules: IStiTestSchedule[]){
        try {
            const result = await Promise.all(schedules.map(async (schedule) => {
                const orders = await StiOrder.find({ sti_schedule_id: schedule._id }).lean<IStiOrder[]>();
                if (!orders){
                    return{
                        success: false,
                        message: 'Cannot find StiOrder'
                    }
                }
                return {
                    success: true,
                    message: 'View Orders successfully',
                    date: schedule.order_date.toISOString().slice(0, 10),
                    is_locked: schedule.is_locked,
                    is_holiday: schedule.is_holiday,
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
            return{
                success: false,
                message: 'Server error'
            }
        }
        
    };

    public static async insertNewStiPackageTests(sti_test_ids: string[], stiPackage: IStiPackage): Promise<void>{
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
            // Xử lý logic update order_status
            if (updates.order_status && updates.order_status !== order.order_status) {
                const currentStatus = order.order_status;
                const nextStatus = updates.order_status;

                if (nextStatus && !validTransitions[currentStatus].includes(nextStatus)) {
                    return {
                        success: false,
                        message: `Chuyển trạng thái không hợp lệ: từ "${currentStatus}" sang "${nextStatus}". Trạng thái cho phép: ${validTransitions[currentStatus].join(', ') || 'không có'}.`
                    };
                }

                if (['Canceled', 'Completed'].includes(currentStatus)) {
                    return { 
                        success: false, 
                        message: 'Cannot change status of completed or canceled order' 
                    };
                }

                if (role === 'customer') {
                    if (currentStatus === nextStatus){
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
                } else if (role === 'staff' || role === 'admin') {
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

            if (Array.isArray(updates.sti_test_items)) {
                order.sti_test_items = updates.sti_test_items.map(id => new mongoose.Types.ObjectId(id));
            }

            const validFields = Object.keys(order.toObject());
            for (const [key, value] of Object.entries(updates)) {
                if (key !== 'order_status' && key !== 'sti_test_items' && validFields.includes(key)) {
                    (order as any)[key] = value;
                }
            }

            const result = await StiOrderRepository.saveOrder(order);
            return {
                success: true,
                message: 'Order updated successfully',
                data: result,
                updatedBy: userId
            };

        } catch (error) {
            console.error(error);
            return { success: false, message: 'Server error' };
        }
    }

    public static async getAllAuditLog (){
        try {
            const result = await StiAuditLogRepository.getAllAuditLogs();
            if (!result){
                return{
                    success: false,
                    message: 'Cannot find the audit logs'
                }
            }
            return{
                success: true,
                message: 'Fetched All Audit Logs successfully',
                audit_logs: result
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return{ 
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
}