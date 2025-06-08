import mongoose from 'mongoose';
import { StiTest, IStiTest } from '../models/StiTest';

export class StiRepository{
    public static async findById(id: string): Promise<IStiTest | null>{
        try {
            return await StiTest.findById(id);
        } catch (error) {
            console.error(error);
        }
    }

    public static async findByIdAndUpdateStiTest(id: string, updateData: Partial<IStiTest>): Promise<IStiTest | null>{
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            return await StiTest.findByIdAndUpdate(objectId, updateData, { new: true, runValidators: true });        
        } catch (error) {
            console.error(error);
        }
    }

    public static async insertStiTest(stiTest: IStiTest): Promise<IStiTest | null>{
        try {
            return await StiTest.create(stiTest);
        } catch (error) {
            console.error(error);
        }
    }

    public static async findByStiTestCode(sti_test_code: string): Promise<IStiTest | null> {
            try {
                return await StiTest.findOne({ sti_test_code }).lean<IStiTest>();
            } catch (error) {
                console.error('Error finding user by email:', error);
                throw error;
            }
    }

    public static async getAllStiTest(){
        try {
            return await StiTest.find();
        } catch (error) {
            console.error(error);
        }
    }

    public static async getStiTestById(id: string): Promise<IStiTest | null> {
        try {
            return await StiTest.findOne({ sti_test_id: id });
        } catch (error) {
            console.error(error);
        }
    }
}