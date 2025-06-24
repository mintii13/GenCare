"""
Dashboard Page Object Model
Page object cho trang dashboard GenCare
"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from config.test_config import TestConfig

class DashboardPage(BasePage):
    """Dashboard page object model"""
    
    # Common Header Locators
    USER_MENU = (By.CSS_SELECTOR, "[data-testid='user-menu']")
    USER_AVATAR = (By.CSS_SELECTOR, ".avatar")
    LOGOUT_BUTTON = (By.CSS_SELECTOR, "button:contains('Đăng xuất')")
    PROFILE_LINK = (By.CSS_SELECTOR, "a:contains('Hồ sơ')")
    NOTIFICATIONS_ICON = (By.CSS_SELECTOR, "[data-testid='notifications']")
    
    # Navigation Menu Locators
    DASHBOARD_NAV = (By.CSS_SELECTOR, "nav a:contains('Dashboard')")
    APPOINTMENTS_NAV = (By.CSS_SELECTOR, "nav a:contains('Lịch hẹn')")
    SCHEDULE_NAV = (By.CSS_SELECTOR, "nav a:contains('Lịch trình')")
    BLOG_NAV = (By.CSS_SELECTOR, "nav a:contains('Blog')")
    PROFILE_NAV = (By.CSS_SELECTOR, "nav a:contains('Hồ sơ')")
    
    # Dashboard Content Locators
    WELCOME_MESSAGE = (By.CSS_SELECTOR, ".welcome-message")
    STATS_CARDS = (By.CSS_SELECTOR, ".stats-card")
    RECENT_APPOINTMENTS = (By.CSS_SELECTOR, ".recent-appointments")
    
    # Role-specific sections
    CONSULTANT_SECTION = (By.CSS_SELECTOR, "[data-role='consultant']")
    CUSTOMER_SECTION = (By.CSS_SELECTOR, "[data-role='customer']")
    ADMIN_SECTION = (By.CSS_SELECTOR, "[data-role='admin']")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.url = TestConfig.get_test_urls()['dashboard']
        
    def navigate_to_dashboard(self):
        """Navigate đến trang dashboard"""
        self.navigate_to(self.url)
        self.wait_for_page_load()
        
    def click_user_menu(self):
        """Click user menu dropdown"""
        self.click_element(self.USER_MENU)
        
    def click_logout(self):
        """Đăng xuất"""
        self.click_user_menu()
        self.click_element(self.LOGOUT_BUTTON)
        
    def click_profile_link(self):
        """Click link đến profile"""
        self.click_user_menu()
        self.click_element(self.PROFILE_LINK)
        
    def navigate_to_appointments(self):
        """Navigate đến trang appointments"""
        self.click_element(self.APPOINTMENTS_NAV)
        
    def navigate_to_schedule(self):
        """Navigate đến trang schedule"""
        self.click_element(self.SCHEDULE_NAV)
        
    def navigate_to_blog(self):
        """Navigate đến trang blog"""
        self.click_element(self.BLOG_NAV)
        
    def get_welcome_message(self):
        """Lấy welcome message"""
        if self.is_element_present(self.WELCOME_MESSAGE):
            return self.get_text(self.WELCOME_MESSAGE)
        return None
        
    def get_stats_cards_count(self):
        """Đếm số lượng stats cards"""
        if self.is_element_present(self.STATS_CARDS):
            return len(self.find_elements(self.STATS_CARDS))
        return 0
        
    def is_dashboard_loaded(self):
        """Kiểm tra dashboard đã load xong chưa"""
        return self.is_element_visible(self.USER_MENU) and \
               self.is_element_visible(self.DASHBOARD_NAV)
               
    def is_consultant_dashboard(self):
        """Kiểm tra có phải consultant dashboard không"""
        return self.is_element_present(self.CONSULTANT_SECTION)
        
    def is_customer_dashboard(self):
        """Kiểm tra có phải customer dashboard không"""
        return self.is_element_present(self.CUSTOMER_SECTION)
        
    def is_admin_dashboard(self):
        """Kiểm tra có phải admin dashboard không"""
        return self.is_element_present(self.ADMIN_SECTION)
        
    def get_current_user_role(self):
        """Xác định role của user hiện tại"""
        if self.is_consultant_dashboard():
            return "consultant"
        elif self.is_customer_dashboard():
            return "customer"
        elif self.is_admin_dashboard():
            return "admin"
        return "unknown"
        
    def wait_for_dashboard_load(self, timeout=10):
        """Chờ dashboard load hoàn tất"""
        self.wait_for_element_visible(self.USER_MENU, timeout)
        self.wait_for_page_load()
        
    def check_navigation_menu_items(self):
        """Kiểm tra các item trong navigation menu"""
        nav_items = []
        
        if self.is_element_present(self.DASHBOARD_NAV):
            nav_items.append("dashboard")
        if self.is_element_present(self.APPOINTMENTS_NAV):
            nav_items.append("appointments")
        if self.is_element_present(self.SCHEDULE_NAV):
            nav_items.append("schedule")
        if self.is_element_present(self.BLOG_NAV):
            nav_items.append("blog")
        if self.is_element_present(self.PROFILE_NAV):
            nav_items.append("profile")
            
        return nav_items 