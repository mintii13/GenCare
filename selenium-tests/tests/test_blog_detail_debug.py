"""
Debug Blog Detail Functionality
Test để kiểm tra xem vấn đề blog detail ở đâu
"""

import pytest
import allure
from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from pages.login_page import LoginPage
from utils.logger import get_logger
from utils.data_helpers import get_test_data_manager


@allure.epic("GenCare Blog System")
@allure.feature("Blog Detail Debug")
class TestBlogDetailDebug:
    """Debug blog detail functionality"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.test_data_manager = get_test_data_manager()
        cls.logger.info("=== Blog Detail Debug Test Suite Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🔍 Starting debug test: {method.__name__}")
    
    def teardown_method(self, method):
        """Cleanup after each test method"""
        try:
            if hasattr(self, 'login_page'):
                self.login_page.logout()
            self.logger.info(f"✅ Debug test completed: {method.__name__}")
        except Exception as e:
            self.logger.warning(f"Cleanup warning in {method.__name__}: {str(e)}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.blog_page = BlogPageNew(driver)
        self.login_page = LoginPage(driver)
    
    @allure.story("Debug Blog Detail")
    @allure.severity("critical")
    def test_debug_blog_list_to_detail_flow(self):
        """Debug complete flow from blog list to detail"""
        with allure.step("Testing blog list to detail navigation"):
            
            # Step 1: Navigate to blog list
            self.logger.info("Step 1: Navigate to blog list")
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Step 2: Check if blog list loads
            self.logger.info("Step 2: Check if blog list loads")
            list_loaded = self.blog_page.is_blog_list_loaded()
            self.logger.info(f"Blog list loaded: {list_loaded}")
            
            if not list_loaded:
                # Take screenshot to debug
                self.blog_page.take_screenshot("blog_list_not_loaded")
                
                # Check current URL
                current_url = self.base_page.get_current_url()
                self.logger.info(f"Current URL: {current_url}")
                
                # Check page title
                page_title = self.base_page.get_page_title()
                self.logger.info(f"Page title: {page_title}")
                
                # Check for any error messages
                page_source = self.base_page.driver.page_source
                if "Error" in page_source or "404" in page_source:
                    self.logger.error("Page contains error messages")
                
                # Try alternative blog list check
                blogs_visible = self.blog_page.are_blogs_visible()
                self.logger.info(f"Blogs visible (alternative check): {blogs_visible}")
                
                # If still no blogs, maybe the app is not running or no blog data
                self.logger.warning("Blog list did not load properly - may be app issue")
            
            # Step 3: Try to find first blog
            self.logger.info("Step 3: Look for available blogs")
            blogs_visible = self.blog_page.are_blogs_visible()
            
            if blogs_visible:
                # Try to get first blog info
                first_blog_title = self.blog_page.get_first_blog_title()
                self.logger.info(f"First blog title: {first_blog_title}")
                
                # Try to click first blog
                self.logger.info("Step 4: Try to click first blog")
                click_success = self.blog_page.click_first_blog()
                
                if click_success:
                    # Wait for navigation
                    self.base_page.wait_for_page_load()
                    
                    # Check if we're on detail page
                    current_url = self.base_page.get_current_url()
                    self.logger.info(f"After click URL: {current_url}")
                    
                    if "/blogs/" in current_url and len(current_url.split("/blogs/")) > 1:
                        blog_id = current_url.split("/blogs/")[1]
                        self.logger.info(f"Navigated to blog detail page with ID: {blog_id}")
                        
                        # Check if detail page loads
                        detail_loaded = self.check_blog_detail_loaded()
                        self.logger.info(f"Blog detail loaded: {detail_loaded}")
                        
                        if not detail_loaded:
                            self.logger.error("Blog detail page did not load properly")
                            self.blog_page.take_screenshot("blog_detail_not_loaded")
                        else:
                            self.logger.info("✅ Blog detail navigation successful")
                    else:
                        self.logger.error("URL did not change to blog detail format")
                else:
                    self.logger.error("Failed to click first blog")
                    self.blog_page.take_screenshot("click_first_blog_failed")
            else:
                self.logger.warning("No blogs visible on the page")
                self.blog_page.take_screenshot("no_blogs_visible")
    
    def check_blog_detail_loaded(self):
        """Check if blog detail page loaded properly"""
        try:
            # Look for blog detail indicators
            detail_indicators = [
                ("css selector", ".blog-detail, .blog-content, [data-testid='blog-detail']"),
                ("css selector", ".blog-title, h1, [data-testid='blog-detail-title']"),
                ("css selector", "article"),
                ("tag name", "h1"),
                ("tag name", "h2")
            ]
            
            for selector in detail_indicators:
                if self.base_page.is_element_visible(selector, timeout=3):
                    self.logger.info(f"Found blog detail indicator: {selector}")
                    return True
            
            # Check for error messages
            error_indicators = [
                ("css selector", ".error, .alert-danger"),
                ("xpath", "//*[contains(text(), 'Error')]"),
                ("xpath", "//*[contains(text(), '404')]"),
                ("xpath", "//*[contains(text(), 'Not Found')]")
            ]
            
            for selector in error_indicators:
                if self.base_page.is_element_visible(selector, timeout=2):
                    self.logger.error(f"Found error indicator: {selector}")
                    return False
            
            return False
        except Exception as e:
            self.logger.error(f"Error checking blog detail loaded: {e}")
            return False
    
    @allure.story("Debug Blog API")
    @allure.severity("high") 
    def test_debug_blog_api_direct_access(self):
        """Debug direct access to blog detail via URL"""
        with allure.step("Testing direct blog detail access"):
            
            # Try common blog IDs that might exist
            test_blog_ids = [
                "123456789012345678901234",  # 24 char ObjectId format
                "000000000000000000000001",  # Simple test ID
                "507f1f77bcf86cd799439011"   # Sample ObjectId
            ]
            
            for blog_id in test_blog_ids:
                self.logger.info(f"Testing direct access to blog ID: {blog_id}")
                
                # Navigate directly to blog detail
                blog_detail_url = f"/blogs/{blog_id}"
                self.base_page.navigate_to(blog_detail_url)
                self.base_page.wait_for_page_load()
                
                # Check current URL
                current_url = self.base_page.get_current_url()
                self.logger.info(f"Current URL after navigation: {current_url}")
                
                # Check page content
                detail_loaded = self.check_blog_detail_loaded()
                self.logger.info(f"Blog detail loaded for {blog_id}: {detail_loaded}")
                
                # Take screenshot for debugging
                self.blog_page.take_screenshot(f"blog_detail_direct_{blog_id}")
                
                if detail_loaded:
                    self.logger.info(f"✅ Successfully loaded blog detail for ID: {blog_id}")
                    break
                else:
                    self.logger.warning(f"Failed to load blog detail for ID: {blog_id}")
    
    @allure.story("Debug Frontend/Backend Connection")
    @allure.severity("critical")
    def test_debug_frontend_backend_connection(self):
        """Debug if frontend can connect to backend"""
        with allure.step("Testing frontend-backend connection"):
            
            # Navigate to homepage first
            self.base_page.navigate_to("/")
            self.base_page.wait_for_page_load()
            
            # Check if page loads
            page_title = self.base_page.get_page_title()
            self.logger.info(f"Homepage title: {page_title}")
            
            # Try to navigate to blog list
            self.base_page.navigate_to("/blogs")
            self.base_page.wait_for_page_load()
            
            # Check for network errors in console (if possible)
            try:
                # Get browser logs
                logs = self.base_page.driver.get_log('browser')
                for log in logs:
                    if log['level'] == 'SEVERE':
                        self.logger.error(f"Browser error: {log['message']}")
            except Exception:
                self.logger.info("Cannot access browser logs")
            
            # Check page source for specific error messages
            page_source = self.base_page.driver.page_source
            
            error_keywords = [
                "Connection refused",
                "ERR_CONNECTION_REFUSED", 
                "500 Internal Server Error",
                "Cannot connect to",
                "Network Error",
                "fetch failed"
            ]
            
            for keyword in error_keywords:
                if keyword in page_source:
                    self.logger.error(f"Found connection error: {keyword}")
            
            self.logger.info("✅ Frontend-backend connection test completed") 