import { StiResult, IStiResult } from '../models/StiResult';
import { IStiOrder, StiOrder } from '../models/StiOrder'; // Assuming this exists
import '../models/StiPackage';
import '../models/StiPackageTest';
import '../models/StiTest';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

export class StiResultRepository {
    public static async findByOrderId(orderId: string): Promise<IStiResult | null> {
        try {
            return await StiResult.findOne({ sti_order_id: orderId });
        } catch (error) {
            console.error('Error finding STI result by order ID:', error);
            throw error;
        }
    }

    public static async findById(resultId: string): Promise<IStiResult | null> {
      try {
          return await StiResult.findById(resultId);
      } catch (error) {
          console.error('Error finding STI result by result ID:', error);
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

    public static async completedResult(orderId: string){
        try {
            const objOrderId = new mongoose.Types.ObjectId(orderId);
            const result = await StiResult.findOneAndUpdate(
                { sti_order_id: objOrderId, is_testing_completed: false},
                { is_testing_completed: true },
                { new: true }
            );
            return result;
        } catch (error) {
            console.error('Completed result error');
            throw error;
        }
    }

    public static async completedResultById(resultId: string){
      try {
          const objResultId = new mongoose.Types.ObjectId(resultId);
          const result = await StiResult.findOneAndUpdate(
              { _id: objResultId, is_testing_completed: false},
              { is_testing_completed: true },
              { new: true }
          );
          return result;
      } catch (error) {
          console.error('Completed result error');
          throw error;
      }
  }

    public static async getAllResults(){
        try {
            return await StiResult.find()
                        .populate('sti_order_id', 'order_code customer_id') // Populate order code, customer if needed
                        .populate('sti_result_items.sti_test_id', 'test_name') // Populate test info
                        .populate('sti_result_items.result.staff_id', 'full_name') // Populate staff
                        .populate('sti_result_items.result.sti_test_id', 'sti_test_name sti_test_code sti_test_type')
                        .sort({ createdAt: -1 });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    public static async findWithPagination(
      filters: any,
      page: number,
      limit: number,
      sortBy: string = 'createdAt',
      sortOrder: 1 | -1 = -1
    ): Promise<{
      results: IStiResult[];
      total: number;
    }> {
      try {
        const skip = (page - 1) * limit;
        const sortStage: Record<string, any> = {};
        sortStage[sortBy] = sortOrder;
        sortStage['_id'] = -1;
        const pipeline = [
          { $match: filters },
    
          // Lookup STI order
          {
            $lookup: {
              from: 'stiorders',
              localField: 'sti_order_id',
              foreignField: '_id',
              as: 'sti_order'
            }
          },
          {
            $unwind: {
              path: '$sti_order',
              preserveNullAndEmptyArrays: true
            }
          },
    
          // Lookup customer from order
          {
            $lookup: {
              from: 'users',
              localField: 'sti_order.customer_id',
              foreignField: '_id',
              as: 'customer'
            }
          },
          {
            $addFields: {
              customer: { $arrayElemAt: ['$customer', 0] }
            }
          },
    
          // Lookup sti_test_details
          {
            $unwind: {
              path: '$sti_result_items',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'stitests',
              localField: 'sti_result_items.sti_test_id',
              foreignField: '_id',
              as: 'sti_result_items.test_detail'
            }
          },
          {
            $addFields: {
              'sti_result_items.test_detail': { $arrayElemAt: ['$sti_result_items.test_detail', 0] }
            }
          },
          {
            $addFields: {
              staffObjectId: { $toObjectId: '$sti_order.staff_id' }
            }
          },
          {
            $lookup: {
              from: 'staffs',
              localField: 'staffObjectId',
              foreignField: '_id',
              as: 'staff'
            }
          },
          {
            $addFields: {
              staff: { $arrayElemAt: ['$staff', 0] }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'staff.user_id',
              foreignField: '_id',
              as: 'staff.user'
            }
          },
          {
            $unwind: {
              path: '$staff.user',
              preserveNullAndEmptyArrays: true
            }
          },
          //consultant
          {
            $addFields: {
              consultantObjectId: { $toObjectId: '$sti_order.consultant_id' }
            }
          },
          {
            $lookup: {
              from: 'consultants',
              localField: 'consultantObjectId',
              foreignField: '_id',
              as: 'consultant'
            }
          },
          {
            $addFields: {
              consultant: { $arrayElemAt: ['$consultant', 0] }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'consultant.user_id',
              foreignField: '_id',
              as: 'consultant.user'
            }
          },
          {
            $unwind: {
              path: '$consultant.user',
              preserveNullAndEmptyArrays: true
            }
          },

          // Re-group by result
          {
            $group: {
              _id: '$_id',
              sti_order_id: { $first: '$sti_order_id' },
              is_testing_completed: { $first: '$is_testing_completed' },
              is_confirmed: { $first: '$is_confirmed' },
              createdAt: { $first: '$createdAt' },
              updatedAt: { $first: '$updatedAt' },
              sti_order: { $first: '$sti_order' },
              customer: { $first: '$customer' },
              staff: { $first: '$staff' },
              consultant: {$first: '$consultant'},
              sti_result_items: { $push: '$sti_result_items' }
            }
          },
    
          // Sort results
          { $sort: sortStage }
        ];
    
        const totalCountPipeline = [
          { $match: filters },
          { $count: 'total' }
        ];
    
        const [results, totalCount] = await Promise.all([
          StiResult.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
          StiResult.aggregate(totalCountPipeline)
        ]);
    
        // Sort sti_result_items inside each result (by test_detail.createdAt)
        const sortedResults = results.map((result: any) => {
          if (Array.isArray(result.sti_result_items)) {
            result.sti_result_items.sort((a: any, b: any) => {
              const dateA = new Date(a?.test_detail?.createdAt || 0).getTime();
              const dateB = new Date(b?.test_detail?.createdAt || 0).getTime();
              return dateA - dateB;
            });
          }
          return result;
        });
    
        const total = totalCount[0]?.total || 0;
    
        return {
          results: sortedResults as IStiResult[],
          total
        };
      } catch (error) {
        console.error('Error in StiResultRepository.findWithPagination:', error);
        throw error;
      }
    }
    
    public static async confirmAndGetAllFields(resultId: string){
      try {
        return await StiResult.findByIdAndUpdate(
          resultId,
          { is_confirmed: true },
          { new: true }
        ).populate([
          {
            path: 'sti_order_id',
            populate: [
              { path: 'customer_id', model: 'User' },
              {
                path: 'consultant_id',
                model: 'Consultant',
                populate: { path: 'user_id', model: 'User' }
              },
              {
                path: 'staff_id',
                model: 'Staff',
                populate: { path: 'user_id', model: 'User' }
              }
            ]
          },
          { path: 'sti_result_items.sti_test_id', model: 'StiTest' }
        ]);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
      
}
