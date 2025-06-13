import { ObjectId } from "mongoose";

export interface StiTestRequest {
    sti_test_name?: string;
    sti_test_code?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
    category?: 'bacterial' | 'viral' | 'parasitic';
    sti_test_type?: 'blood' | 'urine' | 'swab';
    createdBy: ObjectId;
}
