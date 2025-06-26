export interface StiTest {
  _id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  isActive: boolean;
  category: string;
  sti_test_type: string;
}

export interface StiTestResponse {
  success: boolean;
  message?: string;
  stitest: StiTest | StiTest[];
}