import { ObjectId } from "mongoose";
import { IStiOrder } from "../../models/StiOrder";
import { IStiPackage } from "../../models/StiPackage";
import { IStiTest } from "../../models/StiTest";

export interface StiTestResponse{
    success: boolean;
    message: string;
    stitest?: Partial<IStiTest>
};

export interface AllStiTestResponse{
    success: boolean;
    message: string;
    stitest?: Partial<IStiTest[]>
};

export interface StiPackageResponse{
    success: boolean;
    message: string;
    stipackage?: Partial<IStiPackage>
};

export interface AllStiPackageResponse{
    success: boolean;
    message: string;
    stipackage?: Partial<IStiPackage[]>
};

export interface StiOrderResponse{
    success: boolean;
    message: string;
    stiorder?: Partial<IStiOrder>
};

export interface AllStiOrderResponse{
    success: boolean;
    message: string;
    stiorder?: Partial<IStiOrder[]>
};

export interface StiPackageTestResponse{
    success: boolean;
    message: string;
    sti_package_item?: {
        sti_package_id: ObjectId;
        sti_test_ids: ObjectId[];
    };

    sti_test_items?: {
        sti_test_id: ObjectId;
    }[];
    total_amount?: number;
};