export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}