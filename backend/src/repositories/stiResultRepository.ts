import { StiResult, IStiResult } from '../models/StiResult';
import { IStiOrder, StiOrder } from '../models/StiOrder'; // Assuming this exists
import '../models/StiPackage';
import '../models/StiPackageTest';
import '../models/StiTest';
import { JwtPayload } from 'jsonwebtoken';

export class StiResultRepository {
    public static async findByOrderId(orderId: string): Promise<IStiResult | null> {
        try {
            return await StiResult.findOne({ sti_order_id: orderId });
        } catch (error) {
            console.error('Error finding STI result by order ID:', error);
            throw error;
        }
    }

    public static async createStiResult(resultData: IStiResult): Promise<IStiResult> {
        try {
            return await resultData.save();
        } catch (error) {
            console.error('Error creating STI result:', error);
            throw error;
        }
    }

    public static async updateStiResult(result: Partial<IStiResult>): Promise<IStiResult | null> {
        try {
            const updatedResult = await StiResult.findByIdAndUpdate(result._id, result, { new: true });
            if (!updatedResult) {
                throw new Error('STI result not found');
            }
            return updatedResult;
        } catch (error) {
            console.error('Error updating STI result:', error);
            throw error;
        }
    }

    public static async getStiResultsByCustomerId(customerId: string) {
        try {
            return await StiResult.find({ customer_id: customerId }).populate('sti_result_items.sti_test_id');
        } catch (error) {
            console.error('Error getting STI result by customer:', error);
            throw error;
        }
    }

    public static async getMyStiResultByOrder(user: JwtPayload, orderId: string){
        try {
            return await StiResult.findOne({
                customer_id: user._id,
                sti_order_id: orderId
            }).populate('sti_result_items.sti_test_id');
        } catch (error) {
            console.error('Error getting STI result by customer:', error);
            throw error;
        }
    }

    public static async getStiResultByOrder(orderId: string){
        try {
            return await StiResult.findOne({
                sti_order_id: orderId
            }).populate('sti_result_items.sti_test_id');
        } catch (error) {
            console.error('Error getting STI result by order:', error);
            throw error;
        }
    }
}
