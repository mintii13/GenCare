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
            reasoning.push(`Có triệu chứng nghi ngờ STI: ${assessmentData.symptoms.join(', ')} - cần xét nghiệm toàn diện ngay lập tức`);
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 2: Tình trạng HIV
        if (assessmentData.hiv_status === 'positive') {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Người nhiễm HIV có nguy cơ cao mắc các STI khác và cần sàng lọc toàn diện theo khuyến cáo CDC');
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 3: MSM - nhóm nguy cơ đặc biệt cao
        if (assessmentData.sexual_orientation === 'msm') {
            recommendedPackage = 'STI-ADVANCE';
            riskLevel = 'Cao';
            reasoning.push('Nam quan hệ tình dục với nam (MSM) thuộc nhóm nguy cơ cao theo CDC, cần sàng lọc toàn diện ít nhất hàng năm');
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
                reasoning.push('Người dùng PrEP cần sàng lọc STI định kỳ mỗi 3-6 tháng theo CDC');
            }
            if (hasExtremeRisk) {
                const riskFactorNames = this.getRiskFactorNames(assessmentData.risk_factors?.filter(f => extremeRiskFactors.includes(f)) || []);
                reasoning.push(`Có yếu tố nguy cơ cực cao: ${riskFactorNames.join(', ')}`);
            }
            return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
        }

        // TIER 5: Phân loại theo giới tính, tuổi và nguy cơ
        const result = this.assessByGenderAndAge(assessmentData);
        recommendedPackage = result.package;
        riskLevel = result.riskLevel;
        reasoning.push(...result.reasoning);

        // Thêm thông tin về các yếu tố nguy cơ đã được xem xét
        const riskFactorsSummary = this.generateRiskFactorsSummary(assessmentData);
        if (riskFactorsSummary) {
            reasoning.push(riskFactorsSummary);
        }

        return { recommended_package: recommendedPackage, risk_level: riskLevel, reasoning };
    }

    // ✅ FIXED: Standardized High Risk Settings Method
    private static isHighPrevalenceSetting(living_area: string): boolean {
        return [
            'sti_clinic',
            'correctional_facility',
            'adolescent_clinic',
            'high_prevalence_area',
            'drug_treatment_center',
            'emergency_department',
            'family_planning_clinic'
        ].includes(living_area);
    }

    private static getRiskFactorNames(factors: string[]): string[] {
        const factorMap: Record<string, string> = {
            'injection_drug': 'Sử dụng ma túy tiêm',
            'sex_work': 'Làm nghề mại dâm',
            'incarceration': 'Tiền sử bị giam giữ',
            'prep_user': 'Đang sử dụng PrEP',
            'blood_transfusion': 'Tiền sử truyền máu/ghép tạng',
            'immunocompromised': 'Suy giảm miễn dịch',
            'geographic_risk': 'Nguy cơ địa lý'
        };
        return factors.map(f => factorMap[f] || f);
    }

    private static generateRiskFactorsSummary(data: IStiAssessment['assessment_data']): string {
        const riskFactors: string[] = [];

        // Yếu tố hành vi tình dục
        if (data.number_of_partners === 'multiple') {
            riskFactors.push('có nhiều bạn tình');
        }
        if (data.new_partner_recently) {
            riskFactors.push('mới có bạn tình gần đây');
        }
        if (data.partner_has_sti) {
            riskFactors.push('bạn tình có STI');
        }
        if (data.condom_use === 'never' || data.condom_use === 'rarely') {
            riskFactors.push(`sử dụng bao cao su ${data.condom_use === 'never' ? 'không bao giờ' : 'hiếm khi'}`);
        }

        // Tiền sử STI
        if (data.previous_sti_history && data.previous_sti_history.length > 0) {
            const stiNames = this.getSTINames(data.previous_sti_history);
            riskFactors.push(`có tiền sử STI: ${stiNames.join(', ')}`);
        }

        // Các yếu tố nguy cơ khác
        if (data.risk_factors && data.risk_factors.length > 0) {
            const otherRisks = data.risk_factors.filter(f =>
                !['injection_drug', 'sex_work', 'incarceration', 'prep_user'].includes(f)
            );
            if (otherRisks.length > 0) {
                const riskNames = this.getRiskFactorNames(otherRisks);
                riskFactors.push(`các yếu tố khác: ${riskNames.join(', ')}`);
            }
        }

        if (riskFactors.length === 0) {
            return 'Không có yếu tố nguy cơ đặc biệt được xác định';
        }

        return `Các yếu tố nguy cơ được xem xét: ${riskFactors.join('; ')}`;
    }

    private static getSTINames(stiCodes: string[]): string[] {
        const stiMap: Record<string, string> = {
            'chlamydia': 'Chlamydia',
            'gonorrhea': 'Lậu',
            'syphilis': 'Giang mai',
            'herpes': 'Herpes',
            'hpv': 'HPV',
            'hepatitis_b': 'Viêm gan B',
            'hepatitis_c': 'Viêm gan C',
            'trichomonas': 'Trichomonas'
        };
        return stiCodes.map(code => stiMap[code] || code);
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
            additionalTests.push(...result.additionalTests);
        } else if (data.gender === 'transgender') {
            const result = this.assessTransgender(data, hasGeneralRisk);
            package_name = result.package;
            riskLevel = result.riskLevel;
            reasoning.push(...result.reasoning);
            additionalTests.push(...result.additionalTests);
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    // ✅ FIXED: Female Assessment - No Logic Conflicts
    private static assessFemale(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const highRiskSettings = this.isHighPrevalenceSetting(data.living_area);
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // Phụ nữ mang thai
        if (data.is_pregnant) {
            if (data.age < 25 || hasGeneralRisk || highRiskSettings) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                const reasonText = data.age < 25 ? 'dưới 25 tuổi' :
                    highRiskSettings ? 'ở môi trường nguy cơ cao' : 'có yếu tố nguy cơ';
                reasoning.push(`Phụ nữ mang thai ${data.age} tuổi ${reasonText} cần sàng lọc mở rộng để bảo vệ sức khỏe mẹ và thai nhi`);
            } else {
                reasoning.push(`Phụ nữ mang thai ${data.age} tuổi không có yếu tố nguy cơ đặc biệt - sàng lọc cơ bản đủ điều kiện`);
            }
            additionalTests.push('Tái kiểm tra tam cá nguyệt 3 để theo dõi');
            return { package: package_name, riskLevel, reasoning, additionalTests };
        }

        // CDC: Tất cả phụ nữ có hoạt động tình dục dưới 25 tuổi
        if (data.age < 25) {
            if (data.sexually_active === 'active_single' || data.sexually_active === 'active_multiple') {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                reasoning.push(`Phụ nữ ${data.age} tuổi có hoạt động tình dục - CDC khuyến cáo sàng lọc Chlamydia/Gonorrhea`);
                additionalTests.push('HPV/Pap smear (nếu >= 21 tuổi)');
            } else {
                reasoning.push(`Phụ nữ ${data.age} tuổi không có hoạt động tình dục - nguy cơ STI thấp`);
            }
        } else if (data.age >= 25 && data.age <= 65) {
            // ✅ FIXED: Combined logic - no conflicts
            if (hasGeneralRisk || highRiskSettings) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                const reasonText = highRiskSettings ? 'ở môi trường nguy cơ cao' : 'có yếu tố nguy cơ';
                reasoning.push(`Phụ nữ ${data.age} tuổi ${reasonText} cần sàng lọc mở rộng theo khuyến cáo CDC`);
            } else {
                reasoning.push(`Phụ nữ ${data.age} tuổi không có yếu tố nguy cơ đặc biệt - sàng lọc định kỳ theo lịch khám bệnh thường quy`);
            }
            additionalTests.push('HPV/Pap smear (khuyến cáo 21-65 tuổi)');
        } else if (data.age > 65) {
            if (hasGeneralRisk || data.sexually_active !== 'not_active') {
                reasoning.push(`Phụ nữ ${data.age} tuổi ${data.sexually_active !== 'not_active' ? 'có hoạt động tình dục' : 'có yếu tố nguy cơ'} - cần tư vấn với bác sĩ`);
            } else {
                reasoning.push(`Phụ nữ ${data.age} tuổi không có hoạt động tình dục và yếu tố nguy cơ - CDC không khuyến cáo sàng lọc thường xuyên`);
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    // ✅ FIXED: Male Assessment - Complete CDC Compliance
    private static assessMale(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const highRiskSettings = this.isHighPrevalenceSetting(data.living_area);
        const reasoning: string[] = [];
        const additionalTests: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        // ✅ FIXED: Check heterosexual low risk for ALL age groups first
        const isHeterosexualLowRisk = data.sexual_orientation === 'heterosexual' &&
            !hasGeneralRisk &&
            !highRiskSettings;

        if (isHeterosexualLowRisk) {
            reasoning.push(`Nam giới ${data.age} tuổi dị tính không có yếu tố nguy cơ - CDC không khuyến cáo sàng lọc thường xuyên, tư vấn với bác sĩ nếu có triệu chứng`);
            return { package: 'STI-BASIC-01', riskLevel: 'Thấp', reasoning, additionalTests };
        }

        if (data.age <= 25) {
            // CDC: Sàng lọc nam trẻ CHỈ trong môi trường nguy cơ cao hoặc có general risk
            if (highRiskSettings || hasGeneralRisk) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                const environmentText = highRiskSettings ?
                    'trong môi trường nguy cơ cao (phòng khám STI/trại giam/phòng khám thanh thiếu niên)' :
                    'có yếu tố nguy cơ';
                reasoning.push(`Nam giới ${data.age} tuổi ${environmentText} cần sàng lọc mở rộng theo khuyến cáo CDC`);
            } else {
                reasoning.push(`Nam giới ${data.age} tuổi có thể cân nhắc sàng lọc dựa trên đánh giá cá nhân và tư vấn y tế`);
            }
        } else if (data.age >= 26 && data.age <= 65) {
            // ✅ FIXED: Include both hasGeneralRisk AND highRiskSettings
            if (hasGeneralRisk || highRiskSettings) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                const reasonText = highRiskSettings ? 'ở môi trường nguy cơ cao' : 'có yếu tố nguy cơ';
                reasoning.push(`Nam giới ${data.age} tuổi ${reasonText} cần sàng lọc theo khuyến cáo CDC`);
            } else {
                reasoning.push(`Nam giới ${data.age} tuổi có thể cân nhắc sàng lọc dựa trên tư vấn y tế và đánh giá cá nhân`);
            }
        } else if (data.age > 65) {
            // CDC KHÔNG khuyến cáo sàng lọc thường xuyên cho >65 tuổi
            const hasExtremeRisk = hasGeneralRisk && (
                data.number_of_partners === 'multiple' ||
                data.new_partner_recently ||
                data.partner_has_sti ||
                (data.previous_sti_history && data.previous_sti_history.length > 0)
            );

            if (hasExtremeRisk && data.sexually_active !== 'not_active') {
                reasoning.push(`Nam giới ${data.age} tuổi có hoạt động tình dục và yếu tố nguy cơ cao - CDC không có khuyến cáo chuẩn cho độ tuổi này, cần tư vấn với bác sĩ chuyên khoa để đánh giá cá nhân`);
                reasoning.push('Lưu ý: Việc sàng lọc STI ở độ tuổi này cần dựa trên quyết định lâm sàng và đánh giá lợi ích/rủi ro cá nhân');
                additionalTests.push('Cần tư vấn trực tiếp với bác sĩ');
            } else if (data.sexually_active !== 'not_active') {
                reasoning.push(`Nam giới ${data.age} tuổi có hoạt động tình dục - CDC không khuyến cáo sàng lọc thường xuyên cho độ tuổi này, tư vấn với bác sĩ nếu có triệu chứng hoặc quan ngại cụ thể`);
            } else {
                reasoning.push(`Nam giới ${data.age} tuổi không có hoạt động tình dục - CDC không khuyến cáo sàng lọc STI cho độ tuổi này, nguy cơ rất thấp`);
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    // ✅ FIXED: Transgender Assessment - Use Standardized High Risk Settings
    private static assessTransgender(data: IStiAssessment['assessment_data'], hasGeneralRisk: boolean): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
        additionalTests: string[];
    } {
        const highRiskSettings = this.isHighPrevalenceSetting(data.living_area);
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
                reasoning.push(`Người chuyển giới ${data.age} tuổi có cổ tử cung - áp dụng khuyến cáo sàng lọc như phụ nữ cùng độ tuổi`);
                additionalTests.push('HPV/Pap smear');
            } else if (data.age >= 25 && data.age <= 65) {
                if (hasGeneralRisk || highRiskSettings) {
                    package_name = 'STI-BASIC-02';
                    riskLevel = 'Trung bình';
                    const reasonText = highRiskSettings ? 'ở môi trường nguy cơ cao' : 'có yếu tố nguy cơ';
                    reasoning.push(`Người chuyển giới ${data.age} tuổi có cổ tử cung ${reasonText} cần sàng lọc mở rộng`);
                } else {
                    reasoning.push(`Người chuyển giới ${data.age} tuổi có cổ tử cung - sàng lọc định kỳ theo khuyến cáo cho phụ nữ`);
                }
                additionalTests.push('HPV/Pap smear');
            } else {
                if (data.sexually_active !== 'not_active') {
                    reasoning.push(`Người chuyển giới ${data.age} tuổi có hoạt động tình dục - tư vấn với bác sĩ chuyên khoa`);
                } else {
                    reasoning.push(`Người chuyển giới ${data.age} tuổi không có hoạt động tình dục - không cần sàng lọc thường xuyên`);
                }
            }
        } else {
            // Áp dụng quy tắc tương tự nam giới (nhưng không phân biệt orientation)
            if (hasGeneralRisk || highRiskSettings) {
                package_name = 'STI-BASIC-02';
                riskLevel = 'Trung bình';
                const reasonText = highRiskSettings ? 'ở môi trường nguy cơ cao' : 'có yếu tố nguy cơ';
                reasoning.push(`Người chuyển giới ${data.age} tuổi ${reasonText} cần sàng lọc mở rộng`);
            } else {
                reasoning.push(`Người chuyển giới ${data.age} tuổi - sàng lọc dựa trên đánh giá cá nhân và tư vấn y tế chuyên khoa`);
            }
        }

        return { package: package_name, riskLevel, reasoning, additionalTests };
    }

    // ✅ FIXED: Enhanced General Risk Factors
    private static hasGeneralRiskFactors(data: IStiAssessment['assessment_data']): boolean {
        return (
            data.number_of_partners === 'multiple' ||
            data.new_partner_recently ||
            data.partner_has_sti ||
            data.condom_use === 'never' || data.condom_use === 'rarely' ||
            data.previous_sti_history && data.previous_sti_history.length > 0 ||
            data.risk_factors && data.risk_factors.some(factor =>
                ['blood_transfusion', 'immunocompromised', 'geographic_risk'].includes(factor)
            )
        );
    }
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