import { IPillTracking } from "../../models/PillTracking";

export interface PillScheduleResponse {
    success: boolean;
    message: string;
    data?: IPillTracking[] | IPillTracking;
}