import { Customer, ICustomer } from '../models/Customer';
import mongoose from 'mongoose';

export class CustomerRepository {
    public static async create(customerData: Partial<ICustomer>): Promise<ICustomer> {
        try {
            const customer = new Customer(customerData);
            return await customer.save();
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    }

    public static async findByUserId(userId: string): Promise<ICustomer | null> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            return await Customer.findOne({ user_id: userObjectId });
        } catch (error) {
            console.error('Error finding customer by user ID:', error);
            throw error;
        }
    }

    public static async findById(customerId: string): Promise<ICustomer | null> {
        try {
            return await Customer.findById(customerId);
        } catch (error) {
            console.error('Error finding customer by ID:', error);
            throw error;
        }
    }

    public static async updateByUserId(userId: string, updateData: Partial<ICustomer>): Promise<ICustomer | null> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            return await Customer.findOneAndUpdate(
                { user_id: userObjectId },
                { ...updateData, last_updated: new Date() },
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    public static async deleteByUserId(userId: string): Promise<boolean> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const result = await Customer.findOneAndDelete({ user_id: userObjectId });
            return !!result;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }
}