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
    created_by: ObjectId;
}
export interface StiOrderQuery extends PaginationQuery {
    customer_id?: string;
    order_status?: 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';
    is_paid?: boolean;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    consultant_id?: string;
    staff_id?: string;
    sti_package_id?: string;
}

export interface SendResultRequest{
    customerName: string,
    birthYear: number,
    gender: string,
    diagnosis: string,
    resultValue: string,
    notes: string,
    consultantName: string,
    staffName: string,
    sample: {
        timeReceived?: Date,
        timeTesting?: Date,
        sampleQualities?: Record<string, boolean | null>
    },
    testNames: string[],
    resultDate?: Date,
    emailSendTo?: string
}