import { StiResult, IStiResult } from '../models/StiResult';
import { IStiOrder, StiOrder } from '../models/StiOrder'; // Assuming this exists
import { UpdateStiResultRequest } from '../dto/requests/StiRequest';
import '../models/StiPackage';
import '../models/StiPackageTest';
import '../models/StiTest';

export class StiResultRepository {
    public static async create(data: Partial<IStiResult>): Promise<IStiResult> {
        try {
            const stiResult = new StiResult(data);
            return await stiResult.save();
        } catch (error) {
            throw new Error(`Error creating STI result: ${error}`);
        }
    }

    public static async findById(id: string){
        try {
            return await StiResult.findById(id).populate<{ sti_order_id: IStiOrder }>('sti_order_id').lean();
        } catch (error) {
            throw new Error(`Error finding STI result by ID: ${error}`);
        }
    }

    public static async findExistedResult(orderId: string): Promise<IStiResult | null> {
        try {
            return await StiResult.findOne({
                sti_order_id: orderId,
                is_active: true
            });
        } catch (error) {
            throw new Error(`Error finding STI result by ID: ${error}`);
        }
    }

    public static async findByOrderId(orderId: string) {
        try {
            return await StiResult.findOne({ sti_order_id: orderId }).populate<{ sti_order_id: IStiOrder }>('sti_order_id').lean();
        } catch (error) {
            throw new Error(`Error finding STI result by order ID: ${error}`);
        }
    }

    public static async findAll(): Promise<IStiResult[]> {
        try {
            return await StiResult.find({}).populate('sti_order_id');
        } catch (error) {
            throw new Error(`Error finding STI results: ${error}`);
        }
    }

    public static async getStiOrderWithTests(orderId: string) {
        try {
            return await StiOrder.findById(orderId)
                .populate('sti_test_items')
                .populate('sti_package_item.sti_package_id')
                .populate('sti_package_item.sti_test_ids');
        } catch (error) {
            throw new Error(`Error retrieving STI order with tests: ${error}`);
        }
    }

    public static async updateById(id: string, updateData: UpdateStiResultRequest){
        try {
            const updatedResult = await StiResult.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).populate<{ sti_order_id: IStiOrder }>('sti_order_id').exec();
            return updatedResult;
        } catch (error) {
            throw new Error(`Error updating STI result: ${error}`);
        }
    }

    public static async getFullResult(stiResultId: string){
        try {
            return await StiResult.findById(stiResultId)
                    .populate({
                        path: 'sti_order_id',
                        populate: [
                            { path: 'customer_id', select: 'full_name email gender date_of_birth' },
                            { path: 'consultant_id', populate: { path: 'user_id', select: 'full_name' } },
                            { path: 'staff_id', populate: { path: 'user_id', select: 'full_name' } },
                            { path: 'sti_test_items', select: 'sti_test_name' },
                            {
                                path: 'sti_package_item',
                                populate: {
                                    path: 'sti_test_ids',
                                    select: 'sti_test_name'
                                }
                            }

                        ]
                    });
        } catch (error) {
            throw new Error(`Error getting STI result: ${error}`);
        }
    }
}
