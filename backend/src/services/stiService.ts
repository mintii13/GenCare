import { ObjectId } from "mongoose";
import { AllStiTestResponse, StiTestResponse } from "../dto/responses/StiResponse";
import { IStiTest, StiTest } from '../models/StiTest';
import { StiRepository } from "../repositories/stiRepository";
import { UserRepository } from "../repositories/userRepository";

export class StiService{
    public static async createStiTest(stiTest: IStiTest): Promise<StiTestResponse>{
        try {
            const duplicate = await StiRepository.findByStiTestCode(stiTest.sti_test_code);
            if (duplicate){
                if (duplicate.isActive){
                    return{
                        success: false,
                        message: 'Sti test code is duplicated'
                    }
                }
                else{
                    //update isActive thành true
                    const result = await StiRepository.updateIsActive(duplicate._id);
                    return{
                        success: true,
                        message: 'Insert StiTest to database successfully',
                        stitest: result
                    }
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
  
    public static async updateStiTest(sti_test_id: string, updateData: Partial<IStiTest>, user: any): Promise<StiTestResponse> {
        try {
            const sti_test = await StiRepository.findByIdAndUpdateStiTest(sti_test_id, updateData);
            if (!sti_test) {
                return{
                    success: false, 
                    message: 'STI Test not found'
                }
            }
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return{
                success: true,
                message: 'Update STI Test successfully',
                stitest: sti_test
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }   

    public static async deleteStiTest(sti_test_id: string, userId: string): Promise<StiTestResponse> {
        try {
            const updated = await StiRepository.findByIdAndUpdate(sti_test_id, userId);
            if (!updated) {
                return {
                    success: false,
                    message: 'StiTest not found or you are not authorized to update it'
                };
            }

            return{
                success: true,
                message: 'StiTest deactivated successfully',
                stitest: updated
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