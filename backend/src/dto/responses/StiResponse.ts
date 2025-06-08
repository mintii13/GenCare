import { ObjectId } from "mongoose";
import { IStiTest } from "../../models/StiTest";

export interface StiTestResponse{
    success: boolean;
    message: string;
    createdBy?: string,
    stitest?: Partial<IStiTest>
};