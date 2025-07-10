import { StiAssessmentRepository } from '../repositories/stiAssessmentRepository';
import { IStiAssessment } from '../models/StiAssessment';
import mongoose from 'mongoose';

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

        // TIER 4: Yếu tố nguy cơ cực cao + PrEP users
        const extremeRiskFactors = ['injection_drug', 'sex_work', 'incarceration'];
        const hasExtremeRisk = assessmentData.risk_factors && assessmentData.risk_factors.some(factor => extremeRiskFactors.includes(factor));

        // PrEP users cần sàng lọc thường xuyên hơn
        const isPrEPUser = assessmentData.risk_factors && assessmentData.risk_factors.includes('prep_user');

        if (hasExtremeRisk || isPrEPUser) {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            if (isPrEPUser) {
                reasoning.push('Người dùng PrEP cần sàng lọc STI mỗi 3-6 tháng theo CDC');
            } else {
                reasoning.push('Có yếu tố nguy cơ cực cao (ma túy tiêm/mại dâm/giam giữ)');
            }
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

        // CDC: Tất cả phụ nữ có hoạt động tình dục dưới 25 tuổi
        if (data.age < 25) {
            if (data.sexually_active === 'active_single' || data.sexually_active === 'active_multiple') {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('CDC khuyến cáo sàng lọc Chlamydia/Gonorrhea cho tất cả phụ nữ có hoạt động tình dục dưới 25 tuổi');
                additionalTests.push('HPV/Pap smear (nếu >= 21 tuổi)');
            } else {
                reasoning.push('Phụ nữ dưới 25 tuổi không hoạt động tình dục');
            }
        } else if (data.age >= 25 && data.age <= 65) {
            // Phụ nữ >= 25 tuổi: chỉ sàng lọc nếu có nguy cơ
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Phụ nữ 25 tuổi trở lên có yếu tố nguy cơ cần sàng lọc');
            } else {
                reasoning.push('Phụ nữ 25-65 tuổi sàng lọc định kỳ theo chỉ định y tế');
            }
            additionalTests.push('HPV/Pap smear (21-65 tuổi)');
        } else if (data.age > 65) {
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

        // CDC: Nam dị tính nguy cơ thấp → KHÔNG khuyến cáo sàng lọc thường xuyên
        const isHeterosexualLowRisk = data.sexual_orientation === 'heterosexual' && !hasGeneralRisk;

        if (data.age <= 25) {
            // CDC: Sàng lọc nam trẻ CHỈ trong môi trường nguy cơ cao
            const highRiskSettings = data.living_area === 'sti_clinic' ||
                data.living_area === 'correctional_facility' ||
                data.living_area === 'adolescent_clinic';

            if (highRiskSettings || hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Nam trẻ trong môi trường nguy cơ cao (phòng khám STI/trại giam/phòng khám thanh thiếu niên)');
            } else if (isHeterosexualLowRisk) {
                reasoning.push('CDC không khuyến cáo sàng lọc thường xuyên cho nam dị tính nguy cơ thấp');
                reasoning.push('Có thể tư vấn với bác sĩ nếu có triệu chứng hoặc quan ngại');
            } else {
                reasoning.push('Nam trẻ có thể cân nhắc sàng lọc dựa trên đánh giá cá nhân');
            }
        } else if (data.age >= 26 && data.age <= 64) {
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Nam giới có yếu tố nguy cơ cần sàng lọc');
            } else if (isHeterosexualLowRisk) {
                reasoning.push('CDC không khuyến cáo sàng lọc thường xuyên cho nam dị tính nguy cơ thấp');
                reasoning.push('Có thể tư vấn với bác sĩ nếu có triệu chứng hoặc quan ngại');
            } else {
                reasoning.push('Nam giới có thể cân nhắc sàng lọc dựa trên tư vấn y tế');
            }
        } else if (data.age > 64) {
            if (hasGeneralRisk || data.sexually_active !== 'not_active') {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Nam cao tuổi có hoạt động tình dục hoặc yếu tố nguy cơ');
            } else {
                reasoning.push('Nguy cơ rất thấp cho nhóm tuổi này, không cần sàng lọc thường xuyên');
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

        // CDC: Screening dựa trên anatomy
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
                    reasoning.push('Người chuyển giới có cervix có yếu tố nguy cơ');
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
            // Áp dụng quy tắc tương tự nam giới (nhưng không phân biệt orientation)
            if (hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push('Người chuyển giới có yếu tố nguy cơ cần sàng lọc');
            } else {
                reasoning.push('Người chuyển giới sàng lọc dựa trên đánh giá cá nhân và tư vấn y tế');
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
                ['blood_transfusion', 'immunocompromised'].includes(factor)
            )
        );
    }

    // API Methods
    public static async createAssessment(customerId: string, assessmentData: IStiAssessment['assessment_data']): Promise<AssessmentResponse> {
        try {
            console.log('Creating STI assessment for customer:', customerId);
            console.log('Assessment data received:', JSON.stringify(assessmentData, null, 2));

            // Validate required fields
            if (!assessmentData.age || !assessmentData.gender || !assessmentData.sexually_active || !assessmentData.hiv_status || !assessmentData.test_purpose) {
                console.error('Missing required fields:', {
                    age: assessmentData.age,
                    gender: assessmentData.gender,
                    sexually_active: assessmentData.sexually_active,
                    hiv_status: assessmentData.hiv_status,
                    test_purpose: assessmentData.test_purpose
                });
                return {
                    success: false,
                    message: 'Missing required fields in assessment data'
                };
            }

            // Generate recommendation
            console.log('Generating recommendation...');
            const recommendation = this.generateRecommendation(assessmentData);
            console.log('Generated recommendation:', recommendation);

            // Prepare data for database
            const dbData = {
                customer_id: new mongoose.Types.ObjectId(customerId),
                assessment_data: assessmentData,
                recommendation
            };
            console.log('Prepared DB data:', JSON.stringify(dbData, null, 2));

            // Create assessment record
            console.log('Creating assessment in database...');
            const assessment = await StiAssessmentRepository.createAssessment(dbData as any);
            console.log('Assessment created successfully:', assessment._id);

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
            console.error('Error stack:', (error as Error).stack);
            console.error('Error details:', {
                name: (error as Error).name,
                message: (error as Error).message,
                customerId,
                assessmentData
            });
            return {
                success: false,
                message: 'Lỗi khi tạo đánh giá STI: ' + (error as Error).message
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
}