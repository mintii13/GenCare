import mongoose from 'mongoose';
import { StiTest, IStiTest, TestTypes } from '../models/StiTest';

export class StiTestRepository{
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
            return await stiTest.save();
        } catch (error) {
            console.error(error);
            throw error;
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

    public static async updateIsActive(id: string){
        try {
            const objectId = new mongoose.Types.ObjectId(id)
            return await StiTest.findByIdAndUpdate(objectId, {is_active: true}, { new: true, runValidators: true });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getAllStiTest(): Promise<IStiTest[] | null>{
        try {
            return await StiTest.find().lean<IStiTest[]>();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getStiTestById(id: string): Promise<IStiTest | null> {
        try {
            return await StiTest.findById(id);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async findByIdAndUpdate(sti_test_id: string, userId: string): Promise<IStiTest | null> {
        try {
            const objectStiId = new mongoose.Types.ObjectId(sti_test_id);
            return await StiTest.findOneAndUpdate(
                { _id: objectStiId },
                { is_active: false },
                { new: true }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getTestTypesByIds(testIds: mongoose.Types.ObjectId[]): Promise<string[]> {
        try {
            const tests = await StiTest.find({ _id: { $in: testIds } }).select('sti_test_type');
            return tests.map(test => test.sti_test_type);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getStiTestsByIds(stiTestIds: mongoose.Types.ObjectId[]): Promise<IStiTest[]> {
        try {
            return await StiTest.find({ _id: { $in: stiTestIds } }).lean<IStiTest[]>();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    public static async getStiTestTypeById(sti_test_id: string): Promise<TestTypes | null> {
        try {
            const test = await StiTest.findById(sti_test_id).select('sti_test_type').lean<IStiTest>();
            return test ? test.sti_test_type : null;
        } catch (error) {
            console.error('Error getting STI test type by ID:', error);
            throw error;
        }
    }
}