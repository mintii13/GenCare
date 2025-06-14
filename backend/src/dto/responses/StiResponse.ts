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