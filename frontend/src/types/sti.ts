export interface StiTest {
  sti_test_id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  duration: string;
  isActive: boolean;
  category: string;
  sti_test_type: string;
}

export interface StiTestResponse {
  success: boolean;
  message?: string;
  data: StiTest | StiTest[];
} 