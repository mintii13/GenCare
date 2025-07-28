import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterRedirect = () => {
  const { openModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    openModal('register');

    // If there's a history to go back to, go back. Otherwise, go to homepage.
    // `location.key` is 'default' on initial load, so we check against that.
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [openModal, navigate, location.key]);

  // This component renders nothing, it just triggers effects
  return null;
};

export default RegisterRedirect; 