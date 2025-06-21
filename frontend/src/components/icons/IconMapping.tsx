import React from 'react';
// Font Awesome Icons
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaClock, 
  FaSearch, 
  FaChartBar, 
  FaArrowLeft, 
  FaArrowRight,
  FaClipboardList,
  FaTimes,
  FaSpinner,
  FaRocket,
  FaFile,
  FaUser,
  FaCog,
  FaHome,
  FaEdit,
  FaSave,
  FaSync,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaUnlock,
  FaBan,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle
} from 'react-icons/fa';

// Material Design Icons
import { 
  MdRefresh,
  MdDelete,
  MdAdd,
  MdClose,
  MdSettings,
  MdDashboard,
  MdCancel
} from 'react-icons/md';

// Bootstrap Icons
import { 
  BsCalendar3,
  BsCheck2Circle,
  BsClock,
  BsSearch,
  BsBarChart,
  BsArrowLeft,
  BsArrowRight,
  BsX
} from 'react-icons/bs';

// Icon mapping object
export const iconMap = {
  // Calendar related
  '📅': FaCalendarAlt,
  'calendar': FaCalendarAlt,
  
  // Status icons
  '✅': FaCheckCircle,
  'check': FaCheckCircle,
  'success': FaCheckCircle,
  
  '⏳': FaClock,
  'loading': FaSpinner,
  'pending': FaClock,
  
  '🔍': FaSearch,
  'search': FaSearch,
  
  '📊': FaChartBar,
  'chart': FaChartBar,
  'stats': FaChartBar,
  
  // Navigation
  '←': FaArrowLeft,
  'arrow-left': FaArrowLeft,
  'back': FaArrowLeft,
  
  '→': FaArrowRight,
  'arrow-right': FaArrowRight,
  'next': FaArrowRight,
  
  // Documents and lists
  '📋': FaClipboardList,
  'list': FaClipboardList,
  'clipboard': FaClipboardList,
  
  '📝': FaEdit,
  'edit': FaEdit,
  'write': FaEdit,
  
  '📄': FaFile,
  'file': FaFile,
  'document': FaFile,
  
  // Actions
  '✕': FaTimes,
  '❌': FaTimesCircle,
  'close': FaTimes,
  'cancel': FaTimes,
  'x': BsX,
  
  '🔄': FaSync,
  'refresh': FaSync,
  'reload': FaSync,
  
  '💾': FaSave,
  'save': FaSave,
  
  // User and profile
  '👤': FaUser,
  'user': FaUser,
  'profile': FaUser,
  
  // Settings and config
  '⚙️': FaCog,
  'settings': FaCog,
  'config': FaCog,
  
  // Home
  '🏠': FaHome,
  'home': FaHome,
  
  // Communication
  '📞': FaPhone,
  'phone': FaPhone,
  
  '📧': FaEnvelope,
  'email': FaEnvelope,
  'mail': FaEnvelope,
  
  // Security
  '🔒': FaLock,
  'lock': FaLock,
  'secure': FaLock,
  
  '🔓': FaUnlock,
  'unlock': FaUnlock,
  
  // Status and alerts
  '🚫': FaBan,
  'ban': FaBan,
  'forbidden': FaBan,
  'not-available': FaBan,
  
  '⚠️': FaExclamationTriangle,
  '🚨': FaExclamationTriangle,
  'warning': FaExclamationTriangle,
  'alert': FaExclamationTriangle,
  
  '🚀': FaRocket,
  'rocket': FaRocket,
  'launch': FaRocket,
  
  // Time related
  '⏰': FaClock,
  'time': FaClock,
  'clock': FaClock,
  
  // Information
  'ℹ️': FaInfoCircle,
  'info': FaInfoCircle,
  'information': FaInfoCircle,
  
  // Misc
  '🧹': MdDelete,
  'clean': MdDelete,
  'clear': MdDelete,
  'delete': MdDelete
};

// Icon component with props
interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, color, className }) => {
  const IconComponent = iconMap[name as keyof typeof iconMap];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return <span>{name}</span>;
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className}
    />
  );
};

export default Icon;