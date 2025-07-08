export interface StiTest {
  _id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  is_active: boolean;
  category: string;
  sti_test_type: string;
}

export interface StiPackage {
  _id: string;
  sti_package_name: string;
  sti_package_code: string;
  description: string;
  price: number;
  is_active: boolean;
  tests?: StiTest[]; // populated tests in package
}

export interface StiTestResponse {
  success: boolean;
  message?: string;
  stitest: StiTest | StiTest[];
}

export interface StiPackageResponse {
  success: boolean;
  message?: string;
  stipackage: StiPackage | StiPackage[];
}