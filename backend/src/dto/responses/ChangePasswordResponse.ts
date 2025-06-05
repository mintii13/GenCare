export interface ChangePasswordResponse {
    success: boolean;
    message: string;
    email?: string;
    accessToken?: string;
}
