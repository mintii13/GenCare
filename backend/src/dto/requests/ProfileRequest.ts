export interface ProfileRequest{
    //avatar được truyền lên từ multipart/form-data(hỗn hợp dữ liệu), không truyền từ body
    full_name?: string;
    phone?: string;
    date_of_birth?: Date,
    gender?: string
}