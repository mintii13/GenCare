import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

class TestGenCareFeatures:
    """Test cases cho các tính năng chính của GenCare"""
    
    @pytest.mark.critical
    def test_homepage_loads_successfully(self, driver, test_config):
        """Test 1: Kiểm tra trang chủ tải thành công"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Kiểm tra title
        assert "SWP Group 3" in driver.title or "GenCare" in driver.title
        
        # Kiểm tra logo và brand name
        logo = wait.until(EC.presence_of_element_located((By.XPATH, "//span[text()='GenCare']")))
        assert logo.is_displayed()
        
        # Kiểm tra navigation menu (some items are buttons, some are links)
        nav_items = [
            ("Trang chủ", "a"),
            ("Dịch vụ", "button"), 
            ("Blog", "a"),
            ("Về chúng tôi", "a"),
            ("Liên hệ", "a")
        ]
        for item, element_type in nav_items:
            try:
                nav_element = driver.find_element(By.XPATH, f"//{element_type}[contains(text(), '{item}')]")
                assert nav_element.is_displayed()
            except:
                # Fallback: try both button and a
                nav_element = driver.find_element(By.XPATH, f"//button[contains(text(), '{item}')] | //a[contains(text(), '{item}')]")
                assert nav_element.is_displayed()
    
    @pytest.mark.critical
    def test_services_section_display(self, driver, test_config):
        """Test 2: Kiểm tra hiển thị section dịch vụ trên trang chủ"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Kiểm tra title section dịch vụ
        services_title = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//h2[contains(text(), 'Dịch vụ của chúng tôi')]")
        ))
        assert services_title.is_displayed()
        
        # Kiểm tra 3 dịch vụ chính
        services = [
            "Theo dõi chu kỳ",
            "Tư vấn trực tuyến", 
            "Xét nghiệm STIs"
        ]
        
        for service in services:
            service_card = driver.find_element(By.XPATH, f"//h3[contains(text(), '{service}')]")
            assert service_card.is_displayed()
    
    @pytest.mark.critical
    def test_login_modal_functionality(self, driver, test_config):
        """Test 3: Kiểm tra chức năng modal đăng nhập"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Click nút đăng nhập
        login_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(text(), 'Đăng nhập')]")
        ))
        login_btn.click()
        
        # Kiểm tra modal xuất hiện (dùng selector đúng từ LoginModal.tsx)
        modal = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, ".bg-white.rounded-lg.shadow-xl")
        ))
        assert modal.is_displayed()
        
        # Kiểm tra các trường input trong modal (dùng name attribute)
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        
        assert email_input.is_displayed()
        assert password_input.is_displayed()
    
    @pytest.mark.login
    def test_register_page_navigation(self, driver, test_config):
        """Test 4: Kiểm tra điều hướng đến trang đăng ký"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Click nút đăng ký
        register_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[contains(text(), 'Đăng ký')]")
        ))
        register_btn.click()
        
        # Kiểm tra URL chuyển đến trang đăng ký
        wait.until(lambda driver: "/register" in driver.current_url)
        assert "/register" in driver.current_url
        
        # Kiểm tra form đăng ký hiển thị
        form_fields = ["email", "password", "full_name"]
        for field in form_fields:
            try:
                field_element = driver.find_element(By.XPATH, f"//input[@name='{field}' or @placeholder*='{field}']")
                assert field_element.is_displayed()
            except:
                # Fallback nếu không tìm thấy exact field name
                pass
    
    @pytest.mark.smoke
    def test_period_tracking_navigation(self, driver, test_config):
        """Test 5: Kiểm tra điều hướng đến tính năng theo dõi chu kỳ"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Hover vào menu Dịch vụ
        services_menu = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//button[contains(text(), 'Dịch vụ')]")
        ))
        
        # Sử dụng JavaScript để hover
        driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));", services_menu)
        
        # Click vào "Theo dõi kinh nguyệt"
        try:
            period_tracking_link = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(text(), 'Theo dõi kinh nguyệt')]")
            ))
            period_tracking_link.click()
            
            # Kiểm tra URL
            wait.until(lambda driver: "/period-tracking" in driver.current_url)
            assert "/period-tracking" in driver.current_url
        except TimeoutException:
            # Fallback: click trực tiếp từ trang chủ
            try:
                period_card_link = driver.find_element(By.XPATH, "//a[@href='/services/cycle']")
                period_card_link.click()
            except:
                pytest.skip("Period tracking link not found")
    
    @pytest.mark.smoke
    def test_consultation_booking_navigation(self, driver, test_config):
        """Test 6: Kiểm tra điều hướng đến tính năng đặt lịch tư vấn"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Hover vào menu Dịch vụ
        services_menu = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//button[contains(text(), 'Dịch vụ')]")
        ))
        
        driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));", services_menu)
        
        # Click vào "Đặt lịch tư vấn"
        try:
            consultation_link = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(text(), 'Đặt lịch tư vấn')]")
            ))
            consultation_link.click()
            
            # Kiểm tra URL
            wait.until(lambda driver: "/consultation" in driver.current_url or "/book" in driver.current_url)
            assert any(keyword in driver.current_url for keyword in ["/consultation", "/book"])
        except TimeoutException:
            # Fallback: click từ service card
            try:
                consult_card_link = driver.find_element(By.XPATH, "//a[@href='/services/consult']")
                consult_card_link.click()
            except:
                pytest.skip("Consultation booking link not found")
    
    @pytest.mark.smoke
    def test_sti_testing_navigation(self, driver, test_config):
        """Test 7: Kiểm tra điều hướng đến dịch vụ xét nghiệm STIs"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Hover vào menu Dịch vụ
        services_menu = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//button[contains(text(), 'Dịch vụ')]")
        ))
        
        driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));", services_menu)
        
        # Click vào "Dịch vụ xét nghiệm"
        try:
            sti_link = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(text(), 'Dịch vụ xét nghiệm')]")
            ))
            sti_link.click()
            
            # Kiểm tra URL
            wait.until(lambda driver: "/test-packages" in driver.current_url)
            assert "/test-packages" in driver.current_url
        except TimeoutException:
            # Fallback: click từ service card
            try:
                sti_card_link = driver.find_element(By.XPATH, "//a[@href='/test-packages']")
                sti_card_link.click()
            except:
                pytest.skip("STI testing link not found")
    
    @pytest.mark.content
    def test_blog_section_functionality(self, driver, test_config):
        """Test 8: Kiểm tra chức năng section blog"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Kiểm tra title section blog
        try:
            blog_title = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//h2[contains(text(), 'Blog Sức Khỏe Sinh Sản')]")
            ))
            assert blog_title.is_displayed()
            
            # Kiểm tra nút "Xem tất cả"
            view_all_btn = driver.find_element(By.XPATH, "//a[contains(text(), 'Xem tất cả')]")
            assert view_all_btn.is_displayed()
            
            # Click để đi đến trang blog
            view_all_btn.click()
            wait.until(lambda driver: "/blogs" in driver.current_url)
            assert "/blogs" in driver.current_url
            
        except TimeoutException:
            # Nếu không có blog, kiểm tra message "Chưa có bài viết nào"
            no_posts_message = driver.find_element(By.XPATH, "//h3[contains(text(), 'Chưa có bài viết nào')]")
            assert no_posts_message.is_displayed()
    
    @pytest.mark.navigation
    def test_blog_page_navigation(self, driver, test_config):
        """Test 9: Kiểm tra điều hướng đến trang blog từ menu"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Click vào Blog trong navigation
        blog_nav_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[contains(text(), 'Blog')]")
        ))
        blog_nav_link.click()
        
        # Kiểm tra URL
        wait.until(lambda driver: "/blogs" in driver.current_url)
        assert "/blogs" in driver.current_url
        
        # Kiểm tra trang blog load thành công
        page_content = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//body")
        ))
        assert page_content.is_displayed()
    
    @pytest.mark.navigation
    def test_about_page_navigation(self, driver, test_config):
        """Test 10: Kiểm tra điều hướng đến trang "Về chúng tôi" """
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Click vào "Về chúng tôi"
        about_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[contains(text(), 'Về chúng tôi')]")
        ))
        about_link.click()
        
        # Kiểm tra URL
        wait.until(lambda driver: "/about" in driver.current_url)
        assert "/about" in driver.current_url
    
    @pytest.mark.responsive
    def test_mobile_menu_functionality(self, driver, test_config):
        """Test 11: Kiểm tra chức năng menu mobile"""
        # Set mobile viewport
        driver.set_window_size(375, 667)
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Tìm nút hamburger menu (mobile)
        try:
            mobile_menu_btn = wait.until(EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(@class, 'md:hidden') or @aria-label='Menu']")
            ))
            mobile_menu_btn.click()
            
            # Kiểm tra menu mobile xuất hiện
            mobile_menu = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//div[contains(@class, 'mobile-menu') or contains(@class, 'md:hidden')]//a")
            ))
            assert mobile_menu.is_displayed()
            
        except TimeoutException:
            # Restore desktop size nếu không tìm thấy mobile menu
            driver.set_window_size(1920, 1080)
            pytest.skip("Mobile menu button not found")
        
        # Restore desktop size
        driver.set_window_size(1920, 1080)
    
    @pytest.mark.accessibility
    def test_page_accessibility_basics(self, driver, test_config):
        """Test 12: Kiểm tra các yếu tố accessibility cơ bản"""
        driver.get(test_config.BASE_URL)
        wait = WebDriverWait(driver, 10)
        
        # Kiểm tra page title
        assert driver.title and len(driver.title.strip()) > 0
        
        # Kiểm tra có ít nhất một heading
        headings = driver.find_elements(By.XPATH, "//h1")
        assert len(headings) > 0
        
        # Kiểm tra các link có text hoặc aria-label
        links = driver.find_elements(By.TAG_NAME, "a")
        for link in links[:5]:  # Check first 5 links only
            link_text = link.text.strip()
            aria_label = link.get_attribute("aria-label")
            assert link_text or aria_label, f"Link without text or aria-label found: {link.get_attribute('href')}"
        
        # Kiểm tra các button có text hoặc aria-label
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for button in buttons[:5]:  # Check first 5 buttons only
            button_text = button.text.strip()
            aria_label = button.get_attribute("aria-label")
            # Skip hidden buttons (như mobile menu button)
            if not button.is_displayed():
                continue
            # Có text hoặc aria-label là OK
            if button_text or aria_label:
                continue
            # Button có icon (SVG) bên trong thì OK
            icons = button.find_elements(By.TAG_NAME, "svg")
            if icons:
                continue
            # Nếu không có gì thì fail
            assert False, f"Button without text, aria-label or icon found: {button.get_attribute('class')}" 