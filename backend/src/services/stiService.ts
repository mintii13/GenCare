import { ObjectId } from "mongoose";
import { AllStiTestResponse, StiTestResponse, StiPackageResponse, AllStiPackageResponse } from '../dto/responses/StiResponse';
import { IStiTest, StiTest } from '../models/StiTest';
import { StiRepository } from "../repositories/stiRepository";
import { IStiPackage } from "../models/StiPackage";
import { StiPackageRepository } from "../repositories/stiPackageRepository";

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
  
    public static async updateStiTest(sti_test_id: string, updateData: Partial<IStiTest>): Promise<StiTestResponse> {
        try {
            const exists = await StiRepository.findByStiTestCode(updateData.sti_test_code);
            if (exists) {
                return {
                    success: false,
                    message: 'STI test code already exists',
                };
            }
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


    public static async createStiPackage(stiPackage: IStiPackage): Promise<StiPackageResponse>{
        try {
            const duplicate = await StiPackageRepository.findByStiPackageCode(stiPackage.sti_package_code);
            if (duplicate){
                if (duplicate.is_active){
                    return{
                        success: false,
                        message: 'Sti package code is duplicated'
                    }
                }
                else{
                    //update is_active thành true
                    const result = await StiPackageRepository.updateIsActive(duplicate._id);
                    return{
                        success: true,
                        message: 'Insert StiPackage to database successfully',
                        stipackage: result
                    }
                }
            }
            const result: Partial<IStiPackage> = await StiPackageRepository.insertStiPackage(stiPackage);
            if (!result){
                return{
                    success: false,
                    message: 'Cannot insert StiPackage to database'
                }
            }
            return {
                success: true,
                message: 'Insert StiPackage to database successfully',
                stipackage: result
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async getAllStiPackage(): Promise<AllStiPackageResponse>{
        try {
            const allOfTest = await StiPackageRepository.getAllStiTPackage();
            if (!allOfTest){
                return{
                    success: false,
                    message: 'Fail in getting StiPackage'
                }
            }
            return{
                success: true,
                message: 'Get STI packages successfully',
                stipackage: allOfTest
            }
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error'
            }
        }
    }

    public static async updateStiPackage(sti_package_id: string, updateData: Partial<IStiPackage>): Promise<StiPackageResponse> {
        try {
            const exists = await StiPackageRepository.findByStiPackageCode(updateData.sti_package_code);
            if (exists) {
                return {
                    success: false,
                    message: 'STI package code already exists',
                };
            }
            const sti_package = await StiPackageRepository.findByIdAndUpdateStiPackage(sti_package_id, updateData);
            if (!sti_package) {
                return{
                    success: false, 
                    message: 'STIPackage not found'
                }
            }
            // Bỏ kiểm tra quyền, ai cũng update được nếu là staff hoặc admin
            return{
                success: true,
                message: 'Update STIPackage successfully',
                stipackage: sti_package
            }
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }
    
    public static async deleteStiPackage(sti_package_id: string, userId: string): Promise<StiPackageResponse> {
        try {
            const updated = await StiPackageRepository.findByIdAndDeactivate(sti_package_id, userId);
            if (!updated) {
                return {
                    success: false,
                    message: 'StiPackage not found or you are not authorized to update it'
                };
            }

            return{
                success: true,
                message: 'StiPackage deactivated successfully',
                stipackage: updated
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