"""
Test Specific Blog Detail
Test blog detail page với blog ID cụ thể từ user
"""

import pytest
import allure
from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from pages.login_page import LoginPage
from utils.logger import get_logger
from utils.data_helpers import get_test_data_manager


@allure.epic("GenCare Blog System")
@allure.feature("Specific Blog Detail")
class TestSpecificBlogDetail:
    """Test blog detail với ID cụ thể"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.test_data_manager = get_test_data_manager()
        cls.logger.info("=== Specific Blog Detail Test Suite Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🔍 Starting test: {method.__name__}")
    
    def teardown_method(self, method):
        """Cleanup after each test method"""
        try:
            if hasattr(self, 'login_page'):
                self.login_page.logout()
            self.logger.info(f"✅ Test completed: {method.__name__}")
        except Exception as e:
            self.logger.warning(f"Cleanup warning in {method.__name__}: {str(e)}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.blog_page = BlogPageNew(driver)
        self.login_page = LoginPage(driver)
    
    def login_as_role(self, role):
        """Helper method to login as specific role"""
        user_data = self.test_data_manager.get_user_data(role)
        if not user_data:
            self.logger.error(f"No user data found for role: {role}")
            return False
        
        return self.login_page.login_with_credentials(
            user_data.get('username', ''), 
            user_data.get('password', '')
        )
    
    @allure.story("Direct Blog Detail Access")
    @allure.severity("critical")
    def test_access_specific_blog_detail_as_guest(self):
        """Test truy cập blog detail cụ thể với ID từ user"""
        with allure.step("Testing direct access to specific blog detail"):
            
            # Blog ID cụ thể từ user
            blog_id = "684c6f3c2ad340bafd4e5370"
            blog_url = f"/blogs/{blog_id}"
            
            self.logger.info(f"Testing blog detail access: {blog_url}")
            
            # Navigate directly to blog detail
            self.base_page.navigate_to(blog_url)
            self.base_page.wait_for_page_load()
            
            # Check current URL
            current_url = self.base_page.get_current_url()
            self.logger.info(f"Current URL: {current_url}")
            
            # Check if we're on the correct blog detail page
            if blog_id in current_url:
                self.logger.info("✅ Successfully navigated to blog detail page")
            else:
                self.logger.warning(f"⚠️ URL does not contain blog ID: {blog_id}")
            
            # Check page title
            page_title = self.base_page.get_page_title()
            self.logger.info(f"Page title: {page_title}")
            
            # Check if blog detail content loads
            detail_loaded = self.check_blog_detail_content()
            
            if detail_loaded:
                self.logger.info("✅ Blog detail content loaded successfully")
                
                # Get blog title if available
                blog_title = self.get_blog_title()
                if blog_title:
                    self.logger.info(f"Blog title: {blog_title}")
                
                # Check for blog content
                blog_content = self.get_blog_content_preview()
                if blog_content:
                    self.logger.info(f"Blog content preview: {blog_content[:100]}...")
                
                # Check for author info
                author_info = self.get_author_info()
                if author_info:
                    self.logger.info(f"Author info: {author_info}")
                
                # Take screenshot for verification
                self.base_page.driver.save_screenshot("reports/screenshots/specific_blog_detail_success.png")
                
                return True
            else:
                self.logger.error("❌ Blog detail content did not load")
                
                # Check for error messages
                self.check_for_errors()
                
                # Take screenshot for debugging
                self.base_page.driver.save_screenshot("reports/screenshots/specific_blog_detail_failed.png")
                
                return False
    
    @allure.story("Authenticated Blog Detail Access")
    @allure.severity("high")
    @pytest.mark.parametrize("role", ["customer", "consultant", "staff", "admin"])
    def test_access_specific_blog_detail_authenticated(self, role):
        """Test truy cập blog detail với authentication"""
        with allure.step(f"Testing {role} access to specific blog detail"):
            
            # Login as specified role
            login_success = self.login_as_role(role)
            if not login_success:
                self.logger.error(f"Failed to login as {role}")
                return
            
            self.logger.info(f"✅ Successfully logged in as {role}")
            
            # Blog ID cụ thể từ user
            blog_id = "684c6f3c2ad340bafd4e5370"
            blog_url = f"/blogs/{blog_id}"
            
            # Navigate to blog detail
            self.base_page.navigate_to(blog_url)
            self.base_page.wait_for_page_load()
            
            # Check if blog detail loads
            detail_loaded = self.check_blog_detail_content()
            
            if detail_loaded:
                self.logger.info(f"✅ {role} can access blog detail successfully")
                
                # Check for role-specific features
                self.check_role_specific_features(role)
                
            else:
                self.logger.error(f"❌ {role} cannot access blog detail")
    
    def check_blog_detail_content(self):
        """Check if blog detail content is loaded"""
        try:
            # Look for blog detail indicators
            detail_indicators = [
                ("css selector", "article"),
                ("tag name", "h1"),
                ("tag name", "h2"),
                ("css selector", ".blog-title"),
                ("css selector", ".blog-content"),
                ("css selector", "[data-testid='blog-detail']"),
                ("css selector", ".content"),
                ("xpath", "//*[contains(@class, 'blog')]"),
                ("xpath", "//*[contains(@class, 'article')]"),
                ("xpath", "//*[contains(@class, 'post')]")
            ]
            
            for selector in detail_indicators:
                if self.base_page.is_element_visible(selector, timeout=3):
                    self.logger.info(f"Found blog detail indicator: {selector}")
                    return True
            
            return False
        except Exception as e:
            self.logger.error(f"Error checking blog detail content: {e}")
            return False
    
    def get_blog_title(self):
        """Get blog title from page"""
        try:
            title_selectors = [
                ("tag name", "h1"),
                ("css selector", ".blog-title"),
                ("css selector", "[data-testid='blog-title']"),
                ("css selector", ".title"),
                ("tag name", "h2")
            ]
            
            for selector in title_selectors:
                try:
                    element = self.base_page.driver.find_element(*selector)
                    if element and element.text.strip():
                        return element.text.strip()
                except:
                    continue
            
            return None
        except Exception as e:
            self.logger.error(f"Error getting blog title: {e}")
            return None
    
    def get_blog_content_preview(self):
        """Get blog content preview"""
        try:
            content_selectors = [
                ("css selector", ".blog-content"),
                ("css selector", ".content"),
                ("css selector", "[data-testid='blog-content']"),
                ("css selector", "article div"),
                ("css selector", "main div")
            ]
            
            for selector in content_selectors:
                try:
                    element = self.base_page.driver.find_element(*selector)
                    if element and element.text.strip():
                        return element.text.strip()
                except:
                    continue
            
            return None
        except Exception as e:
            self.logger.error(f"Error getting blog content: {e}")
            return None
    
    def get_author_info(self):
        """Get author information"""
        try:
            author_selectors = [
                ("css selector", ".author"),
                ("css selector", ".author-name"),
                ("css selector", "[data-testid='author']"),
                ("xpath", "//*[contains(text(), 'Tác giả')]"),
                ("xpath", "//*[contains(text(), 'Author')]")
            ]
            
            for selector in author_selectors:
                try:
                    element = self.base_page.driver.find_element(*selector)
                    if element and element.text.strip():
                        return element.text.strip()
                except:
                    continue
            
            return None
        except Exception as e:
            self.logger.error(f"Error getting author info: {e}")
            return None
    
    def check_for_errors(self):
        """Check for error messages on page"""
        try:
            # Check page source for error indicators
            page_source = self.base_page.driver.page_source
            
            error_messages = [
                "404", "Not Found", "Không tìm thấy",
                "Error", "Lỗi", "Failed", "Thất bại",
                "Network Error", "Connection Error"
            ]
            
            found_errors = []
            for error in error_messages:
                if error in page_source:
                    found_errors.append(error)
            
            if found_errors:
                self.logger.error(f"Error messages found: {found_errors}")
            else:
                self.logger.info("No error messages found")
                
        except Exception as e:
            self.logger.error(f"Error checking for errors: {e}")
    
    def check_role_specific_features(self, role):
        """Check for role-specific features in blog detail"""
        try:
            if role in ["consultant", "admin"]:
                # Should see edit/delete buttons for own blogs
                edit_buttons = self.base_page.driver.find_elements("css selector", "button[data-testid='edit-blog'], .edit-btn, a[href*='edit']")
                if edit_buttons:
                    self.logger.info(f"✅ {role} can see edit functionality")
                else:
                    self.logger.info(f"ℹ️ {role} cannot see edit functionality (may not be author)")
            
            if role in ["customer", "consultant", "staff", "admin"]:
                # Should see comment functionality
                comment_sections = self.base_page.driver.find_elements("css selector", ".comment, .comments, [data-testid='comments']")
                if comment_sections:
                    self.logger.info(f"✅ {role} can see comment functionality")
                else:
                    self.logger.info(f"ℹ️ {role} cannot see comment functionality")
                    
        except Exception as e:
            self.logger.error(f"Error checking role-specific features: {e}")
    
    @allure.story("Blog List to Detail Navigation")
    @allure.severity("normal")
    def test_blog_list_navigation_if_available(self):
        """Test navigation from blog list if blogs are available"""
        with allure.step("Testing blog list to detail navigation"):
            
            # First check if blog list has any content
            self.base_page.navigate_to("/blogs")
            self.base_page.wait_for_page_load()
            
            # Look for any clickable blog elements
            clickable_selectors = [
                ("css selector", ".blog-card"),
                ("css selector", ".blog-item"),
                ("css selector", "article"),
                ("css selector", "a[href*='/blogs/']"),
                ("css selector", "div[onclick*='blog']")
            ]
            
            blog_links_found = False
            
            for selector in clickable_selectors:
                try:
                    elements = self.base_page.driver.find_elements(*selector)
                    if elements:
                        self.logger.info(f"Found {len(elements)} clickable blog elements: {selector}")
                        blog_links_found = True
                        
                        # Try to click first element
                        try:
                            elements[0].click()
                            self.base_page.wait_for_page_load()
                            
                            current_url = self.base_page.get_current_url()
                            if "/blogs/" in current_url and current_url != "http://localhost:5173/blogs":
                                self.logger.info(f"✅ Successfully navigated to: {current_url}")
                                
                                # Check if detail page loads
                                detail_loaded = self.check_blog_detail_content()
                                if detail_loaded:
                                    self.logger.info("✅ Blog detail page loaded from navigation")
                                else:
                                    self.logger.warning("⚠️ Blog detail page did not load properly")
                                
                                return True
                        except Exception as e:
                            self.logger.warning(f"Could not click element: {e}")
                except:
                    continue
            
            if not blog_links_found:
                self.logger.warning("No clickable blog elements found on blog list page")
                
                # Take screenshot to see what's actually on the page
                self.base_page.driver.save_screenshot("reports/screenshots/blog_list_no_content.png")
                
                # Check if there's a loading state or empty state
                page_source = self.base_page.driver.page_source
                if "loading" in page_source.lower() or "đang tải" in page_source.lower():
                    self.logger.info("Page appears to be in loading state")
                elif "empty" in page_source.lower() or "trống" in page_source.lower():
                    self.logger.info("Page appears to show empty state")
                else:
                    self.logger.info("Page loaded but no recognizable blog content found")
            
            return False 