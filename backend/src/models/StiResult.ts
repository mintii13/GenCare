import mongoose, { Schema, Document } from 'mongoose';
import { TestTypes } from './StiTest';
import { Staff } from './Staff';

export type StiResultItem = {
    sample_type: TestTypes;                 // 'blood', 'urine', 'swab'
    sample_quality: boolean;                // true if sample is good, false if not
    urine?:{
        color: 'light yellow' | 'clear' | 'dark yellow to orange' | 'dark brown' | 'pink or red'  | 'blue or green' | 'black';            // color of urine sample, level: 1, 0, 2, 
        clarity: 'clearly' | 'cloudy';                                                                                                    // clarity of urine sample
        URO: number;                        // URO value in urine sample
        GLU: number;                        // GLU value in urine sample
        KET: number;                        // KET value in urine sample
        BIL: number;                        // BIL value in urine sample
        PRO: number;                        // PRO value in urine sample
        NIT: number;                        // NIT value in urine sample
        pH: number;                         // pH value in urine sample
        blood: boolean;                     // true if blood is present in urine sample
        specific_gravity: number;           // specific gravity value in urine sample
        LEU: number;                        // LEU value in urine sample
    };
    blood?:{
        platelets: number;                  // platelets count in blood sample
        red_blood_cells: number;         // red blood cells count in blood sample
        white_blood_cells: number;       // white blood cells count in blood sample
        hemo_level: number;                // hemoglobin level in blood sample
        hiv?: boolean | null;                // true if HIV is present in blood sample, null if not tested
        HBsAg?: boolean | null;                // true if HBsAg is present in blood sample, null if not tested
        anti_HBs?: boolean | null;           // true if anti-HBs is present in blood sample, null if not tested
        anti_HBc?: boolean | null;           // true if anti-HBc is present in blood sample, null if not tested
        anti_HCV?: boolean | null;           // true if anti-HCV is present in blood sample, null if not tested
        HCV_RNA?: boolean | null;           // true if HCV RNA is present in blood sample, null if not tested
        TPHA_syphilis?: boolean | null;           // true if TPHA is present in blood sample, null if not tested
        VDRL_syphilis?: boolean | null;           // true if VDRL is present in blood sample, null if not tested
        RPR_syphilis?: boolean | null;           // true if RPR is present in blood sample, null if not tested
        treponema_pallidum_IgM?: boolean | null;           // true if treponema pallidum is present in blood sample, null if not tested
        treponema_pallidum_IgG?: boolean | null;           // true if treponema pallidum is present in blood sample, null if not tested
    };
    swab?:{
        bacteria?: string[];                // list of bacteria found in swab sample
        virus?: string[];                   // list of viruses found in swab sample
        parasites?: string[];               // list of parasites found in swab sample
        PCR_HSV?: boolean | null;           // true if HSV PCR is present in swab sample, null if not tested
        HPV?: boolean | null;           // true if HPV is present in swab sample, null if not tested
        NAAT_Trichomonas?: boolean | null;           // true if NAAT Trichomonas is present in swab sample, null if not tested
        rapidAntigen_Trichomonas?: boolean | null;           // true if rapid antigen Trichomonas is present in swab sample, null if not tested
        culture_Trichomonas?: boolean | null;           // true if culture Trichomonas is present in swab sample, null if not tested
    };
    time_completed: Date;                           // time when the test was completed, in milliseconds since epoch
    staff_id?: mongoose.Types.ObjectId;          // ID of the staff who created/updated the result
}
export interface IStiResult extends Document{
    sti_order_id: mongoose.Types.ObjectId;
    sti_result_items:{
        sti_test_id: mongoose.Types.ObjectId;
        result: StiResultItem;
    }[];
    received_time?: Date;                            //time will be predicted, then updated to true time after result is received
    diagnosis?: string;
    is_confirmed: boolean;
    is_critical: boolean;                           //will be first determined by the backend, then recommended to consultant
    medical_notes?: string;                          //notes for consultant
}

const stiResultSchema = new Schema<IStiResult>({
    sti_order_id: { type: Schema.Types.ObjectId, ref: 'StiOrder', required: true },
    sti_result_items: [{
        sti_test_id: { type: Schema.Types.ObjectId, ref: 'StiTest', required: true },
        result: {
            sample_type: { type: String, enum: ['blood', 'urine', 'swab'], required: true },
            sample_quality: { type: Boolean, required: true },
            urine: {
                color: { type: String, enum: ['light yellow', 'clear', 'dark yellow to orange', 'dark brown', 'pink or red', 'blue or green', 'black'], required: false },
                clarity: { type: String, enum: ['clearly', 'cloudy'], required: false },
                URO: { type: Number, required: false },
                GLU: { type: Number, required: false },
                KET: { type: Number, required: false },
                BIL: { type: Number, required: false },
                PRO: { type: Number, required: false },
                NIT: { type: Number, required: false },
                pH: { type: Number, required: false },
                blood: { type: Boolean, required: false },
                specific_gravity:{type:Number,required:false},
                LEU:{type:Number,required:false}
            },
            blood:{
                platelets:{type:Number,required:false},
                red_blood_cells:{type:Number,required:false},
                white_blood_cells:{type:Number,required:false},
                hemo_level:{type:Number,required:false},
                hiv:{type:Boolean,default:null},
                HBsAg:{type:Boolean,default:null},
                anti_HBs:{type:Boolean,default:null},
                anti_HBc:{type:Boolean,default:null},
                anti_HCV:{type:Boolean,default:null},
                HCV_RNA:{type:Boolean,default:null},
                TPHA_syphilis:{type:Boolean,default:null},
                VDRL_syphilis:{type:Boolean,default:null},
                RPR_syphilis:{type:Boolean,default:null},
                treponema_pallidum_IgM:{type:Boolean,default:null},
                treponema_pallidum_IgG:{type:Boolean,default:null}
            },
            swab:{
                bacteria:[{ type:String }],
                virus:[{ type:String }],
                parasites:[{ type:String }],
                PCR_HSV:{type:Boolean,default:null},
                HPV:{type:Boolean,default:null},
                NAAT_Trichomonas:{type:Boolean,default:null},
                rapidAntigen_Trichomonas:{type:Boolean,default:null},
                culture_Trichomonas:{type:Boolean,default:null}
            },
            time_completed: { type: Date, required: true },
            staff_id: { type: Schema.Types.ObjectId, ref: 'Staff', required: true } // Reference to the staff who created/updated the result
        }
    }],
    received_time: { type: Date },
    diagnosis: { type: String },
    is_confirmed: { type: Boolean, default: false },
    is_critical: { type: Boolean, default: false },
    medical_notes: { type: String }
}, { timestamps: true });

export const StiResult = mongoose.model<IStiResult>('StiResult', stiResultSchema);