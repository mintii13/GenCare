import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { Loading } from "../components/ui";
import { navigateAfterLogin } from "../utils/navigationUtils";

function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        
        if (!token) {
          setError("Không tìm thấy token xác thực");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Lưu token và lấy thông tin user
        const AUTH_TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY ?? "gencare_auth_token";
        localStorage.setItem(AUTH_TOKEN_KEY, token);

        // Gọi API để lấy thông tin user
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/auth/getUserProfile`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          // Đăng nhập qua AuthContext
          login(response.data.user, token);
          
          // Redirect dựa trên role sử dụng helper function
          navigateAfterLogin(response.data.user, navigate);
        } else {
          throw new Error("Không thể lấy thông tin người dùng");
        }
      } catch (error: any) {
        console.error("OAuth error:", error);
        setError("Đăng nhập thất bại: " + (error.response?.data?.message || error.message));
        
        // Xóa token lỗi
        localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY ?? "gencare_auth_token");
        
        // Redirect về home sau 3 giây
        setTimeout(() => navigate("/"), 3000);
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