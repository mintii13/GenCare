import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../services/apiClient";
import { API } from "../config/apiEndpoints";
import { Loading } from "../components/ui";
import { navigateAfterLogin } from "../utils/navigationUtils";
import { setGoogleAccessToken } from "../utils/authUtils";
import { User } from "../types";
import { User as BackendUser } from "../services/userService";

const AUTH_TOKEN_KEY = "gencare_auth_token";

interface GetUserProfileResponse {
  success: boolean;
  user: BackendUser;
}

function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const googleToken = params.get("googleToken");

        
        if (!token) {
          setError("Không tìm thấy token xác thực từ server");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Bước 1: Lưu cả hai token ngay lập tức
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        
        if (googleToken) {
          setGoogleAccessToken(googleToken);
        }

        // Bước 2: Gọi API với Authorization header rõ ràng
        const response = await apiClient.get<GetUserProfileResponse>(
          API.Profile.GET,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );


        if (response.data.success) {

          const user = {
            ...response.data.user,
            _id: response.data.user.id
          } as User;
          login(user, token);
          
          // Bước 4: Redirect hoặc thông báo
          if (response.data.user.role === 'customer') {
            // Customer không redirect, chỉ về homepage với thông báo thành công
            setTimeout(() => {
              navigate("/");
            }, 1500);
          } else {
            // Các role khác redirect vào dashboard
          navigateAfterLogin(response.data.user, navigate);
          }
        } else {
          throw new Error("API trả về success=false");
        }
      } catch (error: any) {

        
        setError("Đăng nhập thất bại: " + (error.response?.data?.message || error.message));
        
        // Vẫn giữ token trong localStorage để user có thể thử lại
        
        // Redirect về home sau 5 giây (tăng thời gian để user đọc được lỗi)
        setTimeout(() => navigate("/"), 5000);
      }
    };

    handleOAuthSuccess();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Đang chuyển hướng về trang chủ...</p>
          <p className="text-sm text-gray-500 mt-2">
            Kiểm tra Console để xem chi tiết lỗi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loading text="Đang xử lý đăng nhập Google..." />
        <p className="text-gray-600 mt-4">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>
  );
}

export default OAuthSuccess;  