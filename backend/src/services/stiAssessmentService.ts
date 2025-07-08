import { StiAssessmentRepository } from '../repositories/stiAssessmentRepository';
import { IStiAssessment } from '../models/StiAssessment';
import mongoose from 'mongoose';
import { StiPackageHelper } from '../utils/stiPackageInfo';

interface AssessmentResponse {
    success: boolean;
    message: string;
    data?: any;
}

interface RecommendationResult {
    recommended_package: string;
    risk_level: 'Thấp' | 'Trung bình' | 'Cao';
    reasoning: string[];
}

export class StiAssessmentService {
    // Main assessment logic based on CDC flowchart
    public static generateRecommendation(assessmentData: IStiAssessment['assessment_data']): RecommendationResult {
        const reasoning: string[] = [];
        let recommendedPackage = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // TIER 1: Triệu chứng cấp tính (Ưu tiên cao nhất)
        if (assessmentData.has_symptoms && assessmentData.symptoms.length > 0) {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Có triệu chứng nghi ngờ STI cần xét nghiệm toàn diện');
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 2: Tình trạng HIV
        if (assessmentData.hiv_status === 'positive') {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Người nhiễm HIV cần sàng lọc STI toàn diện hàng năm');
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 3: MSM - nhóm nguy cơ đặc biệt cao
        if (assessmentData.sexual_orientation === 'msm') {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Nam quan hệ tình dục với nam (MSM) cần sàng lọc toàn diện hàng năm theo CDC');
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 4: Yếu tố nguy cơ cực cao
        const highRiskFactors = ['injection_drug', 'sex_work', 'incarceration'];
        const hasHighRisk = assessmentData.risk_factors && assessmentData.risk_factors.some(factor => highRiskFactors && highRiskFactors.includes(factor));

        if (hasHighRisk) {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Có yếu tố nguy cơ cực cao (ma túy tiêm/mại dâm/giam giữ)');

            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 5: Phân loại theo giới tính, tuổi và nguy cơ
        const result = this.assessByGenderAndAge(assessmentData);
        recommendedPackage = result.package;
        riskLevel = result.riskLevel;
        reasoning.push(...result.reasoning);
        return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
    }

    private static assessByGenderAndAge(data: IStiAssessment['assessment_data']): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // Kiểm tra yếu tố nguy cơ chung
        const hasGeneralRisk = this.hasGeneralRiskFactors(data);

        if (data.gender === 'female') {
            const result = this.assessFemale(data, hasGeneralRisk);
            package_name = result.package;
            riskLevel = result.riskLevel;
            reasoning.push(...result.reasoning);
            additionalTests.push(...result.additionalTests);
        } else if (data.gender === 'male') {
            const result = this.assessMale(data, hasGeneralRisk);
            package_name = result.package;
            riskLevel = result.riskLevel;
            reasoning.push(...result.reasoning);
        } else if (data.gender === 'transgender') {
            const result = this.assessTransgender(data, hasGeneralRisk);
            package_name = result.package;
            riskLevel = result.riskLevel;
            reasoning.push(...result.reasoning);
            additionalTests.push(...result.additionalTests);
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    private static assessFemale(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // Phụ nữ mang thai
        if (data.is_pregnant) {
            if (data.age < 25 || hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Phụ nữ mang thai dưới 25 tuổi hoặc có nguy cơ cần sàng lọc toàn diện');
            } else {
                reasoning.push('Phụ nữ mang thai cần sàng lọc cơ bản');
            }
            additionalTests.push('Tái kiểm tra tam cá nguyệt 3');
            return { package: package_name, riskLevel, reasoning, additionalTests };
        }

        // Phụ nữ theo độ tuổi
        if (data.age < 21) {
            if (data.sexually_active === 'active_single' || data.sexually_active === 'active_multiple') {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Phụ nữ dưới 21 tuổi có hoạt động tình dục');
            } else {
                reasoning.push('Phụ nữ dưới 21 tuổi không hoạt động tình dục');
            }
        } else if (data.age >= 21 && data.age < 25) {
            package_name = 'STI-BASIC-02';
            riskLevel = 'Trung bình';
            reasoning.push('CDC khuyến cáo sàng lọc Chlamydia/Gonorrhea cho phụ nữ dưới 25 tuổi');
            additionalTests.push('HPV/Pap smear');
        } else if (data.age >= 25 && data.age < 30) {
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Phụ nữ 25-29 tuổi có yếu tố nguy cơ');
            } else {
                reasoning.push('Phụ nữ 25-29 tuổi sàng lọc định kỳ');
            }
            additionalTests.push('HPV/Pap smear');
        } else if (data.age >= 30 && data.age <= 64) {
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Phụ nữ 30-64 tuổi có yếu tố nguy cơ');
            } else {
                reasoning.push('Phụ nữ 30-64 tuổi sàng lọc định kỳ (HPV mỗi 5 năm hoặc cytology mỗi 3 năm)');
            }
            additionalTests.push('HPV/Pap smear');
        } else if (data.age > 64) {
            if (hasGeneralRisk || data.sexually_active !== 'not_active') {
                reasoning.push('Phụ nữ trên 65 tuổi có nguy cơ hoặc hoạt động tình dục');
            } else {
                reasoning.push('CDC không khuyến cáo sàng lọc thường xuyên cho nhóm tuổi này');
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    private static assessMale(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // Nam giới theo độ tuổi
        if (data.age <= 25) {
            // Môi trường nguy cơ cao
            const highRiskSettings = data.living_area === 'endemic';
            if (highRiskSettings || hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Nam trẻ ở môi trường nguy cơ cao (phòng khám STI/trại giam/phòng khám thanh thiếu niên)');
            } else if (data.number_of_partners === 'multiple' || data.sexually_active === 'active_multiple') {
                reasoning.push('Nam trẻ có hoạt động tình dục với nhiều bạn tình');
                riskLevel = 'Thấp';
            } else {
                reasoning.push('Nam trẻ sàng lọc cơ bản');
            }
        } else if (data.age >= 26 && data.age <= 64) {
            if (hasGeneralRisk || data.number_of_partners === 'multiple' || data.partner_has_sti) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Nam giới có yếu tố nguy cơ (nhiều bạn tình/STI trong quá khứ/bạn tình có STI)');
            } else if (data.sexually_active !== 'not_active') {
                reasoning.push('Nam giới sàng lọc định kỳ');
            } else {
                reasoning.push('Nam giới sàng lọc cơ bản');
            }
        } else if (data.age > 64) {
            if (hasGeneralRisk || data.sexually_active !== 'not_active') {
                reasoning.push('Nam cao tuổi có hoạt động tình dục hoặc yếu tố nguy cơ');
            } else {
                reasoning.push('Nguy cơ rất thấp cho nhóm tuổi này');
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    private static assessTransgender(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // Giả sử có thông tin về anatomy trong risk_factors
        const hasCervix = data.risk_factors && data.risk_factors.includes('has_cervix');

        if (hasCervix) {
            // Áp dụng quy tắc như phụ nữ
            if (data.age < 25) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Người chuyển giới có cervix dưới 25 tuổi theo khuyến cáo cho phụ nữ');
                additionalTests.push('HPV/Pap smear');
            } else if (data.age >= 25 && data.age <= 65) {
                if (hasGeneralRisk) {
                    package_name = 'STI-BASIC-02';
                    riskLevel = 'Trung bình';
                    reasoning.push('Người chuyển giới có cervix có nguy cơ');
                } else {
                    reasoning.push('Người chuyển giới có cervix sàng lọc định kỳ');
                }
                additionalTests.push('HPV/Pap smear');
            } else {
                if (data.sexually_active !== 'not_active') {
                    reasoning.push('Người chuyển giới cao tuổi có hoạt động tình dục');
                } else {
                    reasoning.push('Không cần sàng lọc thường xuyên');
                }
            }
        } else {
            // Áp dụng quy tắc như nam giới
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Người chuyển giới có nguy cơ');
            } else {
                reasoning.push('Người chuyển giới sàng lọc cơ bản');
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    private static hasGeneralRiskFactors(data: IStiAssessment['assessment_data']): boolean {
        return (
            data.number_of_partners === 'multiple' ||
            data.new_partner_recently ||
            data.partner_has_sti ||
            data.condom_use === 'never' || data.condom_use === 'rarely' ||
            data.previous_sti_history && data.previous_sti_history.length > 0 ||
            data.risk_factors && data.risk_factors.some(factor =>
                ['blood_transfusion', 'prep_user', 'immunocompromised'].includes(factor)
            )
        );
    }

    // API Methods
    public static async createAssessment(customerId: string, assessmentData: IStiAssessment['assessment_data']): Promise<AssessmentResponse> {
        try {
            // Generate recommendation
            const recommendation = this.generateRecommendation(assessmentData);

            // Create assessment record
            const assessment = await StiAssessmentRepository.createAssessment({
                customer_id: new mongoose.Types.ObjectId(customerId),
                assessment_data: assessmentData,
                recommendation
            } as any);

            return {
                success: true,
                message: 'STI assessment completed successfully',
                data: {
                    assessment_id: assessment._id,
                    recommendation
                }
            };
        } catch (error) {
            console.error('Error creating STI assessment:', error);
            return {
                success: false,
                message: 'Failed to create STI assessment'
            };
        }
    }

    public static async getAssessmentHistory(customerId: string): Promise<AssessmentResponse> {
        try {
            const assessments = await StiAssessmentRepository.findByCustomerId(customerId);

            return {
                success: true,
                message: 'Assessment history retrieved successfully',
                data: assessments
            };
        } catch (error) {
            console.error('Error retrieving assessment history:', error);
            return {
                success: false,
                message: 'Failed to retrieve assessment history'
            };
        }
    }

    public static async getAssessmentById(assessmentId: string): Promise<AssessmentResponse> {
        try {
            const assessment = await StiAssessmentRepository.findById(assessmentId);

            if (!assessment) {
                return {
                    success: false,
                    message: 'Assessment not found'
                };
            }

            return {
                success: true,
                message: 'Assessment retrieved successfully',
                data: assessment
            };
        } catch (error) {
            console.error('Error retrieving assessment:', error);
            return {
                success: false,
                message: 'Failed to retrieve assessment'
            };
        }
    }

    public static async updateAssessment(assessmentId: string, updateData: Partial<IStiAssessment['assessment_data']>, userId: string): Promise<AssessmentResponse> {
        try {
            const existingAssessment = await StiAssessmentRepository.findById(assessmentId);

            if (!existingAssessment) {
                return {
                    success: false,
                    message: 'Assessment not found'
                };
            }

            // Regenerate recommendation with new data
            const newRecommendation = this.generateRecommendation(updateData as IStiAssessment['assessment_data']);

            const updatedAssessment = await StiAssessmentRepository.updateAssessment(assessmentId, {
                assessment_data: updateData,
                recommendation: newRecommendation
            } as any);

            return {
                success: true,
                message: 'Assessment updated successfully',
                data: updatedAssessment
            };
        } catch (error) {
            console.error('Error updating assessment:', error);
            return {
                success: false,
                message: 'Failed to update assessment'
            };
        }
    }

    public static async deleteAssessment(assessmentId: string, userId: string): Promise<AssessmentResponse> {
        try {
            const deletedAssessment = await StiAssessmentRepository.deleteAssessment(assessmentId);

            if (!deletedAssessment) {
                return {
                    success: false,
                    message: 'Assessment not found'
                };
            }

            return {
                success: true,
                message: 'Assessment deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting assessment:', error);
            return {
                success: false,
                message: 'Failed to delete assessment'
            };
        }
    }

    public static async getAssessmentStats(startDate?: Date, endDate?: Date): Promise<AssessmentResponse> {
        try {
            const stats = await StiAssessmentRepository.getStatistics(startDate, endDate);

            return {
                success: true,
                message: 'Assessment statistics retrieved successfully',
                data: stats
            };
        } catch (error) {
            console.error('Error getting assessment stats:', error);
            return {
                success: false,
                message: 'Failed to retrieve assessment statistics'
            };
        }
    }

    public static async getAllPackageInfo(): Promise<AssessmentResponse> {
        try {
            const packages = StiPackageHelper.getAllPackages();

            return {
                success: true,
                message: 'Package information retrieved successfully',
                data: packages
            };
        } catch (error) {
            console.error('Error getting package info:', error);
            return {
                success: false,
                message: 'Failed to retrieve package information'
            };
        }
    }
    public static async createAssessmentWithPackageInfo(customerId: string, assessmentData: IStiAssessment['assessment_data']): Promise<AssessmentResponse> {
        try {
            // Generate recommendation
            const recommendation = this.generateRecommendation(assessmentData);

            // Get package information
            const packageInfo = StiPackageHelper.getPackageInfo(recommendation.recommended_package);

            // Create assessment record
            const assessment = await StiAssessmentRepository.createAssessment({
                customer_id: new mongoose.Types.ObjectId(customerId),
                assessment_data: assessmentData,
                recommendation
            } as any);

            return {
                success: true,
                message: 'STI assessment completed successfully',
                data: {
                    assessment_id: assessment._id,
                    recommendation: {
                        ...recommendation,
                        package_info: packageInfo
                    }
                }
            };
        } catch (error) {
            console.error('Error creating STI assessment:', error);
            return {
                success: false,
                message: 'Failed to create STI assessment'
            };
        }
    }
}