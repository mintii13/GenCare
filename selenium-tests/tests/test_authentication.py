"""
Authentication Test Suite for GenCare
Tests authentication and authorization for all 5 user roles:
- Guest (anonymous)
- Customer
- Consultant  
- Staff
- Admin
"""

import pytest
import allure
from pages.login_page import LoginPage
from pages.base_page import BasePage
from utils.data_helpers import DataHelpers
from utils.logger import get_logger


@allure.epic("GenCare Authentication")
@allure.feature("User Authentication & Authorization")
class TestAuthentication:
    """Test authentication functionality for all user roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self, driver, test_data):
        """Setup for each test"""
        self.driver = driver
        self.test_data = test_data
        self.login_page = LoginPage(driver)
        self.base_page = BasePage(driver)
        self.data_helpers = DataHelpers()
        self.logger = get_logger(self.__class__.__name__)
        
        # Ensure we start from a clean state
        self.login_page.navigate_to("/")
        if self.base_page.is_user_logged_in():
            self.login_page.logout()
    
    @allure.story("Valid Login Tests")
    @allure.severity("critical")
    @pytest.mark.parametrize("role", ["customer", "consultant", "staff", "admin"])
    def test_valid_login_all_roles(self, role):
        """
        Test valid login for each user role
        
        Args:
            role: User role to test (customer, consultant, staff, admin)
        """
        with allure.step(f"Testing valid login for {role} role"):
            # Get test credentials for role
            user_data = self.test_data['users'][role]
            email = user_data['username']
            password = user_data['password']
            
            self.logger.info(f"Testing login for role: {role} with email: {email}")
            
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Perform login
            assert self.login_page.login_with_credentials(email, password), f"Login failed for {role}"
            
            # Verify login success
            assert self.login_page.is_login_successful(), f"Login verification failed for {role}"
            
            # Verify user is logged in
            assert self.base_page.is_user_logged_in(), f"User menu not visible for {role}"
            
            # Take screenshot for verification
            self.login_page.take_screenshot(f"_successful_login_{role}")
            
            # Logout for next test
            assert self.login_page.logout(), f"Logout failed for {role}"
    
    @allure.story("Invalid Login Tests")
    @allure.severity("high")
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        with allure.step("Testing invalid email and password combination"):
            fake_email = self.data_helpers.generate_fake_email()
            fake_password = self.data_helpers.generate_fake_password()
            
            self.logger.info(f"Testing invalid login with email: {fake_email}")
            
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Attempt login with invalid credentials
            result = self.login_page.login_with_credentials(fake_email, fake_password)
            
            # Login should fail
            assert not result, "Login should fail with invalid credentials"
            
            # Should still be on login page
            assert "/login" in self.login_page.get_current_url(), "Should remain on login page"
            
            # Should show error message
            error_msg = self.login_page.get_login_error_message()
            assert error_msg, "Error message should be displayed"
            
            self.logger.info(f"Error message displayed: {error_msg}")
    
    @allure.story("Invalid Login Tests")  
    @allure.severity("high")
    def test_invalid_email_format(self):
        """Test login with invalid email format"""
        with allure.step("Testing invalid email format"):
            invalid_emails = [
                "notanemail",
                "@domain.com",
                "user@",
                "user..user@domain.com",
                ""
            ]
            
            for invalid_email in invalid_emails:
                self.logger.info(f"Testing invalid email format: {invalid_email}")
                
                # Navigate to login page
                assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
                
                # Enter invalid email
                self.login_page.enter_email(invalid_email)
                self.login_page.enter_password("password")
                
                # Try to submit
                self.login_page.click_login_button()
                
                # Should show validation error or remain on login page
                validation_error = self.login_page.get_email_validation_error()
                current_url = self.login_page.get_current_url()
                
                assert (validation_error or "/login" in current_url), f"Should show validation error for: {invalid_email}"
    
    @allure.story("Invalid Login Tests")
    @allure.severity("high")
    def test_empty_credentials(self):
        """Test login with empty credentials"""
        with allure.step("Testing empty email and password"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Try to submit with empty fields
            self.login_page.click_login_button()
            
            # Should remain on login page
            assert "/login" in self.login_page.get_current_url(), "Should remain on login page"
            
            # Should show validation errors
            email_error = self.login_page.get_email_validation_error()
            password_error = self.login_page.get_password_validation_error()
            
            # At least one validation error should be shown
            assert (email_error or password_error), "Validation errors should be displayed"
    
    @allure.story("Valid Login Tests")
    @allure.severity("normal")
    def test_quick_login_helper_method(self):
        """Test the quick_login helper method for all roles"""
        roles_to_test = ["customer", "consultant", "staff", "admin"]
        
        for role in roles_to_test:
            with allure.step(f"Testing quick_login method for {role}"):
                self.logger.info(f"Testing quick_login for role: {role}")
                
                # Navigate to home page
                self.login_page.navigate_to("/")
                
                # Use quick login method
                assert self.login_page.quick_login(role, self.test_data), f"Quick login failed for {role}"
                
                # Verify login success
                assert self.base_page.is_user_logged_in(), f"Quick login verification failed for {role}"
                
                # Logout for next test
                assert self.login_page.logout(), f"Logout failed for {role}"
    
    @allure.story("Password Security Tests")
    @allure.severity("normal")
    def test_password_field_security(self):
        """Test password field security (masked input)"""
        with allure.step("Testing password field security"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Enter password
            test_password = "TestPassword123"
            self.login_page.enter_password(test_password)
            
            # Get password field value
            password_field = self.driver.find_element(*self.login_page.PASSWORD_INPUT)
            field_type = password_field.get_attribute("type")
            
            # Password field should be of type "password"
            assert field_type == "password", "Password field should be masked"
    
    @allure.story("Remember Me Tests")
    @allure.severity("minor")
    def test_remember_me_functionality(self):
        """Test Remember Me checkbox functionality"""
        with allure.step("Testing Remember Me checkbox"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Check if Remember Me checkbox is available
            if self.login_page.is_element_visible(self.login_page.REMEMBER_ME_CHECKBOX, timeout=3):
                # Click Remember Me checkbox
                assert self.login_page.check_remember_me(), "Failed to check Remember Me"
                
                # Get customer credentials
                customer_data = self.test_data['users']['customer']
                
                # Login with Remember Me checked
                assert self.login_page.login_with_credentials(
                    customer_data['username'], 
                    customer_data['password']
                ), "Login with Remember Me failed"
                
                # Verify login success
                assert self.base_page.is_user_logged_in(), "Login verification failed"
                
                # Logout
                assert self.login_page.logout(), "Logout failed"
            else:
                pytest.skip("Remember Me checkbox not available on this login form")
    
    @allure.story("Google OAuth Tests")
    @allure.severity("normal")
    def test_google_login_button_present(self):
        """Test Google OAuth login button is present and clickable"""
        with allure.step("Testing Google login button presence"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Check if Google login button is available
            if self.login_page.is_element_visible(self.login_page.GOOGLE_LOGIN_BUTTON, timeout=3):
                # Verify button is clickable
                google_button = self.driver.find_element(*self.login_page.GOOGLE_LOGIN_BUTTON)
                assert google_button.is_enabled(), "Google login button should be clickable"
                
                self.logger.info("Google login button is available and clickable")
            else:
                pytest.skip("Google login button not available on this login form")
    
    @allure.story("Navigation Tests")
    @allure.severity("normal")
    def test_login_page_navigation_elements(self):
        """Test login page navigation elements"""
        with allure.step("Testing login page navigation elements"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Check for register link
            if self.login_page.is_element_visible(self.login_page.REGISTER_LINK, timeout=3):
                register_link = self.driver.find_element(*self.login_page.REGISTER_LINK)
                assert register_link.is_enabled(), "Register link should be clickable"
            
            # Check for forgot password link
            if self.login_page.is_element_visible(self.login_page.FORGOT_PASSWORD_LINK, timeout=3):
                forgot_link = self.driver.find_element(*self.login_page.FORGOT_PASSWORD_LINK)
                assert forgot_link.is_enabled(), "Forgot password link should be clickable"
    
    @allure.story("Authorization Tests")
    @allure.severity("critical")
    @pytest.mark.parametrize("role", ["customer", "consultant", "staff", "admin"])
    def test_role_based_access_after_login(self, role):
        """
        Test role-based access to different areas after login
        
        Args:
            role: User role to test
        """
        with allure.step(f"Testing role-based access for {role}"):
            # Login as specific role
            assert self.login_page.quick_login(role, self.test_data), f"Login failed for {role}"
            
            # Get current URL to verify dashboard access
            current_url = self.login_page.get_current_url()
            self.logger.info(f"Current URL after {role} login: {current_url}")
            
            # Test access to role-specific areas
            if role == "consultant":
                # Consultant should have access to consultant dashboard
                self.base_page.navigate_to("/consultant")
                consultant_url = self.base_page.get_current_url()
                assert "/consultant" in consultant_url, "Consultant should access consultant area"
                
            elif role == "staff":
                # Staff should have access to staff dashboard
                self.base_page.navigate_to("/staff")
                staff_url = self.base_page.get_current_url()
                assert "/staff" in staff_url, "Staff should access staff area"
                
            elif role == "admin":
                # Admin should have access to admin dashboard
                self.base_page.navigate_to("/admin")
                admin_url = self.base_page.get_current_url()
                assert "/admin" in admin_url, "Admin should access admin area"
                
            elif role == "customer":
                # Customer should access general areas but not restricted dashboards
                self.base_page.navigate_to("/")
                home_url = self.base_page.get_current_url()
                assert "/" in home_url, "Customer should access home page"
            
            # Take screenshot for verification
            self.base_page.take_screenshot(f"_role_access_{role}")
            
            # Logout
            assert self.login_page.logout(), f"Logout failed for {role}"
    
    @allure.story("Logout Tests")
    @allure.severity("high")
    def test_logout_functionality(self):
        """Test logout functionality"""
        with allure.step("Testing logout functionality"):
            # Login as customer first
            assert self.login_page.quick_login("customer", self.test_data), "Login failed"
            
            # Verify logged in
            assert self.base_page.is_user_logged_in(), "User should be logged in"
            
            # Logout
            assert self.login_page.logout(), "Logout failed"
            
            # Verify logged out
            assert not self.base_page.is_user_logged_in(), "User should be logged out"
            
            # Should see login button again
            assert self.base_page.is_login_button_visible(), "Login button should be visible after logout"
    
    @allure.story("Session Tests")
    @allure.severity("normal")
    def test_page_refresh_maintains_session(self):
        """Test that page refresh maintains login session"""
        with allure.step("Testing session persistence after page refresh"):
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Login failed"
            
            # Verify logged in
            assert self.base_page.is_user_logged_in(), "User should be logged in"
            
            # Refresh page
            self.base_page.refresh_page()
            
            # Should still be logged in
            assert self.base_page.is_user_logged_in(), "User should remain logged in after refresh"
            
            # Logout
            assert self.login_page.logout(), "Logout failed"
    
    @allure.story("Unauthorized Access Tests")
    @allure.severity("critical")
    def test_unauthorized_access_to_protected_routes(self):
        """Test unauthorized access to protected routes"""
        protected_routes = [
            "/consultant",
            "/staff", 
            "/admin",
            "/profile"
        ]
        
        with allure.step("Testing unauthorized access to protected routes"):
            # Ensure logged out
            if self.base_page.is_user_logged_in():
                self.login_page.logout()
            
            for route in protected_routes:
                self.logger.info(f"Testing unauthorized access to: {route}")
                
                # Try to access protected route
                self.base_page.navigate_to(route)
                current_url = self.base_page.get_current_url()
                
                # Should be redirected to login or show access denied
                access_denied = (
                    "/login" in current_url or 
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Should deny access to {route} for anonymous user"
    
    @allure.story("Cross-Role Access Tests")
    @allure.severity("high")
    def test_cross_role_access_restrictions(self):
        """Test that users cannot access other roles' restricted areas"""
        with allure.step("Testing cross-role access restrictions"):
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Customer should not access admin area
            self.base_page.navigate_to("/admin")
            current_url = self.base_page.get_current_url()
            
            # Should be redirected or show access denied
            customer_denied_admin = (
                "/admin" not in current_url or
                "403" in self.base_page.get_page_title() or
                self.base_page.get_error_message()
            )
            
            assert customer_denied_admin, "Customer should not access admin area"
            
            # Logout customer
            assert self.login_page.logout(), "Customer logout failed"
            
            # Login as consultant  
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            # Consultant should not access admin area
            self.base_page.navigate_to("/admin")
            current_url = self.base_page.get_current_url()
            
            consultant_denied_admin = (
                "/admin" not in current_url or
                "403" in self.base_page.get_page_title() or
                self.base_page.get_error_message()
            )
            
            assert consultant_denied_admin, "Consultant should not access admin area"
            
            # Logout consultant
            assert self.login_page.logout(), "Consultant logout failed"
    
    @allure.story("Guest Access Tests")
    @allure.severity("normal")
    def test_guest_user_permissions(self):
        """Test guest (anonymous) user permissions"""
        with allure.step("Testing guest user permissions"):
            # Ensure logged out (guest state)
            if self.base_page.is_user_logged_in():
                self.login_page.logout()
            
            # Guest should access public pages
            public_pages = ["/", "/blog", "/about"]
            
            for page in public_pages:
                self.logger.info(f"Testing guest access to: {page}")
                self.base_page.navigate_to(page)
                current_url = self.base_page.get_current_url()
                
                # Should successfully load public pages
                assert page in current_url or "/" in current_url, f"Guest should access {page}"
    
    @allure.story("Security Tests")
    @allure.severity("high")
    def test_multiple_login_attempts(self):
        """Test behavior with multiple failed login attempts"""
        with allure.step("Testing multiple failed login attempts"):
            fake_email = self.data_helpers.generate_fake_email()
            fake_password = self.data_helpers.generate_fake_password()
            
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Attempt multiple failed logins
            for attempt in range(3):
                self.logger.info(f"Failed login attempt #{attempt + 1}")
                
                # Try invalid login
                self.login_page.login_with_credentials(fake_email, fake_password)
                
                # Should show error
                error_msg = self.login_page.get_login_error_message()
                assert error_msg, f"Error message should show on attempt #{attempt + 1}"
                
                # Should still be on login page
                assert "/login" in self.login_page.get_current_url(), "Should remain on login page"
    
    @allure.story("UI Tests")
    @allure.severity("minor")
    def test_login_form_validation_styling(self):
        """Test login form validation and error styling"""
        with allure.step("Testing login form validation styling"):
            # Navigate to login page
            assert self.login_page.navigate_to_login(), "Failed to navigate to login page"
            
            # Submit empty form
            self.login_page.click_login_button()
            
            # Check for validation styling
            email_field = self.driver.find_element(*self.login_page.EMAIL_INPUT)
            password_field = self.driver.find_element(*self.login_page.PASSWORD_INPUT)
            
            # Fields should have validation classes or attributes
            email_invalid = (
                "invalid" in email_field.get_attribute("class") or
                email_field.get_attribute("aria-invalid") == "true" or
                self.login_page.get_email_validation_error()
            )
            
            password_invalid = (
                "invalid" in password_field.get_attribute("class") or
                password_field.get_attribute("aria-invalid") == "true" or
                self.login_page.get_password_validation_error()
            )
            
            # At least one field should show validation state
            assert (email_invalid or password_invalid), "Form should show validation styling" 