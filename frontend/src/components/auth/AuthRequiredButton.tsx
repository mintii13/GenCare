import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import LoginModal from "./LoginModal";
import { navigateAfterLogin } from "../../utils/navigationUtils";

interface AuthRequiredButtonProps {
  children: React.ReactNode;
  redirectTo: string;
  className?: string;
  onClick?: () => void;
  message?: string;
  successMessage?: string;
  redirectToDashboard?: boolean; // Nếu true, sẽ redirect đến dashboard thay vì redirectTo
}

const AuthRequiredButton: React.FC<AuthRequiredButtonProps> = ({
  children,
  redirectTo,
  className = "",
  onClick,
  message = "Vui lòng đăng nhập để sử dụng dịch vụ này!",
  successMessage,
  redirectToDashboard = false,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleClick = () => {
    if (isAuthenticated) {
      // Nếu đã đăng nhập, thực hiện action hoặc chuyển hướng
      if (onClick) {
        onClick();
      } else {
        navigate(redirectTo);
      }
    } else {
      // Hiển thị toast trước, sau đó mở modal đăng nhập
      console.log('Showing toast with message:', message);
      toast.error(message, {
        duration: 4000,
        position: 'top-right',
      });
      setShowLoginModal(true);
    }
  };



  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default AuthRequiredButton;