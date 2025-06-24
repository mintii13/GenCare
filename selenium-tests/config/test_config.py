"""
GenCare Test Configuration
Cấu hình chung cho tất cả test cases
"""
import os
from typing import Dict, Any

class TestConfig:
    """Configuration class for GenCare Selenium tests"""
    
    # Base URLs
    BASE_URL = os.getenv('BASE_URL', 'http://localhost:5173')
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
    
    # Browser Settings
    BROWSER = os.getenv('BROWSER', 'edge')  # chrome, firefox, edge
    HEADLESS = os.getenv('HEADLESS', 'false').lower() == 'true'
    WINDOW_SIZE = (1920, 1080)
    
    # Timeouts (seconds) - Optimized for faster testing
    IMPLICIT_WAIT = 5       # Reduced from 10
    EXPLICIT_WAIT = 10      # Reduced from 20  
    PAGE_LOAD_TIMEOUT = 15  # Reduced from 30
    
    # 🔑 TEST CREDENTIALS - CẬP NHẬT THÔNG TIN ĐĂNG NHẬP THỰC TẾ TẠI ĐÂY
    # =====================================================================
    
    # Consultant account - dùng cho test consultant features  
    VALID_EMAIL = os.getenv('TEST_CONSULTANT_EMAIL', "consultant1@gencare.com")
    VALID_PASSWORD = os.getenv('TEST_CONSULTANT_PASSWORD', "password")
    
    # Customer account - dùng cho test customer features
    CUSTOMER_EMAIL = os.getenv('TEST_CUSTOMER_EMAIL', "customer1@gencare.com")
    CUSTOMER_PASSWORD = os.getenv('TEST_CUSTOMER_PASSWORD', "password")
    
    # Admin account - dùng cho test admin features
    ADMIN_EMAIL = "admin@gencare.com"                  # 👈 THAY ĐỔI EMAIL ADMIN THỰC TẾ
    ADMIN_PASSWORD = "password"                        # 👈 THAY ĐỔI PASSWORD ADMIN THỰC TẾ
    
    # Staff account - dùng cho test staff features  
    STAFF_EMAIL = "staff1@gencare.com"                  # 👈 THAY ĐỔI EMAIL STAFF THỰC TẾ
    STAFF_PASSWORD = "password"                        # 👈 THAY ĐỔI PASSWORD STAFF THỰC TẾ
    
    # =====================================================================
    
    # File Paths
    DOWNLOADS_PATH = os.path.join(os.getcwd(), "downloads")
    SCREENSHOTS_PATH = os.path.join(os.getcwd(), "reports", "screenshots")
    REPORTS_PATH = os.path.join(os.getcwd(), "reports")
    
    # Database (if needed)
    DB_CONNECTION_STRING = os.getenv('DB_CONNECTION_STRING', '')
    
    # API Keys
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    
    @classmethod
    def get_browser_options(cls) -> Dict[str, Any]:
        """Get browser-specific options"""
        options = {
            'headless': cls.HEADLESS,
            'window_size': cls.WINDOW_SIZE,
            'download_path': cls.DOWNLOADS_PATH
        }
        
        if cls.BROWSER.lower() == 'chrome':
            options.update({
                'chrome_options': [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-web-security',
                    '--allow-running-insecure-content'
                ]
            })
        elif cls.BROWSER.lower() == 'edge':
            options.update({
                'edge_options': [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-password-manager-reauthentication'
                ]
            })
        
        return options
    
    @classmethod
    def get_test_urls(cls) -> Dict[str, str]:
        """Get all test URLs"""
        return {
            'home': cls.BASE_URL,
            'login_modal': cls.BASE_URL,  # Login sử dụng modal trên homepage
            'register': f"{cls.BASE_URL}/register",
            'dashboard': f"{cls.BASE_URL}/dashboard",
            'appointments': f"{cls.BASE_URL}/dashboard/consultant/appointments",
            'blog': f"{cls.BASE_URL}/blogs",
            'sti_tests': f"{cls.BASE_URL}/test-packages/sti",
            'period_tracker': f"{cls.BASE_URL}/period-tracker",
            'about': f"{cls.BASE_URL}/about"
        } 