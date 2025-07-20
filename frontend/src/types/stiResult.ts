export type StiResultItem = {
  sti_test_id: string;
  result: {
    sample_type: 'blood' | 'urine' | 'swab';
    sample_quality: boolean;
    urine?: {
      color?: string;
      clarity?: string;
      URO?: number;
      GLU?: number;
      KET?: number;
      BIL?: number;
      PRO?: number;
      NIT?: number;
      pH?: number;
      blood?: boolean;
      specific_gravity?: number;
      LEU?: number;
    };
    blood?: {
      platelets?: number;
      red_blood_cells?: number;
      white_blood_cells?: number;
      hemo_level?: number;
      hiv?: boolean | null;
      HBsAg?: boolean | null;
      anti_HBs?: boolean | null;
      anti_HBc?: boolean | null;
      anti_HCV?: boolean | null;
      HCV_RNA?: boolean | null;
      TPHA_syphilis?: boolean | null;
      VDRL_syphilis?: boolean | null;
      RPR_syphilis?: boolean | null;
      treponema_pallidum_IgM?: boolean | null;
      treponema_pallidum_IgG?: boolean | null;
    };
    swab?: {
      bacteria?: string[];
      virus?: string[];
      parasites?: string[];
      PCR_HSV?: boolean | null;
      HPV?: boolean | null;
      NAAT_Trichomonas?: boolean | null;
      rapidAntigen_Trichomonas?: boolean | null;
      culture_Trichomonas?: boolean | null;
    };
    time_completed: string;
    staff_id?: string;
  };
};

export interface StiResult {
  _id: string;
  sti_order_id: string;
  sti_result_items: StiResultItem[];
  received_time: string;
  diagnosis: string;
  is_confirmed: boolean;
  is_critical: boolean;
  medical_notes: string;
  createdAt?: string;
  updatedAt?: string;
} 