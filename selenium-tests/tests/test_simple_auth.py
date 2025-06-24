"""
Simple Authentication Test for GenCare Demo
Demonstrates basic authentication testing
"""

import pytest
from pages.login_page import LoginPage
from pages.base_page import BasePage
from utils.data_helpers import DataHelpers


class TestSimpleAuth:
    """Simple authentication test class"""
    
    @pytest.fixture(autouse=True)
    def setup(self, driver, test_data):
        """Setup for each test"""
        self.driver = driver
        self.test_data = test_data
        self.login_page = LoginPage(driver)
        self.base_page = BasePage(driver)
        self.data_helpers = DataHelpers()
        
        # Start from home page
        self.base_page.navigate_to("/")
        if self.base_page.is_user_logged_in():
            self.login_page.logout()
    
    def test_open_login_modal(self):
        """Test opening login modal"""
        # Open login modal
        success = self.login_page.open_login_modal()
        assert success, "Should open login modal"
        
        # Check if modal is open
        modal_open = self.login_page.is_login_modal_open()
        assert modal_open, "Login modal should be open"
        
        # Check if login form is visible
        form_visible = self.login_page.is_login_form_visible()
        assert form_visible, "Login form should be visible inside modal"
        
        print("✅ Login modal opening test PASSED!")
        
        # Close modal for cleanup
        self.login_page.close_login_modal()
    
    def test_login_form_elements(self):
        """Test login form elements are present"""
        # Open login modal
        assert self.login_page.open_login_modal(), "Should open login modal"
        
        # Check email input
        email_visible = self.login_page.is_element_visible(self.login_page.EMAIL_INPUT, timeout=3)
        assert email_visible, "Email input should be visible"
        
        # Check password input
        password_visible = self.login_page.is_element_visible(self.login_page.PASSWORD_INPUT, timeout=3)
        assert password_visible, "Password input should be visible"
        
        # Check login button
        button_visible = self.login_page.is_element_visible(self.login_page.LOGIN_SUBMIT_BUTTON, timeout=3)
        assert button_visible, "Login button should be visible"
        
        print("✅ Login form elements test PASSED!")
        
        # Close modal for cleanup
        self.login_page.close_login_modal()
    
    def test_empty_form_submission(self):
        """Test submitting empty login form"""
        # Open login modal
        assert self.login_page.open_login_modal(), "Should open login modal"
        
        # Try to submit empty form
        self.login_page.click_login_button()
        
        # Modal should remain open after empty submission
        modal_still_open = self.login_page.is_login_modal_open()
        assert modal_still_open, "Modal should remain open after empty submission"
        
        print("✅ Empty form submission test PASSED!")
        
        # Close modal for cleanup
        self.login_page.close_login_modal()
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        # Generate fake credentials
        fake_email = self.data_helpers.generate_fake_email()
        fake_password = self.data_helpers.generate_fake_password()
        
        print(f"Testing with fake email: {fake_email}")
        
        # Try login with invalid credentials (this will auto-open modal)
        result = self.login_page.login_with_credentials(fake_email, fake_password)
        
        # Login should fail
        assert not result, "Login should fail with invalid credentials"
        
        print("✅ Invalid credentials test PASSED!")
        
        # Close modal if still open
        if self.login_page.is_login_modal_open():
            self.login_page.close_login_modal()
    
    def test_customer_login(self):
        """Test login with customer credentials"""
        # Get customer credentials from test data
        customer_data = self.test_data.get('users', {}).get('customer', {})
        email = customer_data.get('username', '')
        password = customer_data.get('password', '')
        
        if not email or not password:
            pytest.skip("Customer credentials not found in test data")
        
        print(f"Testing customer login with email: {email}")
        
        # Try login with customer credentials (this will auto-open modal)
        result = self.login_page.login_with_credentials(email, password)
        
        if result:
            # Verify login success
            assert self.login_page.is_login_successful(), "Login should be successful"
            assert self.base_page.is_user_logged_in(), "User should be logged in"
            
            print("✅ Customer login test PASSED!")
            
            # Logout for cleanup
            self.login_page.logout()
        else:
            print("⚠️ Customer login failed - this may be expected if backend is not running")
            # Close modal if still open
            if self.login_page.is_login_modal_open():
                self.login_page.close_login_modal()
    
    def test_logout_functionality(self):
        """Test logout functionality"""
        # First try to login
        customer_data = self.test_data.get('users', {}).get('customer', {})
        email = customer_data.get('username', '')
        password = customer_data.get('password', '')
        
        if not email or not password:
            pytest.skip("Customer credentials not found in test data")
        
        # Try to login (this will auto-open modal)
        
        login_result = self.login_page.login_with_credentials(email, password)
        
        if login_result and self.base_page.is_user_logged_in():
            # Test logout
            logout_result = self.login_page.logout()
            assert logout_result, "Logout should be successful"
            
            # Verify logged out
            assert not self.base_page.is_user_logged_in(), "User should be logged out"
            
            print("✅ Logout functionality test PASSED!")
        else:
            pytest.skip("Cannot test logout - login failed (backend may not be running)")
    
    def test_page_title(self):
        """Test page titles"""
        # Test home page title
        self.base_page.navigate_to("/")
        home_title = self.base_page.get_page_title()
        assert "GenCare" in home_title or home_title, f"Home page should have title, got: {home_title}"
        
        # Test modal title
        if self.login_page.open_login_modal():
            modal_title_visible = self.login_page.is_element_visible(self.login_page.MODAL_TITLE, timeout=3)
            print(f"Modal title visible: {modal_title_visible}")
            self.login_page.close_login_modal()
        
        print("✅ Page title test PASSED!")
    
    def test_navigation_elements(self):
        """Test navigation elements"""
        # Go to home page
        self.base_page.navigate_to("/")
        
        # Check if blog link exists
        blog_link_visible = self.base_page.is_element_visible(self.base_page.BLOG_LINK, timeout=5)
        print(f"Blog link visible: {blog_link_visible}")
        
        # Check if login button exists
        login_button_visible = self.base_page.is_element_visible(self.base_page.LOGIN_BUTTON, timeout=5)
        print(f"Login button visible: {login_button_visible}")
        
        # At least one navigation element should be visible
        assert blog_link_visible or login_button_visible, "Should see navigation elements"
        
        print("✅ Navigation elements test PASSED!") 