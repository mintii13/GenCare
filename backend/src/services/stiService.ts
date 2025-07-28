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
import { StiOrderQuery } from '../dto/requests/StiRequest';
import { StiOrderPaginationResponse } from '../dto/responses/StiOrderPaginationResponse';
import { PaginationUtils } from '../utils/paginationUtils';
import { AuditLogQuery } from '../dto/requests/AuditLogRequest';
import { AuditLogPaginationResponse } from '../dto/responses/AuditLogPaginationResponse';
import { StiResultRepository } from '../repositories/stiResultRepository';
import { IStiResult, StiResult, StiResultItem } from '../models/StiResult';
import { ConsultantRepository } from '../repositories/consultantRepository';
import { SpecializationType } from '../models/Consultant';
import { StaffRepository } from '../repositories/staffRepository';
import { TimeUtils } from '../utils/timeUtils';
import { JWTPayload } from '../utils/jwtUtils';
import { StiResultQuery } from '../dto/requests/PaginationRequest';
import { PaginatedResponse } from '../dto/responses/PaginationResponse';
import { StiResultPaginationResponse } from '../dto/responses/StiResultPaginationResponse';

export class StiService {
    public static async createStiTest(stiTest: IStiTest): Promise<StiTestResponse> {
        try {
            const duplicate = await StiTestRepository.findByStiTestCode(stiTest.sti_test_code);
            if (duplicate) {
                if (duplicate.is_active) {
                    return {
                        success: false,
                        message: 'Sti test code is duplicated'
                    }
                }
                else {
                    //update is_active thành true
                    const result = await StiTestRepository.updateIsActive(duplicate._id);
                    return {
                        success: true,
                        message: 'Insert StiTest to database successfully',
                        stitest: result
                    }
                }
            }
            const result: Partial<IStiTest> = await StiTestRepository.insertStiTest(stiTest);
            if (!result) {
                return {
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
            if (!allOfTest) {
                return {
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
            // =================== VALIDATION START ===================
            const orderDate = new Date(order_date);
            // Defect D1 (Improved): Kiểm tra ngày hợp lệ
            if (!order_date || isNaN(orderDate.getTime())) {
                return {
                    success: false,
                    message: 'Order date is required and must be a valid date'
                };
            }

            // Defect D2: Kiểm tra ngày không được ở trong quá khứ
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset giờ về đầu ngày để so sánh
            if (orderDate < today) {
                return {
                    success: false,
                    message: 'Order date cannot be in the past'
                };
            }

            // Defect D3, D6: Kiểm tra độ dài của notes
            if (notes && notes.length > 2000) {
                return {
                    success: false,
                    message: 'Notes cannot exceed 2000 characters'
                };
            }

            const hasBooked = await StiOrderRepository.hasBookedOrder(customer_id);
            if (hasBooked){
                return{
                    success: false,
                    message: 'Customer has already booked an STI order'
                }
            }

            // =================== VALIDATION END ===================

            const scheduleResult = await this.prepareScheduleForOrder(order_date);
            if (!scheduleResult.success) {
                return {
                    success: false,
                    message: scheduleResult.message
                };
            }
            const schedule = scheduleResult.schedule;

            // Defect D7, D8 (Double check): Kiểm tra lại trước khi tạo
            if (schedule.is_locked || schedule.number_current_orders >= 10) {
                return {
                    success: false,
                    message: 'The schedule for this date is full.'
                };
            }

            const sti_order = new StiOrder({
                customer_id,
                sti_schedule_id: schedule._id,
                order_date,
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
            let sti_package_name = '';
            const order = await StiOrderRepository.findOrderById(orderId);
            if (!order) {
                return {
                    success: false,
                    message: 'Order not found'
                };
            }
            if (role === 'staff' || role === 'admin' || role === 'consultant') {
                if (updates.order_status === 'Completed' || updates.order_status === 'Canceled') {
                    if (
                        order.is_paid === false ||
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
                            message: 'Cannot complete order: missing required fields or conditions not met'
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
                        //No change needed
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
                    if (nextStatus === 'Processing'){
                        return {
                            success: false,
                            message: 'Order status "Processing" can be updated by the change status of payment.'
                        };
                    }
                    order.order_status = nextStatus;
                } else {
                    return {
                        success: false,
                        message: 'Unauthorized role'
                    };
                }
            }
            if (order.order_status === 'Accepted' || order.order_status === 'Booked'){
                if (updates.consultant_id) {
                    if (['staff', 'admin'].includes(role)) {
                        const isValidConsultant = await ConsultantRepository.findConsultantsByIdAndSpecialization(updates.consultant_id.toString(), SpecializationType.SexualHealth);
                        if (!isValidConsultant) {
                            return {
                                success: false,
                                message: 'Consultant must be a valid consultant with specialization in Sexual Health'
                            };
                        }   
                        const consultantExists = await ConsultantRepository.findById(updates.consultant_id.toString());
                        if (!consultantExists) {
                            return {
                                success: false,
                                message: 'Consultant not found'
                            };
                        }
                        order.consultant_id = new mongoose.Types.ObjectId(updates.consultant_id);
                        const staff = await StaffRepository.findByUserId(userId);
                        order.staff_id = new mongoose.Types.ObjectId(staff._id);
                    } else {
                        return {
                            success: false,
                            message: 'Unauthorized to update consultant_id'
                        };
                    }
                }
                let total_amount = 0;
                if (Array.isArray(updates.sti_test_items)) {
                    if (!['consultant'].includes(role)) {
                        return {
                            success: false,
                            message: 'Unauthorized to update STI test items'
                        };
                    }
                    order.sti_test_items = updates.sti_test_items.map(id => new mongoose.Types.ObjectId(id));
                    const stiTests = await StiTest.find({ _id: { $in: order.sti_test_items }, is_active: true }).select('price');
                    total_amount = stiTests.reduce((sum, test) => sum + test.price, 0);
                }
                if (updates.sti_package_item) {
                    if (!['consultant'].includes(role)) {
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
                    const pkg = await StiPackageRepository.findPackageById(sti_package_id.toString());
                    total_amount += pkg.price;
                }

                if (updates.sti_package_item || Array.isArray(updates.sti_test_items)){
                    order.total_amount = total_amount;
                }
                

                if (updates.is_paid === true && order.order_status === 'Accepted') {
                    if (['staff', 'admin'].includes(role)) {
                        order.is_paid = updates.is_paid;
                        if (['Booked', 'Accepted'].includes(order.order_status)) {
                            order.order_status = 'Processing';
                        }
                    } else {
                        return {
                            success: false,
                            message: 'Unauthorized to update is_paid status'
                        };
                    }
                }

                if (['staff', 'admin', 'customer'].includes(role) && updates.order_date && updates.order_date.toString() !== order.order_date.toString()) {
                    const today = new Date();
                    const vnOffsetMs = 7 * 60 * 60 * 1000;

                    const todayInVN = new Date(today.getTime() + vnOffsetMs);
                    todayInVN.setHours(0, 0, 0, 0);
                    const updateDate = new Date(new Date(updates.order_date).getTime() + vnOffsetMs);
                    updateDate.setHours(0, 0, 0, 0);

                    const diffDays = (updateDate.getTime() - todayInVN.getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays < 1) {
                        return {
                            success: false,
                            message: 'Ngày đặt lịch phải sau hôm nay ít nhất 1 ngày.'
                        };
                    }
                    
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
                        key !== 'is_paid' &&
                        validFields.includes(key)
                    ){
                        (order as any)[key] = value;
                    }
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
            if (query.is_paid) filters_applied.is_paid = query.is_paid;
            if (query.date_from) filters_applied.date_from = query.date_from;
            if (query.date_to) filters_applied.date_to = query.date_to;
            if (query.min_amount) filters_applied.min_amount = query.min_amount;
            if (query.max_amount) filters_applied.max_amount = query.max_amount;
            if (query.consultant_id) filters_applied.consultant_id = query.consultant_id;
            if (query.staff_id) filters_applied.staff_id = query.staff_id;
            if (query.sti_package_id) filters_applied.sti_package_id = query.sti_package_id;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            // console.log('[DEBUG] Order sample:', JSON.stringify(result.orders[0], null, 2));

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

    //Processing the STI result
    public static async getStiTestDropdownByOrderId(order_id: string){
        try {
            const order = await StiOrderRepository.findOrderById(order_id);
            if (!order) {
                return {
                    success: false,
                    message: 'Order not found'
                };
            }
            if (order.order_status !== 'Testing') {
                return {
                    success: false,
                    message: 'Order is not in Testing status'
                };
            }
            const orderWithTests = await StiOrderRepository.getStiTestInOrder(order_id);
            if (!orderWithTests) {
                return {
                    success: false,
                    message: 'No STI tests found in this order'
                };
            }
            if (!orderWithTests.sti_package_item || !orderWithTests.sti_package_item.sti_test_ids || orderWithTests.sti_package_item.sti_test_ids.length === 0) {
                return {
                    success: false,
                    message: 'No STI tests found in this order package'
                };
            }
            const sti_tests_from_package = await StiTestRepository.getStiTestsByIds(orderWithTests.sti_package_item.sti_test_ids);
            const sti_tests = await StiTestRepository.getStiTestsByIds(orderWithTests.sti_test_items);
            sti_tests.push(...sti_tests_from_package);
            const uniqueTestsMap = new Map<string, any>();
            for (const test of sti_tests) {
                uniqueTestsMap.set(test._id.toString(), test); // toString() phòng trường hợp _id là ObjectId
            }
            const uniqueTests = Array.from(uniqueTestsMap.values());
            if (!sti_tests || sti_tests.length === 0) {
                return {
                    success: false,
                    message: 'No STI tests found for the given order'
                };
            }
            return {
                success: true,
                message: 'Fetched STI tests successfully',
                sti_tests: uniqueTests
            };

        } catch (error) {
            console.error('Error fetching STI test dropdown by order ID:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
            
        }
    }

    private static filterValidFields = (obj: any) => {
        const result = {};
        for (const key in obj) {
          const value = obj[key];
          if (value !== undefined && value !== null && value !== '') {
            result[key] = value;
          }
        }
        return result;
    };

    public static async createResultIfNotExists(orderId: string) {
        if (!orderId) {
            return {
                success: false,
                message: 'Order id is not found'
            }
        }
    
        const order = await StiOrderRepository.findOrderById(orderId);
        if (!order) {
            return {
                success: false,
                message: 'Order is not found'
            };
        }
    
        const existingResult = await StiResultRepository.findByOrderId(orderId);
        if (existingResult) {
            return {
                success: true,
                message: 'Sti result is created',
                data: existingResult
            }
        }
    
        const newResult = new StiResult({
            sti_order_id: orderId,
            sti_result_items: [],
            diagnosis: '',
            is_confirmed: false,
            medical_notes: ''
        });
    
        const savedResult = StiResultRepository.createStiResult(newResult);
        return {
            success: true,
            message: 'Create new sti result successfully',
            data: savedResult
        }
    }

    public static async saveOrUpdateResult(
        orderId: string,
        user: JWTPayload,
        sti_result_items: StiResultItem,
        is_testing_completed: boolean,
        diagnosis: string,
        is_confirmed: boolean,
        medical_notes: string
    ) {
        if (!orderId){
            return { success: false, message: 'Order id not found' };
        }
        let order = await StiOrderRepository.findOrderById(orderId);
        if (!order) {
            return{
                success: false, 
                message: 'Order not found'  
            }
        }
        let result = await StiResultRepository.findByOrderId(orderId);
        if (!result){
            return {
                success: false,
                message: 'Result is not found'
            }
        }
    
        const processedItems = [];
    
        if (Array.isArray(sti_result_items)) {
            const staff = await StaffRepository.findByUserId(user.userId);
            if (!staff) {
                return { success: false, message: 'Staff not found' };
            }
            for (const item of sti_result_items) {
                const { sti_test_id, result } = item;
                if (!sti_test_id || !result) continue;
        
                const hasData =
                (result.urine && Object.values(result.urine).some(v => v != null && v !== '')) ||
                (result.blood && Object.values(result.blood).some(v => v != null && v !== '')) ||
                (result.swab && Object.values(result.swab).some(v => v != null && v !== ''));
        
                if (!hasData) continue;
        
                const sti_test_type = await StiTestRepository.getStiTestTypeById(sti_test_id);
                if (!sti_test_type) continue;
        
                const resultItem: any = {
                    sti_test_id: new mongoose.Types.ObjectId(sti_test_id),
                    result: {
                        sample_type: sti_test_type,
                        time_completed: TimeUtils.getCurrentTimeInZone(),
                        staff_id: staff._id
                    }
                };
        
                if (result.urine) {
                    const clean = this.filterValidFields(result.urine);
                    if (Object.keys(clean).length > 0) 
                        resultItem.result.urine = clean;
                }
        
                if (result.blood) {
                    const clean = this.filterValidFields(result.blood);
                    if (Object.keys(clean).length > 0) 
                        resultItem.result.blood = clean;
                }
        
                if (result.swab) {
                    const clean = this.filterValidFields(result.swab);
                    if (Object.keys(clean).length > 0) 
                        resultItem.result.swab = clean;
                }
        
                processedItems.push(resultItem);
            }
        }
        
        let savedResult = null;
        let existingResult = await StiResultRepository.findByOrderId(orderId);
    
        if (existingResult) {
            existingResult.sti_result_items = processedItems;
        if (diagnosis !== undefined) 
            existingResult.diagnosis = diagnosis;
        if (is_confirmed !== undefined) 
            existingResult.is_confirmed = is_confirmed;
        if (medical_notes !== undefined) 
            existingResult.medical_notes = medical_notes;
        
        existingResult.markModified('sti_result_items');
        savedResult = await existingResult.save();
        } else {
            const newResult = new StiResult({
                sti_order_id: orderId,
                sti_result_items: processedItems,
                is_testing_completed,
                diagnosis,
                is_confirmed,
                medical_notes
            });
            savedResult = await newResult.save();
        }
    
        return {
            success: true,
            message: `Successfully saved ${processedItems.length} test results`,
            data: savedResult
        };
    }
      
    public static async saveOrUpdateResultById(
        resultId: string,
        user: JWTPayload,
        diagnosis: string,
        medical_notes: string
    ) {
        if (!resultId) {
            return { success: false, message: 'Result id not found' };
        }
    
        let result = await StiResultRepository.findById(resultId);
        if (!result) {
            return {
                success: false,
                message: 'Result not found'
            };
        }
    
        let order = await StiOrderRepository.findOrderById(result.sti_order_id?.toString());
        if (!order) {
            return {
                success: false,
                message: 'Order not found'
            };
        }
        const consultant = await ConsultantRepository.findByUserId(user.userId);
        if (!consultant){
            return{
                success: false,
                message: 'Consultant is not found'
            }
        }
        console.log("Consultant id:", consultant._id);
        console.log("Consultant id in order:", consultant._id);
        if (user.role === 'consultant' && consultant._id.equals(order.consultant_id)) {
            if (diagnosis !== undefined)
                result.diagnosis = diagnosis;
            if (medical_notes !== undefined)
                result.medical_notes = medical_notes;
        }
    
        const savedResult = await result.save();
    
        return {
            success: true,
            message: `Successfully saved diagnosis and medical notes successfully`,
            data: savedResult
        };
    }
    
    public static async getStiResultByOrderId(orderId: string) {
        try {
            const result = await StiResultRepository.getStiResultByOrder(orderId);
        
            if (!result) 
                return{
                    success: false,
                    message: 'Result is not found',
                    data: null
                };
            return{
                success: true,
                message: 'Fetch sti result by order successfully',
                data: result
            } 
        } catch (error) {
          console.error('Error in getStiResultByOrderId:', error);
          throw error;
        }
    }

    public static async getStiResultsWithPagination(query: StiResultQuery): Promise<StiResultPaginationResponse> {
        try {
            console.log('[DEBUG] STI Result Service - Input query:', query);
        
            const { page, limit, sort_by, sort_order } = PaginationUtils.validateStiResultPagination(query);
            const filters = PaginationUtils.buildStiResultFilter(query);
        
            console.log('[DEBUG] STI Result filters:', filters);
        
            const result = await StiResultRepository.findWithPagination(filters, page, limit, sort_by, sort_order);
            const pagination = PaginationUtils.calculatePagination(result.total, page, limit);
        
            const filters_applied: Record<string, any> = {};
            if (query.page) filters_applied.page = query.page;
            if (query.limit) filters_applied.limit = query.limit;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            if (query.sti_order_id) filters_applied.sti_order_id = query.sti_order_id;
            if (query.is_testing_completed) filters_applied.is_testing_completed = query.is_testing_completed;
            if (query.is_confirmed) filters_applied.is_confirmed = query.is_confirmed;
            if (query.staff_id) filters_applied.staff_id = query.staff_id;
            if (query.received_time_from) filters_applied.received_time_from = query.received_time_from;
            if (query.received_time_to) filters_applied.received_time_to = query.received_time_to;
      
            return {
                success: true,
                message: result.results.length > 0
                ? `Found ${result.results.length} STI results`
                : 'No STI results found with the given criteria',
                data: {
                    items: result.results,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
          console.error('❌ Error getting STI results with pagination:', error);
          return {
            success: false,
            message: 'Internal server error when getting STI results',
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
      
}
