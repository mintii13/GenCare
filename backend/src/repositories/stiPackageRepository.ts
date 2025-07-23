import mongoose from 'mongoose';
import { StiPackage, IStiPackage } from '../models/StiPackage';

export class StiPackageRepository{
    public static async insertStiPackage(stiPackage: IStiPackage): Promise<IStiPackage | null>{
        try {
            return await StiPackage.create(stiPackage);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async findByStiPackageCode(sti_package_code: string): Promise<IStiPackage | null> {
        try {
            return await StiPackage.findOne({ sti_package_code }).lean<IStiPackage>();
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    public static async updateIsActive(id: string){
        try {
            const objectId = new mongoose.Types.ObjectId(id)
            return await StiPackage.findByIdAndUpdate(objectId, {is_active: true}, { new: true, runValidators: true });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async findPackageById(id: string){
        try {
            return await StiPackage.findById(id);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getAllStiTPackage(): Promise<IStiPackage[] | null>{
        try {
            return await StiPackage.find().lean<IStiPackage[]>();
        } catch (error) {
            console.error(error);
        }
    }

    public static async findByIdAndUpdateStiPackage(id: string, updateData: Partial<IStiPackage>): Promise<IStiPackage | null>{
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            return await StiPackage.findByIdAndUpdate(objectId, updateData, { new: true, runValidators: true });        
        } catch (error) {
            console.error(error);
        }
    }

    public static async findByIdAndDeactivate(sti_package_id: string, userId: string): Promise<IStiPackage | null> {
        try {
            const objectStiId = new mongoose.Types.ObjectId(sti_package_id);
            const objectUserId = new mongoose.Types.ObjectId(userId);
            return await StiPackage.findOneAndUpdate(
                { _id: objectStiId, created_by: objectUserId },
                { is_active: false },
                { new: true }
            );
        } catch (error) {
            console.error(error);
        }
    }

    public static async getPackageNameById(packageId: string): Promise<string | null> {
        try {
            const pkg = await StiPackage.findById(packageId).select('sti_package_name').lean();
            return pkg?.sti_package_name || null;
        } catch (error) {
            console.error('Error in getPackageNameById:', error);
            throw error;
        }
    }
}