import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../services/apiClient";
import { API } from "../config/apiEndpoints";
import { Loading } from "../components/ui";
import { navigateAfterLogin } from "../utils/navigationUtils";
import { setGoogleAccessToken } from "../utils/authUtils";
import { User } from "@/services/userService";

const AUTH_TOKEN_KEY = "gencare_auth_token";

interface GetUserProfileResponse {
  success: boolean;
  user: User;
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
        
        console.log("OAuth callback received:", { 
          hasToken: !!token, 
          hasGoogleToken: !!googleToken,
          token: token?.substring(0, 20) + "..."
        });
        
        if (!token) {
          setError("Không tìm thấy token xác thực từ server");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Bước 1: Lưu cả hai token ngay lập tức
        console.log("Saving tokens to localStorage...");
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log("AUTH_TOKEN_KEY saved:", localStorage.getItem(AUTH_TOKEN_KEY) ? "✓" : "✗");
        
        if (googleToken) {
          setGoogleAccessToken(googleToken);
          console.log("Google access token saved:", localStorage.getItem("google_access_token") ? "✓" : "✗");
        }

        // Bước 2: Gọi API với Authorization header rõ ràng
        console.log("Fetching user profile...");
        const response = await apiClient.get<GetUserProfileResponse>(
          API.Auth.GET_USER_PROFILE,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log("API response:", response.data);

        if (response.data.success) {
          // Bước 3: Đăng nhập qua AuthContext (sẽ lưu token một lần nữa, nhưng không sao)
          console.log("Calling AuthContext.login...");
          login(response.data.user, token);
          
          // Bước 4: Redirect
          console.log("Redirecting based on user role:", response.data.user.role);
          navigateAfterLogin(response.data.user, navigate);
        } else {
          throw new Error("API trả về success=false");
        }
      } catch (error: any) {
        console.error("OAuth error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        setError("Đăng nhập thất bại: " + (error.response?.data?.message || error.message));
        
        // Vẫn giữ token trong localStorage để user có thể thử lại
        console.log("Keeping tokens in localStorage for retry");
        
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
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
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