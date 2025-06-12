import { StiOrder, IStiOrder } from '../models/StiOrder';

export class StiOrderRepository{
    public static async findByOrderCode(order_code: string): Promise<IStiOrder | null> {
        try {
            return await StiOrder.findOne({ order_code }).lean<IStiOrder>();
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    public static async checkExistOrderCode(order_code: string): Promise<boolean> {
        try {
            const exist =  await StiOrder.exists({ order_code });
            return !!exist;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    public static async insertStiOrder(stiOrder: IStiOrder): Promise<IStiOrder | null>{
        try {
            return await StiOrder.create(stiOrder);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getOrdersByCustomer(customer_id: string): Promise<IStiOrder[] | null> {
        return await StiOrder.find({ customer_id }).sort({ createdAt: 1 });
    }

    public static async findOrderById(id: string){
        try {
            return await StiOrder.findById(id);
        } catch (error) {
            
        }
    }
    
}

