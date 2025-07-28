import { StiOrder, IStiOrder } from '../models/StiOrder';
import { IStiTestSchedule } from '../models/StiTestSchedule';
import mongoose from 'mongoose';

export class StiOrderRepository {
    public static async insertStiOrder(stiOrder: IStiOrder): Promise<IStiOrder | null> {
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

    public static async findOrderById(id: string) {
        try {
            return await StiOrder.findById(id).populate('customer_id', 'full_name email phone');
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getOrdersByTestScheduleId(schedule: IStiTestSchedule) {
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

    public static async hasBookedOrder(customerId: string): Promise<boolean> {
      const objectId = new mongoose.Types.ObjectId(customerId);

      const exists = await StiOrder.exists({
        customer_id: objectId,
        order_status: 'Booked'
      });

      return !!exists;
    }

    public static async getTotalRevenueByCustomer(customerId: string): Promise<number> {
        const result = await StiOrder.aggregate([
            {
                $match: {
                    customer_id: new mongoose.Types.ObjectId(customerId),
                    order_status: 'Completed',
                    is_paid: true
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
                    is_paid: true
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

    /**
 * Find STI orders with pagination and filtering
 */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'order_date',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        orders: IStiOrder[];
        total: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const aggregationPipeline = [
                { $match: filters },
              
                // Chuyển string ID sang ObjectId nếu cần
                {
                  $addFields: {
                    consultant_id: {
                      $cond: [
                        { $eq: [{ $type: "$consultant_id" }, "string"] },
                        { $toObjectId: "$consultant_id" },
                        "$consultant_id"
                      ]
                    },
                    staff_id: {
                      $cond: [
                        { $eq: [{ $type: "$staff_id" }, "string"] },
                        { $toObjectId: "$staff_id" },
                        "$staff_id"
                      ]
                    }
                  }
                },
              
                // Lookup consultant → user
                {
                  $lookup: {
                    from: "consultants",
                    localField: "consultant_id",
                    foreignField: "_id",
                    as: "consultant_doc"
                  }
                },
                {
                  $unwind: {
                    path: "$consultant_doc",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: "users",
                    localField: "consultant_doc.user_id",
                    foreignField: "_id",
                    as: "consultant_user"
                  }
                },
              
                // Lookup staff → user
                {
                  $lookup: {
                    from: "staffs",
                    localField: "staff_id",
                    foreignField: "_id",
                    as: "staff"
                  }
                },
                {
                  $unwind: {
                    path: "$staff",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                    $lookup: {
                      from: 'users',
                      localField: 'staff.user_id',
                      foreignField: '_id',
                      as: 'staff_user'
                    }
                  },
                  {
                    $unwind: {
                      path: '$staff_user',
                      preserveNullAndEmptyArrays: true
                    }
                  },
              
                // Lookup customer
                {
                  $lookup: {
                    from: "users",
                    localField: "customer_id",
                    foreignField: "_id",
                    as: "customer"
                  }
                },
              
                // Lookup STI Package name
                {
                  $lookup: {
                    from: "stipackages",
                    localField: "sti_package_item.sti_package_id",
                    foreignField: "_id",
                    as: "sti_package_lookup"
                  }
                },
                {
                  $addFields: {
                    sti_package_item: {
                      sti_package_id: "$sti_package_item.sti_package_id",
                      sti_package_name: { $arrayElemAt: ["$sti_package_lookup.name", 0] }
                    }
                  }
                },
              
                // Lookup STI tests & schedule
                {
                  $lookup: {
                    from: "stitests",
                    localField: "sti_test_items",
                    foreignField: "_id",
                    as: "sti_test_details"
                  }
                },
                {
                  $lookup: {
                    from: "stipackages",
                    localField: "sti_package_item.sti_package_id",
                    foreignField: "_id",
                    as: "sti_package_details"
                  }
                },
                {
                  $lookup: {
                    from: "stitestschedules",
                    localField: "sti_schedule_id",
                    foreignField: "_id",
                    as: "schedule_details"
                  }
                },
                //Lookup sti result
                {
                  $lookup: {
                    from: 'stiresults',
                    localField: '_id',               // _id của đơn hàng
                    foreignField: 'sti_order_id',    // sti_order_id trong bảng kết quả
                    as: 'sti_result'
                  }
                },
                {
                  $unwind: {
                    path: '$sti_result',
                    preserveNullAndEmptyArrays: true
                  }
                },
              
                // Flatten các trường lookup
                {
                    $addFields: {
                      customer: { $arrayElemAt: ["$customer", 0] },
                      consultant_user: { $arrayElemAt: ["$consultant_user", 0] },
                      consultant_full_name: "$consultant_user.full_name",
                      staff_full_name: "$staff_user.full_name",
                      sti_package_details: { $arrayElemAt: ["$sti_package_details", 0] },
                      schedule_details: { $arrayElemAt: ["$schedule_details", 0] }
                    }
                },
              
                { $sort: { [sortBy]: sortOrder } }
              ];
              

            // Count total documents
            const totalCountPipeline = [
                { $match: filters },
                { $count: 'total' }
            ];

            const [orders, totalCount] = await Promise.all([
                StiOrder.aggregate([
                    ...aggregationPipeline,
                    { $skip: skip },
                    { $limit: limit }
                ]),
                StiOrder.aggregate(totalCountPipeline)
            ]);

            const total = totalCount[0]?.total || 0;

            return {
                orders: orders as IStiOrder[],
                total
            };
        } catch (error) {
            console.error('Error in findWithPagination:', error);
            throw error;
        }
    }

    public static async getOrderWithTests(orderId: string): Promise<IStiOrder | null> {
        return await StiOrder.findById(orderId)
        .populate('sti_package_item.sti_test_ids')
        .populate('sti_test_items');
    }

    public static async getStiTestInOrder(orderId: string): Promise<IStiOrder | null> {
        try {
            return await StiOrder.findById(orderId)
                .populate({ path: 'sti_test_items', model: 'StiTest' })
                .populate({ path: 'sti_package_item.sti_test_ids', model: 'StiTest' })
                .lean<IStiOrder>();
        } catch (error) {
            console.error('Error fetching STI tests in order:', error);
            throw error;
        }
    }
}