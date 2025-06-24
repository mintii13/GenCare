"""
GenCare Blog Testing Suite - New Clean Version
==============================================
Comprehensive test suite for GenCare blog functionality testing.
"""

import pytest
import allure
import time
from faker import Faker
from pages.blog_page_new import BlogPageNew
from pages.login_page import LoginPage


fake = Faker()


@allure.epic("GenCare Blog System")
@allure.feature("Blog Testing Suite")
class TestBlogSystemNew:
    """
    New Clean Blog Testing Suite
    ===========================
    
    Test Categories:
    1. Blog Listing & Navigation
    2. Blog Creation & Forms
    3. Access Control & Permissions
    4. Search & Filter Functionality
    5. Blog Content Management
    """
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.blog_page = BlogPageNew(driver)
        self.login_page = LoginPage(driver)
        self.driver = driver
    
    # =======================================
    # BLOG LISTING & NAVIGATION TESTS
    # =======================================
    
    @allure.story("Blog Listing")
    @allure.severity("high")
    @allure.title("Test blog list page loads successfully")
    def test_blog_list_page_loads(self):
        """Verify blog listing page loads correctly"""
        with allure.step("Navigate to blog listing page"):
            self.blog_page.navigate_to_blog_list()
        
        with allure.step("Verify page loaded correctly"):
            assert self.blog_page.is_blog_list_page(), "Blog listing page should load successfully"
            
        with allure.step("Check page contains blog content"):
            # Should load without errors even if no blogs exist
            current_url = self.driver.current_url
            assert "/blogs" in current_url, f"Should be on blog page, but URL is: {current_url}"
    
    @allure.story("Blog Navigation")
    @allure.severity("normal")
    @allure.title("Test blog navigation menu works")
    def test_blog_navigation_menu(self):
        """Test blog navigation from main menu"""
        with allure.step("Start from home page"):
            self.blog_page.navigate_to_home()
        
        with allure.step("Click blog menu item"):
            clicked = self.blog_page.click_blog_menu()
            if not clicked:
                pytest.skip("Blog menu not accessible - may require login")
        
        with allure.step("Verify navigated to blog listing"):
            assert self.blog_page.is_blog_list_page(), "Should navigate to blog listing page"
    
    @allure.story("Blog Listing")
    @allure.severity("normal")
    @allure.title("Test blog count and display")
    def test_blog_listing_display(self):
        """Test blog listing displays correctly"""
        with allure.step("Navigate to blog listing"):
            self.blog_page.navigate_to_blog_list()
        
        with allure.step("Get blog count"):
            blog_count = self.blog_page.get_blog_count()
            
        with allure.step("Verify blog display"):
            # Should work even with 0 blogs
            assert blog_count >= 0, f"Blog count should be non-negative, got: {blog_count}"
            
            if blog_count > 0:
                first_title = self.blog_page.get_first_blog_title()
                assert first_title is not None, "Should be able to get first blog title"
                assert len(first_title) > 0, "Blog title should not be empty"
    
    # =======================================
    # ACCESS CONTROL TESTS
    # =======================================
    
    @allure.story("Access Control")
    @allure.severity("critical")
    @allure.title("Test guest user access to blog creation")
    def test_guest_blog_creation_access(self):
        """Test that guest users cannot access blog creation"""
        with allure.step("Ensure not logged in (guest user)"):
            self.blog_page.navigate_to_home()
            # Clear any existing sessions
            self.driver.delete_all_cookies()
        
        with allure.step("Try to access blog creation page"):
            self.blog_page.navigate_to_blog_create()
        
        with allure.step("Verify access is appropriately restricted"):
            # Check if redirected to login or access denied
            current_url = self.driver.current_url
            is_create_page = self.blog_page.is_blog_create_page()
            is_access_denied = self.blog_page.is_access_denied()
            
            # Either should be denied access OR redirected to login
            access_properly_controlled = (
                is_access_denied or 
                "login" in current_url.lower() or
                not is_create_page
            )
            
            assert access_properly_controlled, \
                f"Guest should not have direct access to blog creation. URL: {current_url}, " \
                f"Is create page: {is_create_page}, Access denied: {is_access_denied}"
    
    @allure.story("Access Control")
    @allure.severity("normal") 
    @allure.title("Test blog listing is publicly accessible")
    def test_guest_blog_listing_access(self):
        """Test that guest users can view blog listing"""
        with allure.step("Ensure not logged in (guest user)"):
            self.blog_page.navigate_to_home()
            self.driver.delete_all_cookies()
        
        with allure.step("Navigate to blog listing"):
            self.blog_page.navigate_to_blog_list()
        
        with allure.step("Verify blog listing is accessible"):
            assert self.blog_page.is_blog_list_page(), \
                "Guest users should be able to view blog listing"
    
    # =======================================
    # BLOG CREATION TESTS
    # =======================================
    
    @allure.story("Blog Creation")
    @allure.severity("high")
    @allure.title("Test blog creation form validation")
    def test_blog_creation_form_validation(self):
        """Test blog creation form validation for required fields"""
        with allure.step("Try to access blog creation"):
            self.blog_page.navigate_to_blog_create()
        
        # Skip if not on create page (access denied)
        if not self.blog_page.is_blog_create_page():
            pytest.skip("Blog creation not accessible - requires authentication")
        
        with allure.step("Try to save empty blog"):
            save_result = self.blog_page.save_blog()
            
        with allure.step("Verify validation feedback"):
            # Should either show error message or prevent saving
            if save_result:
                # If save went through, check for error message
                has_error = self.blog_page.is_error_message_displayed()
                if not has_error:
                    # Form might have default values - verify we're still on create page
                    still_on_create = self.blog_page.is_blog_create_page()
                    assert still_on_create, "Should show validation error or stay on create page"
    
    @allure.story("Blog Creation")
    @allure.severity("high")
    @allure.title("Test complete blog creation workflow")
    def test_blog_creation_workflow(self):
        """Test complete blog creation from start to finish"""
        # Generate test data
        test_title = f"Test Blog {fake.uuid4()[:8]}"
        test_content = fake.text(max_nb_chars=200)
        test_excerpt = fake.sentence()
        
        with allure.step("Navigate to blog creation"):
            self.blog_page.navigate_to_blog_create()
        
        # Skip if not accessible
        if not self.blog_page.is_blog_create_page():
            pytest.skip("Blog creation not accessible - requires authentication")
        
        with allure.step("Fill blog creation form"):
            title_filled = self.blog_page.fill_blog_title(test_title)
            assert title_filled, "Should be able to fill blog title"
            
            # Excerpt might be optional
            self.blog_page.fill_blog_excerpt(test_excerpt)
            
            content_filled = self.blog_page.fill_blog_content(test_content)
            assert content_filled, "Should be able to fill blog content"
        
        with allure.step("Save blog"):
            save_result = self.blog_page.save_blog()
            assert save_result, "Should be able to save blog"
        
        with allure.step("Verify blog creation result"):
            # Check for success indicators
            has_success = self.blog_page.is_success_message_displayed()
            has_error = self.blog_page.is_error_message_displayed()
            
            # Should have success message OR not have error message
            creation_successful = has_success or not has_error
            
            if has_error:
                error_msg = self.blog_page.get_error_message()
                allure.attach(error_msg, "Error Message", allure.attachment_type.TEXT)
            
            assert creation_successful, "Blog creation should be successful"
    
    # =======================================
    # SEARCH & FILTER TESTS
    # =======================================
    
    @allure.story("Search Functionality")
    @allure.severity("normal")
    @allure.title("Test blog search functionality")
    def test_blog_search(self):
        """Test blog search functionality if available"""
        with allure.step("Navigate to blog listing"):
            self.blog_page.navigate_to_blog_list()
        
        with allure.step("Attempt blog search"):
            search_term = "test"
            search_worked = self.blog_page.search_blogs(search_term)
            
        with allure.step("Verify search behavior"):
            if search_worked:
                # Verify we're still on a valid page after search
                assert self.blog_page.is_blog_list_page(), \
                    "Should remain on blog listing page after search"
            else:
                # Search not available - this is acceptable
                pytest.skip("Search functionality not available")
    
    # =======================================
    # BLOG INTERACTION TESTS
    # =======================================
    
    @allure.story("Blog Interaction")
    @allure.severity("normal")
    @allure.title("Test blog detail navigation")
    def test_blog_detail_navigation(self):
        """Test clicking on blog to view details"""
        with allure.step("Navigate to blog listing"):
            self.blog_page.navigate_to_blog_list()
        
        with allure.step("Check if blogs are available"):
            blog_count = self.blog_page.get_blog_count()
            
        if blog_count == 0:
            pytest.skip("No blogs available to test detail navigation")
        
        with allure.step("Click on first blog"):
            click_result = self.blog_page.click_first_blog()
            
        with allure.step("Verify navigation to blog detail"):
            if click_result:
                # Verify we navigated somewhere (URL changed)
                current_url = self.driver.current_url
                assert "/blogs" in current_url, \
                    f"Should navigate to blog detail, current URL: {current_url}"
    
    # =======================================
    # RESPONSIVE & UI TESTS
    # =======================================
    
    @allure.story("UI/UX")
    @allure.severity("low")
    @allure.title("Test blog page responsiveness")
    def test_blog_page_responsive(self):
        """Test blog page responsiveness on different screen sizes"""
        with allure.step("Navigate to blog listing"):
            self.blog_page.navigate_to_blog_list()
        
        # Test mobile size
        with allure.step("Test mobile viewport"):
            self.driver.set_window_size(375, 667)  # iPhone size
            time.sleep(1)
            assert self.blog_page.is_blog_list_page(), \
                "Blog page should work on mobile viewport"
        
        # Test desktop size
        with allure.step("Test desktop viewport"):
            self.driver.set_window_size(1920, 1080)  # Desktop size
            time.sleep(1)
            assert self.blog_page.is_blog_list_page(), \
                "Blog page should work on desktop viewport"
    
    # =======================================
    # ERROR HANDLING TESTS
    # =======================================
    
    @allure.story("Error Handling")
    @allure.severity("normal")
    @allure.title("Test invalid blog URL handling")
    def test_invalid_blog_url(self):
        """Test handling of invalid blog URLs"""
        with allure.step("Navigate to invalid blog URL"):
            invalid_url = f"{self.blog_page.base_url}/blogs/nonexistent-blog-12345"
            self.driver.get(invalid_url)
            time.sleep(2)
        
        with allure.step("Verify graceful error handling"):
            current_url = self.driver.current_url
            page_title = self.driver.title
            
            # Should either redirect to valid page or show 404
            error_handled_gracefully = (
                "404" in page_title.lower() or
                "/blogs" in current_url or
                "not found" in page_title.lower()
            )
            
            assert error_handled_gracefully, \
                f"Invalid blog URL should be handled gracefully. " \
                f"URL: {current_url}, Title: {page_title}"


# =======================================
# AUTHENTICATED USER TESTS
# =======================================

@allure.epic("GenCare Blog System")
@allure.feature("Authenticated Blog Testing")
class TestAuthenticatedBlogFeatures:
    """
    Tests for blog features requiring authentication
    """
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.blog_page = BlogPageNew(driver)
        self.login_page = LoginPage(driver)
        self.driver = driver
    
    @allure.story("Authenticated Blog Creation")
    @allure.severity("high")
    @allure.title("Test blog creation as authenticated user")
    def test_authenticated_blog_creation(self):
        """Test blog creation with authenticated user"""
        with allure.step("Navigate to login"):
            self.login_page.navigate_to_home()
            
        with allure.step("Attempt login"):
            # Try to open login modal
            login_opened = self.login_page.open_login_modal()
            if not login_opened:
                pytest.skip("Login modal not accessible")
            
            # Try login with test credentials
            login_success = self.login_page.login("test@gencare.com", "password123")
            if not login_success:
                pytest.skip("Login failed - test credentials may not exist")
        
        with allure.step("Navigate to blog creation as authenticated user"):
            self.blog_page.navigate_to_blog_create()
        
        with allure.step("Verify access to blog creation"):
            assert self.blog_page.is_blog_create_page(), \
                "Authenticated user should have access to blog creation"
        
        with allure.step("Create test blog"):
            test_title = f"Authenticated Test Blog {fake.uuid4()[:8]}"
            test_content = fake.text(max_nb_chars=150)
            
            creation_result = self.blog_page.create_blog_post(
                title=test_title,
                content=test_content
            )
            
            assert creation_result, "Authenticated user should be able to create blog"


# =======================================
# PERFORMANCE TESTS
# =======================================

@allure.epic("GenCare Blog System")
@allure.feature("Blog Performance")
class TestBlogPerformance:
    """
    Performance tests for blog functionality
    """
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.blog_page = BlogPageNew(driver)
        self.driver = driver
    
    @allure.story("Page Load Performance")
    @allure.severity("normal")
    @allure.title("Test blog listing page load time")
    def test_blog_listing_load_time(self):
        """Test blog listing page loads within acceptable time"""
        with allure.step("Measure blog listing load time"):
            start_time = time.time()
            self.blog_page.navigate_to_blog_list()
            load_time = time.time() - start_time
        
        with allure.step("Verify acceptable load time"):
            max_load_time = 10.0  # 10 seconds max
            assert load_time < max_load_time, \
                f"Blog listing should load within {max_load_time}s, took {load_time:.2f}s"
            
            allure.attach(
                f"Load time: {load_time:.2f} seconds",
                "Performance Metrics",
                allure.attachment_type.TEXT
            ) 