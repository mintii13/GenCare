import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY || "accessToken", token);
      // Sau đó chuyển hướng về trang chính hoặc profile
      navigate("/");
    }
  }, [navigate]);

  return <div>Đang đăng nhập...</div>;
}

export default OAuthSuccess; 