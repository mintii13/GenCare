import { StiOrder, IStiOrder } from '../models/StiOrder';
import { IStiTestSchedule } from '../models/StiTestSchedule';
import mongoose from 'mongoose';

export class StiOrderRepository{
    public static async insertStiOrder(stiOrder: IStiOrder): Promise<IStiOrder | null>{
        try {
            return await StiOrder.create(stiOrder);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getOrdersByCustomer(customer_id: string): Promise<IStiOrder[] | null> {
        return await StiOrder.find({
            customer_id,
            order_status: { $ne: 'Canceled' }
        }).sort({ createdAt: 1 });
    }

    public static async findOrderById(id: string){
        try {
            return await StiOrder.findById(id);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getOrdersByTestScheduleId(schedule: IStiTestSchedule){
        try {
            return await StiOrder.find({ sti_schedule_id: schedule._id }).lean<IStiTestSchedule>();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async saveOrder(order: IStiOrder): Promise<IStiOrder> {
        return await order.save();
    }

    public static async getTotalRevenueByCustomer(customerId: string): Promise<number> {
        const result = await StiOrder.aggregate([
        {
            $match: {
                customer_id: new mongoose.Types.ObjectId(customerId),
                order_status: 'Completed',
                payment_status: 'Paid'
            }
        },
        {
            $group: {
                _id: '$customer_id',
                total_revenue: { $sum: '$total_amount' },
                count_orders: { $sum: 1 }
            }
        }
        ]);
        return result[0]?.total_revenue || 0;
    }

    public static async getTotalRevenue(): Promise<number> {
        const result = await StiOrder.aggregate([
        {
            $match: {
                order_status: 'Completed',
                payment_status: 'Paid'
            }
        },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$total_amount' },
                count_orders: { $sum: 1 }
            }
        }
        ]);
        return result[0]?.total_revenue || 0;
    }
}