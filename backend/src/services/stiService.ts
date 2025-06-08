import { ObjectId } from "mongoose";
import { StiTestResponse } from "../dto/responses/StiResponse";
import { IStiTest, StiTest } from '../models/StiTest';
import { StiRepository } from "../repositories/stiRepository";

export class StiService{
    public static async createStiTest(stiTest: IStiTest, createdBy: string): Promise<StiTestResponse>{
        try {
            const duplicate = await StiRepository.findByStiTestCode(stiTest.sti_test_code);
            if (duplicate){
                return{
                    success: false,
                    message: 'Sti test code is duplicated'
                }
            }
            const result: Partial<IStiTest> = await StiRepository.insertStiTest(stiTest);
            if (!result){
                return{
                    success: false,
                    message: 'Cannot insert StiTest to database'
                }
            }
            return {
                success: true,
                message: 'Insert StiTest to database successfully',
                createdBy,
                stitest: result
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }
}