import { ObjectId } from "mongoose";
import { AllStiTestResponse, StiTestResponse } from "../dto/responses/StiResponse";
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

    public static async getAllStiTest(): Promise<AllStiTestResponse>{
        try {
            const allOfTest = await StiRepository.getAllStiTest();
            if (!allOfTest){
                return{
                    success: false,
                    message: 'Fail in getting Sti Test'
                }
            }
            return{
                success: true,
                message: 'Fetched STI tests successfully',
                stitest: allOfTest
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getStiTestById(id: string): Promise<StiTestResponse> {
        try {
            const stiTest = await StiRepository.getStiTestById(id);
            if (!stiTest) {
                return {
                    success: false,
                    message: 'STI Test not found'
                };
            }

            return {
                success: true,
                message: 'STI Test fetched successfully',
                stitest: stiTest
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }
}