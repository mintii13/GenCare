import { ObjectId } from "mongoose";
import { IStiTest } from "../../models/StiTest";

export interface StiTestResponse{
    success: boolean;
    message: string;
    createdBy?: string,
    stitest?: Partial<IStiTest>
};

export interface AllStiTestResponse{
    success: boolean;
    message: string;
    stitest?: Partial<IStiTest[]>
};