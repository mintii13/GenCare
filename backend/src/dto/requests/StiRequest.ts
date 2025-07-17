import { ObjectId } from "mongoose";
import { PaginationQuery } from './PaginationRequest';
import { TestTypes } from "../../models/StiTest";

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
export interface StiOrderQuery extends PaginationQuery {
    customer_id?: string;
    order_status?: 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';
    payment_status?: 'Pending' | 'Paid' | 'Failed';
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    consultant_id?: string;
    staff_id?: string;
    sti_package_id?: string;
}

export interface UpdateStiResultRequest {
    sample?: {
        sampleQualities: Partial<Record<TestTypes, boolean | null>>;
        timeReceived?: Date;
        timeTesting?: Date;
    };
    time_result?: Date;
    result_value?: string;
    diagnosis?: string;
    is_confirmed?: boolean;
    is_critical?: boolean;
    is_notified?: boolean;
    notes?: string;
    is_active?: boolean;
    consultant_id?: string;
    staff_id?: string;
}