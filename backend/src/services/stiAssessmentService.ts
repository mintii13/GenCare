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
    cdc_tests: string[];
    frequency: string;
    anatomical_sites: string[];
}

interface CDCTestRecommendation {
    required_tests: string[];
    optional_tests: string[];
    frequency: string;
    anatomical_sites: string[];
    reasoning: string[];
    priority: 'immediate' | 'routine' | 'optional';
}

export class StiAssessmentService {
    // Main CDC-based assessment logic
    public static generateRecommendation(assessmentData: IStiAssessment['assessment_data']): RecommendationResult {
        // Get CDC test recommendations first
        const cdcRec = this.getCDCTestRecommendations(assessmentData);

        // Map CDC recommendations to business packages
        const packageResult = this.mapCDCToPackage(cdcRec, assessmentData);

        return {
            recommended_package: packageResult.package,
            risk_level: packageResult.riskLevel,
            reasoning: [...cdcRec.reasoning, ...packageResult.businessReasoning],
            cdc_tests: [...cdcRec.required_tests, ...cdcRec.optional_tests],
            frequency: cdcRec.frequency,
            anatomical_sites: cdcRec.anatomical_sites
        };
    }

    // CDC Test Recommendations based on 2021 Guidelines
    private static getCDCTestRecommendations(data: IStiAssessment['assessment_data']): CDCTestRecommendation {
        const required_tests: string[] = [];
        const optional_tests: string[] = [];
        const anatomical_sites: string[] = ['urogenital'];
        const reasoning: string[] = [];
        let frequency = 'routine';
        let priority: 'immediate' | 'routine' | 'optional' = 'routine';

        // TIER 1: SYMPTOMS - Immediate comprehensive testing
        if (data.has_symptoms && data.symptoms.length > 0) {
            required_tests.push('HIV', 'Syphilis', 'Gonorrhea', 'Chlamydia');
            optional_tests.push('Herpes', 'Trichomonas', 'Hepatitis_B', 'Hepatitis_C');
            frequency = 'immediate';
            priority = 'immediate';
            reasoning.push('CDC: Cá nhân có triệu chứng cần xét nghiệm STI toàn diện ngay lập tức');

            // Consider extragenital sites based on sexual practices
            if (data.sexual_orientation === 'msm' || data.number_of_partners === 'multiple') {
                anatomical_sites.push('rectal', 'pharyngeal');
                reasoning.push('CDC: Cân nhắc xét nghiệm ngoài bộ phận sinh dục dựa trên hành vi tình dục');
            }

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // TIER 2: HIV POSITIVE - Annual comprehensive screening
        if (data.hiv_status === 'positive') {
            required_tests.push('Syphilis', 'Gonorrhea', 'Chlamydia', 'Hepatitis_B', 'Hepatitis_C');
            optional_tests.push('Herpes', 'Trichomonas');
            frequency = 'annual_minimum';
            priority = 'routine';
            reasoning.push('CDC: Người nhiễm HIV cần sàng lọc STI ít nhất hàng năm');
            reasoning.push('CDC: Có thể cần sàng lọc thường xuyên hơn tùy theo hành vi nguy cơ');

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // TIER 3: HIGH RISK FACTORS
        const extremeRiskFactors = ['injection_drug', 'sex_work', 'incarceration'];
        const hasExtremeRisk = data.risk_factors?.some(f => extremeRiskFactors.includes(f));

        if (hasExtremeRisk) {
            required_tests.push('HIV', 'Syphilis', 'Gonorrhea', 'Chlamydia', 'Hepatitis_B', 'Hepatitis_C');
            optional_tests.push('Herpes', 'Trichomonas');
            frequency = 'frequent_screening';
            priority = 'routine';

            const riskNames = this.getRiskFactorNames(data.risk_factors?.filter(f => extremeRiskFactors.includes(f)) || []);
            reasoning.push(`CDC: Yếu tố nguy cơ cao (${riskNames.join(', ')}) cần sàng lọc toàn diện thường xuyên`);

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // PrEP USERS - Specific CDC requirements
        if (data.risk_factors?.includes('prep_user')) {
            required_tests.push('HIV', 'Syphilis', 'Gonorrhea', 'Chlamydia');
            optional_tests.push('Hepatitis_B', 'Hepatitis_C');
            frequency = 'every_3_6_months';
            priority = 'routine';
            reasoning.push('CDC: Người dùng PrEP cần sàng lọc STI mỗi 3-6 tháng');

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // TIER 4: GENDER-BASED SCREENING
        const genderBasedRec = this.getGenderBasedCDCRecommendations(data);
        return {
            required_tests: genderBasedRec.required_tests,
            optional_tests: genderBasedRec.optional_tests,
            frequency: genderBasedRec.frequency,
            anatomical_sites: genderBasedRec.anatomical_sites,
            reasoning: genderBasedRec.reasoning,
            priority: genderBasedRec.priority
        };
    }

    // Gender-specific CDC recommendations with consolidated transgender logic
    private static getGenderBasedCDCRecommendations(data: IStiAssessment['assessment_data']): CDCTestRecommendation {
        // Determine effective gender for screening purposes
        let effectiveGender = data.gender;

        // Transgender logic: route to female/male based on cervix
        if (data.gender === 'transgender') {
            const hasCervix = data.risk_factors?.includes('has_cervix');
            effectiveGender = hasCervix ? 'female' : 'male';
        }

        if (effectiveGender === 'female') {
            return this.getFemaleCDCRecommendations(data);
        } else if (effectiveGender === 'male') {
            return this.getMaleCDCRecommendations(data);
        }

        // Fallback
        return {
            required_tests: [],
            optional_tests: [],
            frequency: 'routine',
            anatomical_sites: ['urogenital'],
            reasoning: ['CDC: Cần đánh giá cá nhân dựa trên giới tính và yếu tố nguy cơ'],
            priority: 'optional'
        };
    }

    // Female-specific CDC recommendations (includes transgender with cervix)
    private static getFemaleCDCRecommendations(data: IStiAssessment['assessment_data']): CDCTestRecommendation {
        const required_tests: string[] = [];
        const optional_tests: string[] = [];
        const anatomical_sites: string[] = ['urogenital'];
        const reasoning: string[] = [];
        let frequency = 'routine';
        let priority: 'immediate' | 'routine' | 'optional' = 'optional';

        // Add transgender note if applicable
        if (data.gender === 'transgender') {
            reasoning.push('CDC: Người chuyển giới có cổ tử cung tuân theo hướng dẫn sàng lọc như phụ nữ');
        }

        // FIXED: Check is_pregnant properly (boolean, not string)
        if (data.is_pregnant === true) {
            required_tests.push('HIV', 'Syphilis', 'Hepatitis_B');

            if (data.age < 25 || this.hasIncreasedRisk(data)) {
                required_tests.push('Gonorrhea', 'Chlamydia');
                reasoning.push('CDC: Phụ nữ mang thai dưới 25 tuổi hoặc có yếu tố nguy cơ cao cần sàng lọc Chlamydia và Gonorrhea');
            }

            frequency = 'prenatal_plus_retest';
            priority = 'routine';
            reasoning.push('CDC: Tất cả phụ nữ mang thai cần sàng lọc HIV, Giang mai và Viêm gan B');
            reasoning.push('CDC: Tái kiểm tra trong tam cá nguyệt 3 nếu dưới 25 tuổi hoặc có yếu tố nguy cơ');

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // CDC: All sexually active women under 25
        if (data.age < 25 && (data.sexually_active === 'active_single' || data.sexually_active === 'active_multiple')) {
            required_tests.push('Gonorrhea', 'Chlamydia');
            optional_tests.push('HIV', 'Syphilis');

            if (data.age >= 21) {
                optional_tests.push('HPV');
                reasoning.push('CDC: Khuyến cáo sàng lọc HPV cho phụ nữ 21-65 tuổi');
            }

            frequency = 'annual';
            priority = 'routine';
            reasoning.push('CDC: Tất cả phụ nữ có hoạt động tình dục dưới 25 tuổi cần sàng lọc Chlamydia và Gonorrhea');

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // CDC: Women 25+ only if at increased risk
        if (data.age >= 25 && data.age <= 65) {
            if (this.hasIncreasedRisk(data) || this.isHighPrevalenceSetting(data.living_area)) {
                required_tests.push('Gonorrhea', 'Chlamydia');
                optional_tests.push('HIV', 'Syphilis');
                priority = 'routine';
                reasoning.push('CDC: Phụ nữ từ 25 tuổi trở lên có yếu tố nguy cơ cao cần sàng lọc Chlamydia và Gonorrhea');
            }

            // HPV screening regardless of risk
            optional_tests.push('HPV');
            reasoning.push('CDC: Khuyến cáo sàng lọc HPV cho phụ nữ 21-65 tuổi');

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // Women over 65
        if (data.age > 65) {
            if (this.hasIncreasedRisk(data) && data.sexually_active !== 'not_active') {
                optional_tests.push('Gonorrhea', 'Chlamydia', 'HIV', 'Syphilis');
                reasoning.push('CDC: Phụ nữ trên 65 tuổi có yếu tố nguy cơ bắt buộc cần tư vấn với bác sĩ để chọn gói xét nghiệm');
                priority = 'optional';
            } else {
                reasoning.push('CDC: Thường không khuyến cáo sàng lọc STI định kỳ cho phụ nữ trên 65 tuổi không có yếu tố nguy cơ');
            }
        }

        return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
    }

    // Male-specific CDC recommendations (includes MSM and transgender without cervix)
    private static getMaleCDCRecommendations(data: IStiAssessment['assessment_data']): CDCTestRecommendation {
        const required_tests: string[] = [];
        const optional_tests: string[] = [];
        const anatomical_sites: string[] = ['urogenital'];
        const reasoning: string[] = [];
        let frequency = 'routine';
        let priority: 'immediate' | 'routine' | 'optional' = 'optional';

        // Add transgender note if applicable
        if (data.gender === 'transgender') {
            reasoning.push('CDC: Sàng lọc cho người chuyển giới được điều chỉnh dựa trên giải phẫu và hành vi tình dục');
        }

        // MSM - High priority comprehensive screening
        if (data.sexual_orientation === 'msm') {
            required_tests.push('HIV', 'Syphilis', 'Gonorrhea', 'Chlamydia');
            optional_tests.push('Hepatitis_B', 'Hepatitis_C', 'Herpes');
            anatomical_sites.push('rectal', 'pharyngeal');

            // Determine frequency based on risk factors
            const hasHighRisk = this.hasMSMHighRiskFactors(data);
            frequency = hasHighRisk ? 'every_3_6_months' : 'annual';
            priority = 'routine';

            reasoning.push('CDC: Nam quan hệ tình dục với nam cần sàng lọc ít nhất hàng năm tại các vị trí tiếp xúc');
            if (hasHighRisk) {
                reasoning.push('CDC: MSM có yếu tố nguy cơ cao cần sàng lọc mỗi 3-6 tháng');
            }

            return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
        }

        // Heterosexual males - CDC guidance with minimum HIV screening
        const hasRisk = this.hasIncreasedRisk(data) || this.isHighPrevalenceSetting(data.living_area);

        if (hasRisk) {
            required_tests.push('Gonorrhea', 'Chlamydia');
            optional_tests.push('HIV', 'Syphilis');
            priority = 'routine';

            if (this.isHighPrevalenceSetting(data.living_area)) {
                reasoning.push('CDC: Nam giới trong môi trường nguy cơ cao (phòng khám STI, cơ sở giam giữ, phòng khám thanh thiếu niên) cần được sàng lọc');
            } else {
                reasoning.push('CDC: Nam giới có yếu tố nguy cơ cao có thể được hưởng lợi từ việc sàng lọc');
            }
        } else {
            // FIXED: Always recommend at least HIV screening for low-risk males
            optional_tests.push('HIV'); // Minimum HIV screening
            reasoning.push('CDC: Không đủ bằng chứng cho việc sàng lọc định kỳ nam giới dị tính có nguy cơ thấp');
            reasoning.push('CDC: Khuyến cáo tối thiểu HIV screening và tư vấn phòng ngừa');
            reasoning.push('Cân nhắc sàng lọc dựa trên đánh giá nguy cơ cá nhân và quyết định lâm sàng');
            priority = 'optional';
        }

        return { required_tests, optional_tests, frequency, anatomical_sites, reasoning, priority };
    }

    // Map CDC recommendations to business packages
    private static mapCDCToPackage(cdcRec: CDCTestRecommendation, data: IStiAssessment['assessment_data']): {
        package: string;
        riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
        businessReasoning: string[];
    } {
        const businessReasoning: string[] = [];
        let package_name = 'STI-BASIC-01';
        let riskLevel: 'Thấp' | 'Trung bình' | 'Cao' = 'Thấp';

        const totalTests = cdcRec.required_tests.length + cdcRec.optional_tests.length;
        const hasHepatitis = [...cdcRec.required_tests, ...cdcRec.optional_tests].some(test =>
            test.includes('Hepatitis')
        );
        const hasAdvancedTests = [...cdcRec.required_tests, ...cdcRec.optional_tests].some(test =>
            ['Herpes', 'Trichomonas'].includes(test)
        );
        const isUrgent = cdcRec.priority === 'immediate';
        const isFrequent = ['every_3_6_months', 'frequent_screening'].includes(cdcRec.frequency);
        const hasExtragenital = cdcRec.anatomical_sites.length > 1;

        // FIXED: No more CONSULTATION_ONLY - always recommend a package
        // Special case for low-risk individuals - recommend STI-BASIC-01 with consultation note
        if (cdcRec.priority === 'optional' && cdcRec.required_tests.length === 0 &&
            cdcRec.optional_tests.length <= 1) {
            package_name = 'STI-BASIC-01';
            riskLevel = 'Thấp';
            businessReasoning.push('CDC: Chủ yếu cần tư vấn và HIV screening cho nhóm nguy cơ thấp');
            businessReasoning.push('Gói cơ bản được đề xuất để đảm bảo sàng lọc tối thiểu và tư vấn chuyên sâu');

            // Add consultation note
            businessReasoning.push('Lưu ý: Tập trung vào tư vấn phòng ngừa và giáo dục sức khỏe tình dục');
            return { package: package_name, riskLevel, businessReasoning };
        }

        // Package selection logic based on CDC complexity
        if (isUrgent || hasAdvancedTests || totalTests >= 6 || hasExtragenital) {
            package_name = 'STI-ADVANCE';
            riskLevel = 'Cao';
            businessReasoning.push('Gói nâng cao được đề xuất do: cần xét nghiệm toàn diện hoặc có triệu chứng');
        } else if (hasHepatitis || totalTests >= 4 || isFrequent || cdcRec.priority === 'routine') {
            package_name = 'STI-BASIC-02';
            riskLevel = 'Trung bình';
            businessReasoning.push('Gói cơ bản mở rộng được đề xuất do: có yếu tố nguy cơ hoặc cần xét nghiệm bổ sung');
        } else {
            package_name = 'STI-BASIC-01';
            riskLevel = 'Thấp';
            businessReasoning.push('Gói cơ bản đáp ứng đủ các xét nghiệm CDC khuyến cáo');
        }

        // Add frequency guidance
        if (cdcRec.frequency !== 'routine') {
            const frequencyText = this.getFrequencyText(cdcRec.frequency);
            businessReasoning.push(`Tần suất khuyến cáo: ${frequencyText}`);
        }

        // Add test summary
        if (cdcRec.required_tests.length > 0) {
            businessReasoning.push(`Xét nghiệm CDC bắt buộc: ${cdcRec.required_tests.join(', ')}`);
        }
        if (cdcRec.optional_tests.length > 0) {
            businessReasoning.push(`Xét nghiệm CDC khuyến cáo thêm: ${cdcRec.optional_tests.join(', ')}`);
        }

        return { package: package_name, riskLevel, businessReasoning };
    }

    // Helper methods
    private static hasIncreasedRisk(data: IStiAssessment['assessment_data']): boolean {
        return (
            data.number_of_partners === 'multiple' ||
            data.new_partner_recently ||
            data.partner_has_sti ||
            data.condom_use === 'never' || data.condom_use === 'rarely' ||
            (data.previous_sti_history && data.previous_sti_history.length > 0) ||
            (data.risk_factors && data.risk_factors.some(factor =>
                ['blood_transfusion', 'immunocompromised', 'geographic_risk'].includes(factor)
            ))
        );
    }

    private static hasMSMHighRiskFactors(data: IStiAssessment['assessment_data']): boolean {
        return (
            data.risk_factors?.includes('prep_user') ||
            data.hiv_status === 'positive' ||
            data.number_of_partners === 'multiple' ||
            data.new_partner_recently ||
            data.partner_has_sti ||
            (data.previous_sti_history && data.previous_sti_history.length > 0)
        );
    }

    private static isHighPrevalenceSetting(living_area: string): boolean {
        return [
            'sti_clinic',
            'correctional_facility',
            'adolescent_clinic',
            'drug_treatment_center',
            'emergency_department',
            'family_planning_clinic',
            'high_prevalence_area'
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

    private static getFrequencyText(frequency: string): string {
        const frequencyMap: Record<string, string> = {
            'immediate': 'Ngay lập tức',
            'every_3_6_months': 'Mỗi 3-6 tháng',
            'annual': 'Hàng năm',
            'annual_minimum': 'Tối thiểu hàng năm',
            'frequent_screening': 'Sàng lọc thường xuyên',
            'prenatal_plus_retest': 'Sàng lọc thai kỳ + tái kiểm tra'
        };
        return frequencyMap[frequency] || frequency;
    }

    // Existing CRUD methods remain the same
    public static async createAssessment(customerId: string, assessmentData: IStiAssessment['assessment_data']): Promise<AssessmentResponse> {
        try {
            console.log('Creating STI assessment for customer:', customerId);
            console.log('Assessment data received:', JSON.stringify(assessmentData, null, 2));

            // FIXED: Enhanced validation
            if (!assessmentData.age || !assessmentData.gender || !assessmentData.sexually_active || !assessmentData.hiv_status) {
                console.error('Missing required fields:', {
                    age: assessmentData.age,
                    gender: assessmentData.gender,
                    sexually_active: assessmentData.sexually_active,
                    hiv_status: assessmentData.hiv_status,
                });
                return {
                    success: false,
                    message: 'Missing required fields in assessment data'
                };
            }

            // FIXED: Validate condom_use options
            const validCondomUse = ['always', 'sometimes', 'rarely', 'never'];
            if (assessmentData.condom_use && !validCondomUse.includes(assessmentData.condom_use)) {
                return {
                    success: false,
                    message: `"condom_use" must be one of [${validCondomUse.join(', ')}]`
                };
            }

            // FIXED: Validate pregnancy_trimester only if pregnant
            // chống chế
            if (assessmentData.is_pregnant === false) {
                assessmentData.pregnancy_trimester = 'first';
            }
            if (assessmentData.is_pregnant === true) {
                if (assessmentData.pregnancy_trimester) {
                    const validTrimesters = ['first', 'second', 'third'];
                    if (!validTrimesters.includes(assessmentData.pregnancy_trimester)) {
                        return {
                            success: false,
                            message: `"pregnancy_trimester" must be one of [${validTrimesters.join(', ')}]`
                        };
                    }
                }
            }


            // Generate recommendation
            console.log('Generating CDC-based recommendation...');
            const recommendation = this.generateRecommendation(assessmentData);
            console.log('Generated recommendation:', recommendation);

            // Prepare data for database
            const dbData = {
                customer_id: new mongoose.Types.ObjectId(customerId),
                assessment_data: assessmentData,
                recommendation: {
                    recommended_package: recommendation.recommended_package,
                    risk_level: recommendation.risk_level,
                    reasoning: recommendation.reasoning
                }
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
                recommendation: {
                    recommended_package: newRecommendation.recommended_package,
                    risk_level: newRecommendation.risk_level,
                    reasoning: newRecommendation.reasoning
                }
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
                message: 'Thống kê đánh giá STI được lấy thành công',
                data: stats
            };
        } catch (error) {
            console.error('Error getting assessment stats:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê đánh giá STI'
            };
        }
    }

    public static async getPackageInfo(): Promise<AssessmentResponse> {
        try {
            // Import StiService để lấy thông tin gói xét nghiệm
            const { StiService } = require('./stiService');

            // Lấy tất cả gói xét nghiệm STI
            const packagesResult = await StiService.getAllStiPackage();
            const testsResult = await StiService.getAllStiTest();

            if (!packagesResult.success || !testsResult.success) {
                return {
                    success: false,
                    message: 'Không thể lấy thông tin gói xét nghiệm'
                };
            }

            const packages = packagesResult.stipackage || packagesResult.packages || [];
            const tests = testsResult.stitest || testsResult.tests || [];

            // Lọc chỉ những gói và test đang hoạt động
            const activePackages = packages.filter((pkg: any) => pkg.is_active !== false);
            const activeTests = tests.filter((test: any) => test.is_active !== false);

            return {
                success: true,
                message: 'Thông tin gói xét nghiệm được lấy thành công',
                data: {
                    packages: activePackages,
                    tests: activeTests,
                    stats: {
                        total_packages: activePackages.length,
                        total_tests: activeTests.length
                    }
                }
            };
        } catch (error) {
            console.error('Error getting package info:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thông tin gói xét nghiệm'
            };
        }
    }
}