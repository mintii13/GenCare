import { StiAssessment, IStiAssessment } from '../models/StiAssessment';

export class StiAssessmentRepository {
    public static async createAssessment(assessmentData: Partial<IStiAssessment>): Promise<IStiAssessment> {
        return await StiAssessment.create(assessmentData);
    }

    public static async findByCustomerId(customerId: string): Promise<IStiAssessment[]> {
        return await StiAssessment.find({ customer_id: customerId })
            .sort({ created_at: -1 });
    }

    public static async findById(assessmentId: string): Promise<IStiAssessment | null> {
        return await StiAssessment.findById(assessmentId);
    }

    public static async updateAssessment(assessmentId: string, updateData: Partial<IStiAssessment>): Promise<IStiAssessment | null> {
        return await StiAssessment.findByIdAndUpdate(assessmentId, updateData, { new: true });
    }

    public static async deleteAssessment(assessmentId: string): Promise<IStiAssessment | null> {
        return await StiAssessment.findByIdAndDelete(assessmentId);
    }
    public static async getStatistics(startDate?: Date, endDate?: Date) {
        const matchStage: any = {};

        if (startDate || endDate) {
            matchStage.created_at = {};
            if (startDate) matchStage.created_at.$gte = startDate;
            if (endDate) matchStage.created_at.$lte = endDate;
        }

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total_assessments: { $sum: 1 },
                    basic_1_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.recommended_package", "STI-BASIC-01"] },
                                1,
                                0
                            ]
                        }
                    },
                    basic_2_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.recommended_package", "STI-BASIC-02"] },
                                1,
                                0
                            ]
                        }
                    },
                    advance_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.recommended_package", "STI-ADVANCE"] },
                                1,
                                0
                            ]
                        }
                    },
                    high_risk_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.risk_level", "Cao"] },
                                1,
                                0
                            ]
                        }
                    },
                    medium_risk_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.risk_level", "Trung bình"] },
                                1,
                                0
                            ]
                        }
                    },
                    low_risk_count: {
                        $sum: {
                            $cond: [
                                { $eq: ["$recommendation.risk_level", "Thấp"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const result = await StiAssessment.aggregate(pipeline);
        return result[0] || {
            total_assessments: 0,
            basic_1_count: 0,
            basic_2_count: 0,
            advance_count: 0,
            high_risk_count: 0,
            medium_risk_count: 0,
            low_risk_count: 0
        };
    }
}