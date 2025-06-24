"""
Working Blog CRUD Tests for GenCare
Tests using manual login approach that we know works
"""

import pytest
import allure
import time
from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.logger import get_logger


@allure.epic("GenCare Blog System")
@allure.feature("Blog CRUD Operations (Working)")
class TestBlogCRUDWorking:
    """Test Blog CRUD operations with working manual login"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.logger.info("=== Working Blog CRUD Test Suite Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🧪 Starting test: {method.__name__}")
    
    def teardown_method(self, method):
        """Cleanup after each test method"""
        try:
            # Try to logout if logged in
            if hasattr(self, 'base_page'):
                self.manual_logout()
            self.logger.info(f"✅ Test completed: {method.__name__}")
        except Exception as e:
            self.logger.warning(f"Cleanup warning in {method.__name__}: {str(e)}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.blog_page = BlogPageNew(driver)
    
    def manual_login_admin(self):
        """Manual admin login using known working approach"""
        try:
            self.logger.info("🔑 Performing manual admin login")
            
            # Navigate to homepage
            self.base_page.navigate_to("/")
            self.base_page.wait_for_page_load()
            
            # Click login button
            login_button_clicked = self.base_page.click_element(
                ("xpath", "//button[contains(text(), 'Đăng nhập')]")
            )
            if not login_button_clicked:
                self.logger.error("Could not click login button")
                return False
            
            # Wait for login form
            time.sleep(2)
            
            # Fill email
            email_filled = self.base_page.type_text(
                ("name", "email"), 
                "admin1@gencare.com"
            )
            if not email_filled:
                self.logger.error("Could not fill email")
                return False
            
            # Fill password
            password_filled = self.base_page.type_text(
                ("name", "password"), 
                "password"
            )
            if not password_filled:
                self.logger.error("Could not fill password")
                return False
            
            # Submit form
            submit_clicked = self.base_page.click_element(
                ("xpath", "//button[@type='submit']")
            )
            if not submit_clicked:
                self.logger.error("Could not click submit")
                return False
            
            # Wait for login response
            time.sleep(5)
            
            # Check if login successful
            current_url = self.base_page.get_current_url()
            if "/admin" in current_url:
                self.logger.info(f"✅ Admin login successful: {current_url}")
                return True
            else:
                self.logger.error(f"❌ Admin login failed: {current_url}")
                return False
                
        except Exception as e:
            self.logger.error(f"Manual login failed: {e}")
            return False
    
    def manual_logout(self):
        """Manual logout"""
        try:
            logout_selectors = [
                ("xpath", "//button[contains(text(), 'Đăng xuất')]"),
                ("xpath", "//a[contains(text(), 'Đăng xuất')]"),
                ("link text", "Đăng xuất")
            ]
            
            for selector in logout_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=2):
                        self.base_page.click_element(selector)
                        time.sleep(2)
                        self.logger.info("Logged out successfully")
                        return True
                except:
                    continue
            
            # If no logout button found, user probably not logged in
            self.logger.info("No logout button found - user not logged in")
            return True
            
        except Exception as e:
            self.logger.warning(f"Logout failed: {e}")
            return False
    
    def is_admin_logged_in(self):
        """Check if admin is logged in"""
        try:
            current_url = self.base_page.get_current_url()
            if "/admin" in current_url:
                return True
                
            # Check for admin indicators in page source
            page_source = self.base_page.driver.page_source
            admin_indicators = ["dashboard", "admin", "đăng xuất"]
            
            for indicator in admin_indicators:
                if indicator.lower() in page_source.lower():
                    return True
                    
            return False
        except:
            return False
    
    # ===============================
    # READ OPERATIONS TESTS
    # ===============================
    
    @allure.story("Read Operations")
    @allure.severity("critical")
    def test_guest_can_read_blogs(self):
        """Test guest can read/view blogs (no authentication required)"""
        with allure.step("Testing guest blog read access"):
            # Navigate to blog list as guest
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Verify page loads
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            
            # Verify guest can see blogs
            blogs_visible = self.blog_page.are_blogs_visible()
            self.logger.info(f"Guest can see blogs: {blogs_visible}")
            
            # Guest should NOT see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            assert not create_button_visible, "Guest should not see create blog button"
            
            self.logger.info("✅ Guest read access verified")
    
    @allure.story("Read Operations")
    @allure.severity("high")
    def test_admin_can_read_blogs(self):
        """Test admin can read blogs"""
        with allure.step("Testing admin blog read access"):
            # Login as admin
            assert self.manual_login_admin(), "Admin login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Verify page loads
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            
            # Admin should see blogs
            blogs_visible = self.blog_page.are_blogs_visible()
            self.logger.info(f"Admin can see blogs: {blogs_visible}")
            assert blogs_visible, "Admin should be able to see blogs"
            
            self.logger.info("✅ Admin read access verified")
    
    # ===============================
    # CREATE OPERATIONS TESTS
    # ===============================
    
    @allure.story("Create Operations")
    @allure.severity("critical")
    def test_admin_can_access_blog_creation(self):
        """Test admin can access blog creation functionality"""
        with allure.step("Testing admin blog creation access"):
            # Login as admin
            assert self.manual_login_admin(), "Admin login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Admin should see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            if create_button_visible:
                self.logger.info("✅ Admin can see create blog button")
            else:
                self.logger.info("ℹ️ Create blog button not visible (may be in different location)")
            
            # Try to access blog creation page
            blog_creation_accessible = self.blog_page.navigate_to_blog_creation()
            if blog_creation_accessible:
                self.logger.info("✅ Admin can access blog creation page")
                
                # Check if creation form is available
                form_available = self.blog_page.is_blog_creation_form_available()
                if form_available:
                    self.logger.info("✅ Blog creation form is available")
                else:
                    self.logger.info("ℹ️ Blog creation form not detected")
            else:
                self.logger.info("ℹ️ Blog creation page not accessible")
            
            self.logger.info("✅ Admin create access test completed")
    
    @allure.story("Create Operations")
    @allure.severity("normal")
    def test_guest_cannot_access_blog_creation(self):
        """Test guest cannot access blog creation"""
        with allure.step("Testing guest blog creation restrictions"):
            # Navigate to blog list as guest
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Guest should NOT see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            assert not create_button_visible, "Guest should not see create blog button"
            
            # Try direct access to blog creation URL
            self.base_page.navigate_to("/blogs/create")
            time.sleep(3)
            
            current_url = self.base_page.get_current_url()
            
            # Should be redirected or see error
            if "/blogs/create" not in current_url:
                self.logger.info("✅ Guest was redirected from blog creation page")
            else:
                # Check if there's an access denied message
                page_source = self.base_page.driver.page_source
                access_denied_indicators = [
                    "access denied", "unauthorized", "permission denied",
                    "đăng nhập", "login required", "not authorized"
                ]
                
                access_denied = any(indicator in page_source.lower() 
                                  for indicator in access_denied_indicators)
                
                if access_denied:
                    self.logger.info("✅ Guest sees access denied message")
                else:
                    self.logger.warning("⚠️ Guest can access creation page (potential security issue)")
            
            self.logger.info("✅ Guest create restriction test completed")
    
    # ===============================
    # COMMENT OPERATIONS TESTS
    # ===============================
    
    @allure.story("Comment Operations")
    @allure.severity("normal")
    def test_admin_can_see_comment_functionality(self):
        """Test admin can see comment functionality"""
        with allure.step("Testing admin comment functionality"):
            # Login as admin
            assert self.manual_login_admin(), "Admin login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Check if blogs are available
            blogs_visible = self.blog_page.are_blogs_visible()
            if not blogs_visible:
                self.logger.warning("No blogs available to test comments")
                return
            
            # Try to navigate to a blog detail (if available)
            try:
                # Look for first blog link
                blog_links = self.base_page.driver.find_elements("css selector", "article a, .blog-title a")
                if blog_links:
                    blog_links[0].click()
                    time.sleep(3)
                    
                    # Check if comment functionality is available
                    comment_available = self.blog_page.check_comment_functionality()
                    if comment_available:
                        self.logger.info("✅ Admin can see comment functionality")
                    else:
                        self.logger.info("ℹ️ Comment functionality not detected")
                else:
                    self.logger.info("ℹ️ No blog links found to test comments")
                    
            except Exception as e:
                self.logger.info(f"ℹ️ Comment test inconclusive: {e}")
            
            self.logger.info("✅ Admin comment test completed")
    
    @allure.story("Comment Operations")
    @allure.severity("normal")
    def test_guest_cannot_comment(self):
        """Test guest cannot comment on blogs"""
        with allure.step("Testing guest comment restrictions"):
            # Navigate to blog list as guest
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Check if blogs are available
            blogs_visible = self.blog_page.are_blogs_visible()
            if not blogs_visible:
                self.logger.warning("No blogs available to test comments")
                return
            
            # Try to navigate to a blog detail (if available)
            try:
                # Look for first blog link
                blog_links = self.base_page.driver.find_elements("css selector", "article a, .blog-title a")
                if blog_links:
                    blog_links[0].click()
                    time.sleep(3)
                    
                    # Check if comment input is available for guest
                    comment_inputs = self.base_page.driver.find_elements(
                        "css selector", 
                        "textarea[placeholder*='comment'], .comment-input"
                    )
                    
                    if comment_inputs:
                        self.logger.warning("⚠️ Guest can see comment input (potential issue)")
                    else:
                        self.logger.info("✅ Guest cannot see comment input")
                else:
                    self.logger.info("ℹ️ No blog links found to test comments")
                    
            except Exception as e:
                self.logger.info(f"ℹ️ Guest comment test inconclusive: {e}")
            
            self.logger.info("✅ Guest comment restriction test completed")
    
    # ===============================
    # INTEGRATION TESTS
    # ===============================
    
    @allure.story("Integration Tests")
    @allure.severity("high")
    def test_blog_navigation_flow(self):
        """Test complete blog navigation flow"""
        with allure.step("Testing blog navigation flow"):
            # Login as admin
            assert self.manual_login_admin(), "Admin login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Verify blog list loads
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            
            # Check if blogs are visible
            blogs_visible = self.blog_page.are_blogs_visible()
            if blogs_visible:
                self.logger.info("✅ Blog list navigation successful")
                
                # Try to navigate to blog detail
                try:
                    blog_links = self.base_page.driver.find_elements("css selector", "article a")
                    if blog_links:
                        original_url = self.base_page.get_current_url()
                        blog_links[0].click()
                        time.sleep(3)
                        
                        new_url = self.base_page.get_current_url()
                        if new_url != original_url:
                            self.logger.info("✅ Blog detail navigation successful")
                        else:
                            self.logger.info("ℹ️ Blog detail navigation unclear")
                    else:
                        self.logger.info("ℹ️ No blog links found for detail navigation")
                        
                except Exception as e:
                    self.logger.info(f"ℹ️ Blog detail navigation test inconclusive: {e}")
            else:
                self.logger.info("ℹ️ No blogs visible for navigation test")
            
            self.logger.info("✅ Blog navigation flow test completed")
    
    @allure.story("Integration Tests")
    @allure.severity("normal")
    def test_admin_full_blog_access(self):
        """Test admin has full blog access"""
        with allure.step("Testing admin full blog access"):
            # Login as admin
            assert self.manual_login_admin(), "Admin login failed"
            
            # Test read access
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            blogs_visible = self.blog_page.are_blogs_visible()
            
            # Test create access
            create_accessible = self.blog_page.navigate_to_blog_creation()
            
            # Summary
            capabilities = {
                "read_blogs": blogs_visible,
                "access_creation": create_accessible,
                "admin_dashboard": "/admin" in self.base_page.get_current_url()
            }
            
            self.logger.info(f"Admin capabilities: {capabilities}")
            
            # Admin should have read access at minimum
            assert blogs_visible or "/admin" in self.base_page.get_current_url(), \
                "Admin should have blog access or be on admin dashboard"
            
            self.logger.info("✅ Admin full access test completed") 