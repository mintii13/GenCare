"""
Login Page Object Model for GenCare
Handles login functionality for all 5 user roles
"""

from typing import Optional
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
from utils.logger import get_logger


class LoginPage(BasePage):
    """Page Object Model for GenCare Login Page"""
    
    def __init__(self, driver=None):
        super().__init__(driver)
        self.logger = get_logger(self.__class__.__name__)
        
    # Login modal locators
    LOGIN_TRIGGER_BUTTON = (By.XPATH, "//button[contains(text(), 'Đăng nhập')]")
    LOGIN_MODAL = (By.CSS_SELECTOR, ".fixed.right-4.top-16, .modal, [data-testid='login-modal']")
    MODAL_OVERLAY = (By.CSS_SELECTOR, ".fixed.inset-0.bg-black, .modal-overlay")
    MODAL_CONTENT = (By.CSS_SELECTOR, ".bg-white.rounded-lg.shadow-xl, .modal-content")
    MODAL_CLOSE = (By.XPATH, "//button[contains(@class, 'text-gray-500')]//svg | //button[@aria-label='Close']")
    MODAL_TITLE = (By.XPATH, "//h2[contains(text(), 'Đăng nhập')]")
    
    # Login form locators inside modal
    EMAIL_INPUT = (By.NAME, "email")
    PASSWORD_INPUT = (By.NAME, "password") 
    LOGIN_SUBMIT_BUTTON = (By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]")
    
    # OAuth login
    GOOGLE_LOGIN_BUTTON = (By.CSS_SELECTOR, "button[contains(text(), 'Google')], button[aria-label*='Google'], .google-login")
    
    # Error and success messages
    LOGIN_ERROR = (By.CSS_SELECTOR, ".error, .alert-danger, [data-testid='login-error']")
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".success, .alert-success, [data-testid='login-success']")
    
    # Form validation errors
    EMAIL_ERROR = (By.CSS_SELECTOR, ".email-error, [data-testid='email-error']")
    PASSWORD_ERROR = (By.CSS_SELECTOR, ".password-error, [data-testid='password-error']")
    
    # Remember me and forgot password
    REMEMBER_ME_CHECKBOX = (By.CSS_SELECTOR, "input[type='checkbox'], input[name='remember'], input[id*='remember']")
    FORGOT_PASSWORD_LINK = (By.CSS_SELECTOR, "a[href*='forgot'], a[contains(text(), 'Quên mật khẩu')]")
    
    # Registration link
    REGISTER_LINK = (By.CSS_SELECTOR, "a[href*='register'], a[contains(text(), 'Đăng ký')]")
    
    # Loading state
    LOGIN_LOADING = (By.CSS_SELECTOR, ".loading, .spinner, [data-testid='login-loading']")
    
    def open_login_modal(self) -> bool:
        """
        Open login modal by clicking the login button
        
        Returns:
            bool: True if modal opened successfully
        """
        try:
            # First go to home page where login button should be
            self.navigate_to("/")
            
            # Wait for page to load
            self.wait_for_page_load()
            
            # Click login trigger button
            if not self.click_element(self.LOGIN_TRIGGER_BUTTON):
                self.logger.error("Failed to click login trigger button")
                return False
            
            # Wait for modal to appear
            modal_visible = self.wait_for_element_visible(self.MODAL_CONTENT, timeout=5)
            if modal_visible:
                self.logger.info("Login modal opened successfully")
                return True
            else:
                self.logger.error("Login modal did not appear")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to open login modal: {str(e)}")
            return False
    
    def navigate_to_login(self) -> bool:
        """
        Navigate to login (opens modal for compatibility)
        
        Returns:
            bool: True if navigation successful
        """
        return self.open_login_modal()
    
    def is_login_modal_open(self) -> bool:
        """
        Check if login modal is open
        
        Returns:
            bool: True if login modal is visible
        """
        modal_visible = self.is_element_visible(self.MODAL_CONTENT, timeout=3)
        title_visible = self.is_element_visible(self.MODAL_TITLE, timeout=3)
        return modal_visible and title_visible
    
    def is_login_form_visible(self) -> bool:
        """
        Check if login form is visible inside modal
        
        Returns:
            bool: True if login form is visible
        """
        if not self.is_login_modal_open():
            return False
            
        email_visible = self.is_element_visible(self.EMAIL_INPUT, timeout=5)
        password_visible = self.is_element_visible(self.PASSWORD_INPUT, timeout=5)
        button_visible = self.is_element_visible(self.LOGIN_SUBMIT_BUTTON, timeout=5)
        
        return email_visible and password_visible and button_visible
    
    def close_login_modal(self) -> bool:
        """
        Close login modal
        
        Returns:
            bool: True if modal closed successfully
        """
        try:
            if self.is_login_modal_open():
                # Try to click close button
                if self.is_element_visible(self.MODAL_CLOSE, timeout=3):
                    return self.click_element(self.MODAL_CLOSE)
                else:
                    # Fallback: click overlay to close modal
                    return self.click_element(self.MODAL_OVERLAY)
            return True
        except Exception as e:
            self.logger.error(f"Failed to close login modal: {str(e)}")
            return False
    
    def enter_email(self, email: str) -> bool:
        """
        Enter email in email field
        
        Args:
            email: Email address to enter
            
        Returns:
            bool: True if email entered successfully
        """
        return self.type_text(self.EMAIL_INPUT, email)
    
    def enter_password(self, password: str) -> bool:
        """
        Enter password in password field
        
        Args:
            password: Password to enter
            
        Returns:
            bool: True if password entered successfully
        """
        return self.type_text(self.PASSWORD_INPUT, password)
    
    def click_login_button(self) -> bool:
        """
        Click login submit button
        
        Returns:
            bool: True if button clicked successfully
        """
        return self.click_element(self.LOGIN_SUBMIT_BUTTON)
    
    def wait_for_login_completion(self, timeout: int = 5) -> bool:
        """
        Wait for login process to complete (either success or error)
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            bool: True if login completed (check is_login_successful for success)
        """
        # Wait for loading to disappear
        if self.is_element_visible(self.LOGIN_LOADING, timeout=2):
            self.wait_for_loading_to_disappear(timeout)
        
        # Wait for either success (URL change) or error message
        try:
            # Check if URL changed (successful login typically redirects)
            if not self.get_current_url().endswith('/login'):
                return True
                
            # Check for error message
            if self.is_element_visible(self.LOGIN_ERROR, timeout=3):
                return True
                
            # Wait a bit more for any delayed response
            return self.wait_seconds(2)
            
        except Exception as e:
            self.logger.error(f"Error waiting for login completion: {str(e)}")
            return False
    
    def is_login_successful(self) -> bool:
        """
        Check if login was successful
        
        Returns:
            bool: True if login successful
        """
        # Check if modal is closed (successful login typically closes modal)
        if not self.is_login_modal_open():
            # Check if user menu is visible (indicates logged in)
            if self.is_user_logged_in():
                return True
                
        # Check for success message
        if self.is_element_visible(self.SUCCESS_MESSAGE, timeout=2):
            return True
            
        return False
    
    def get_login_error_message(self) -> str:
        """
        Get login error message if any
        
        Returns:
            str: Error message text
        """
        if self.is_element_visible(self.LOGIN_ERROR, timeout=2):
            return self.get_text(self.LOGIN_ERROR)
        return ""
    
    def get_email_validation_error(self) -> str:
        """
        Get email field validation error
        
        Returns:
            str: Email validation error message
        """
        if self.is_element_visible(self.EMAIL_ERROR, timeout=2):
            return self.get_text(self.EMAIL_ERROR)
        return ""
    
    def get_password_validation_error(self) -> str:
        """
        Get password field validation error
        
        Returns:
            str: Password validation error message
        """
        if self.is_element_visible(self.PASSWORD_ERROR, timeout=2):
            return self.get_text(self.PASSWORD_ERROR)
        return ""
    
    def click_google_login(self) -> bool:
        """
        Click Google OAuth login button
        
        Returns:
            bool: True if button clicked successfully
        """
        return self.click_element(self.GOOGLE_LOGIN_BUTTON)
    
    def check_remember_me(self) -> bool:
        """
        Check the Remember Me checkbox
        
        Returns:
            bool: True if checkbox checked successfully
        """
        if self.is_element_visible(self.REMEMBER_ME_CHECKBOX, timeout=3):
            return self.click_element(self.REMEMBER_ME_CHECKBOX)
        return False
    
    def click_forgot_password(self) -> bool:
        """
        Click forgot password link
        
        Returns:
            bool: True if link clicked successfully
        """
        return self.click_element(self.FORGOT_PASSWORD_LINK)
    
    def click_register_link(self) -> bool:
        """
        Click register link
        
        Returns:
            bool: True if link clicked successfully
        """
        return self.click_element(self.REGISTER_LINK)
    
    def login_with_credentials(self, email: str, password: str, wait_for_completion: bool = True) -> bool:
        """
        Complete login flow with email and password
        
        Args:
            email: Email address
            password: Password
            wait_for_completion: Whether to wait for login to complete
            
        Returns:
            bool: True if login completed successfully
        """
        try:
            self.logger.info(f"Attempting login with email: {email}")
            
            # Ensure modal is open
            if not self.is_login_modal_open():
                if not self.open_login_modal():
                    self.logger.error("Failed to open login modal")
                    return False
            
            # Clear any existing values and enter credentials
            if not self.enter_email(email):
                self.logger.error("Failed to enter email")
                return False
                
            if not self.enter_password(password):
                self.logger.error("Failed to enter password")
                return False
                
            # Click login button
            if not self.click_login_button():
                self.logger.error("Failed to click login button")
                return False
                
            # Wait for login completion if requested
            if wait_for_completion:
                if not self.wait_for_login_completion():
                    self.logger.error("Login process timed out")
                    return False
                    
                # Check if login was successful
                if self.is_login_successful():
                    self.logger.info("Login successful")
                    return True
                else:
                    error_msg = self.get_login_error_message()
                    self.logger.error(f"Login failed: {error_msg}")
                    return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Exception during login: {str(e)}")
            return False
    
    def quick_login(self, user_role: str, test_data: dict) -> bool:
        """
        Quick login method using test data for specific role
        
        Args:
            user_role: Role to login as (customer, consultant, staff, admin)
            test_data: Test data dictionary containing user credentials
            
        Returns:
            bool: True if login successful
        """
        try:
            if user_role not in test_data.get('users', {}):
                self.logger.error(f"User role '{user_role}' not found in test data")
                return False
                
            user_data = test_data['users'][user_role]
            email = user_data.get('username', '')
            password = user_data.get('password', '')
            
            if not email or not password:
                self.logger.error(f"Credentials not found for role: {user_role}")
                return False
            
            # Open login modal if not already open
            if not self.is_login_modal_open():
                if not self.open_login_modal():
                    return False
            
            # Perform login
            return self.login_with_credentials(email, password)
            
        except Exception as e:
            self.logger.error(f"Quick login failed for role {user_role}: {str(e)}")
            return False
    
    def logout(self) -> bool:
        """
        Logout current user
        
        Returns:
            bool: True if logout successful
        """
        try:
            # Check if user is logged in
            if not self.is_user_logged_in():
                self.logger.info("User is not logged in")
                return True
            
            # Click logout button
            if self.click_logout_button():
                # Wait for logout to complete
                self.wait_seconds(2)
                
                # Check if logout successful (should see login button again)
                if self.is_login_button_visible():
                    self.logger.info("Logout successful")
                    return True
                    
            self.logger.error("Logout failed")
            return False
            
        except Exception as e:
            self.logger.error(f"Exception during logout: {str(e)}")
            return False
    
    def navigate_to_home(self) -> bool:
        """
        Navigate to home page
        
        Returns:
            bool: True if navigation successful
        """
        try:
            self.navigate_to("/")
            self.wait_for_page_load()
            self.logger.info("Navigated to home page successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to navigate to home: {str(e)}")
            return False
    
    def wait_seconds(self, seconds: int) -> bool:
        """
        Simple wait for specified seconds
        
        Args:
            seconds: Number of seconds to wait
            
        Returns:
            bool: Always returns True
        """
        import time
        time.sleep(seconds)
        return True 