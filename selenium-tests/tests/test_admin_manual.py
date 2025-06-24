"""
Manual Admin Login Test
Test admin credentials manually to debug auth issues
"""

import pytest
import allure
from pages.base_page import BasePage
from pages.login_page import LoginPage
from utils.logger import get_logger
import time


@allure.epic("GenCare Authentication")
@allure.feature("Manual Admin Test")
class TestAdminManual:
    """Test admin login manually"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.logger.info("=== Manual Admin Test Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🔍 Starting manual test: {method.__name__}")
    
    def teardown_method(self, method):
        """Cleanup after each test method"""
        try:
            if hasattr(self, 'login_page'):
                self.login_page.logout()
            self.logger.info(f"✅ Manual test completed: {method.__name__}")
        except Exception as e:
            self.logger.warning(f"Cleanup warning in {method.__name__}: {str(e)}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.login_page = LoginPage(driver)
    
    @allure.story("Manual Admin Login Debug")
    @allure.severity("critical")
    def test_manual_admin_login_debug(self):
        """Manual test admin login với detailed debugging"""
        with allure.step("Manual admin login debugging"):
            
            # Step 1: Navigate to homepage
            self.logger.info("Step 1: Navigate to homepage")
            self.base_page.navigate_to("/")
            self.base_page.wait_for_page_load()
            
            current_url = self.base_page.get_current_url()
            page_title = self.base_page.get_page_title()
            self.logger.info(f"Homepage URL: {current_url}")
            self.logger.info(f"Homepage title: {page_title}")
            
            # Step 2: Find and click login button
            self.logger.info("Step 2: Look for login button")
            login_button_selectors = [
                ("xpath", "//button[contains(text(), 'Đăng nhập')]"),
                ("xpath", "//a[contains(text(), 'Đăng nhập')]"),
                ("link text", "Đăng nhập"),
                ("css selector", ".login-btn"),
                ("css selector", "[data-testid='login-button']")
            ]
            
            login_button_found = False
            for selector in login_button_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"Found login button: {selector}")
                        self.base_page.click_element(selector)
                        login_button_found = True
                        break
                except:
                    continue
            
            if not login_button_found:
                self.logger.error("❌ No login button found")
                # Take screenshot
                self.base_page.driver.save_screenshot("reports/screenshots/no_login_button.png")
                return
            
            # Step 3: Wait for login modal/form
            self.logger.info("Step 3: Wait for login form")
            time.sleep(2)
            
            # Check for login form
            login_form_selectors = [
                ("css selector", "form"),
                ("css selector", ".modal"),
                ("css selector", "[data-testid='login-form']"),
                ("xpath", "//form[.//input[@name='email']]")
            ]
            
            form_found = False
            for selector in login_form_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"Found login form: {selector}")
                        form_found = True
                        break
                except:
                    continue
            
            if not form_found:
                self.logger.error("❌ No login form found")
                # Take screenshot
                self.base_page.driver.save_screenshot("reports/screenshots/no_login_form.png")
                return
            
            # Step 4: Fill email field
            self.logger.info("Step 4: Fill email field")
            email_selectors = [
                ("name", "email"),
                ("id", "email"),
                ("css selector", "input[type='email']"),
                ("xpath", "//input[@placeholder='email' or @placeholder='Email']")
            ]
            
            email_filled = False
            for selector in email_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"Found email field: {selector}")
                        self.base_page.type_text(selector, "admin1@gencare.com")
                        email_filled = True
                        break
                except Exception as e:
                    self.logger.warning(f"Could not fill email with {selector}: {e}")
                    continue
            
            if not email_filled:
                self.logger.error("❌ Could not fill email field")
                return
            
            # Step 5: Fill password field
            self.logger.info("Step 5: Fill password field")
            password_selectors = [
                ("name", "password"),
                ("id", "password"),
                ("css selector", "input[type='password']"),
                ("xpath", "//input[@placeholder='password' or @placeholder='Password']")
            ]
            
            password_filled = False
            for selector in password_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"Found password field: {selector}")
                        self.base_page.type_text(selector, "password")
                        password_filled = True
                        break
                except Exception as e:
                    self.logger.warning(f"Could not fill password with {selector}: {e}")
                    continue
            
            if not password_filled:
                self.logger.error("❌ Could not fill password field")
                return
            
            # Step 6: Submit form
            self.logger.info("Step 6: Submit login form")
            submit_selectors = [
                ("xpath", "//button[@type='submit']"),
                ("xpath", "//button[contains(text(), 'Đăng nhập')]"),
                ("css selector", "button[type='submit']"),
                ("css selector", ".login-submit"),
                ("css selector", "[data-testid='submit-login']")
            ]
            
            submit_clicked = False
            for selector in submit_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"Found submit button: {selector}")
                        self.base_page.click_element(selector)
                        submit_clicked = True
                        break
                except Exception as e:
                    self.logger.warning(f"Could not click submit with {selector}: {e}")
                    continue
            
            if not submit_clicked:
                self.logger.error("❌ Could not click submit button")
                return
            
            # Step 7: Wait for response and check result
            self.logger.info("Step 7: Wait for login response")
            time.sleep(5)  # Wait for login response
            
            # Check current URL after login
            current_url_after = self.base_page.get_current_url()
            self.logger.info(f"URL after login: {current_url_after}")
            
            # Check for success indicators
            success_indicators = [
                ("xpath", "//button[contains(text(), 'Đăng xuất')]"),
                ("xpath", "//a[contains(text(), 'Đăng xuất')]"),
                ("link text", "Đăng xuất"),
                ("css selector", ".logout-btn"),
                ("xpath", "//span[contains(text(), 'admin')]"),
                ("xpath", "//*[contains(text(), 'Dashboard')]")
            ]
            
            login_success = False
            for selector in success_indicators:
                try:
                    if self.base_page.is_element_visible(selector, timeout=3):
                        self.logger.info(f"✅ Login success indicator found: {selector}")
                        login_success = True
                        break
                except:
                    continue
            
            # Check for error messages
            error_selectors = [
                ("css selector", ".alert-error"),
                ("css selector", ".error"),
                ("xpath", "//*[contains(text(), 'incorrect') or contains(text(), 'invalid')]"),
                ("xpath", "//*[contains(text(), 'không đúng') or contains(text(), 'thất bại')]")
            ]
            
            error_found = False
            error_message = ""
            for selector in error_selectors:
                try:
                    if self.base_page.is_element_visible(selector, timeout=2):
                        error_element = self.base_page.driver.find_element(*selector)
                        error_message = error_element.text
                        self.logger.error(f"❌ Error message found: {error_message}")
                        error_found = True
                        break
                except:
                    continue
            
            # Check page source for debug info
            page_source = self.base_page.driver.page_source
            if "admin" in page_source.lower():
                self.logger.info("✅ 'admin' text found in page source")
            if "dashboard" in page_source.lower():
                self.logger.info("✅ 'dashboard' text found in page source")
            if "logout" in page_source.lower() or "đăng xuất" in page_source.lower():
                self.logger.info("✅ Logout option found in page source")
            
            # Take final screenshot
            self.base_page.driver.save_screenshot("reports/screenshots/admin_login_result.png")
            
            # Final verdict
            if login_success:
                self.logger.info("🎉 Admin login appears SUCCESSFUL!")
                return True
            elif error_found:
                self.logger.error(f"❌ Admin login FAILED with error: {error_message}")
                return False
            else:
                self.logger.warning("⚠️ Admin login result UNCLEAR - no clear success/error indicators")
                
                # Additional checks
                if current_url_after != current_url:
                    self.logger.info("✅ URL changed after login - possible success")
                    return True
                else:
                    self.logger.warning("⚠️ URL did not change - possible failure")
                    return False
    
    @allure.story("Backend Connection Test")
    @allure.severity("normal")
    def test_backend_connection(self):
        """Test if backend is running and accessible"""
        with allure.step("Testing backend connection"):
            
            self.logger.info("Testing backend connection...")
            
            # Navigate to homepage
            self.base_page.navigate_to("/")
            self.base_page.wait_for_page_load()
            
            # Check if page loads without errors
            page_title = self.base_page.get_page_title()
            current_url = self.base_page.get_current_url()
            
            self.logger.info(f"Page title: {page_title}")
            self.logger.info(f"Current URL: {current_url}")
            
            # Check browser console for errors
            logs = self.base_page.driver.get_log('browser')
            error_count = 0
            for log in logs:
                if log['level'] == 'SEVERE':
                    self.logger.error(f"Browser error: {log['message']}")
                    error_count += 1
            
            if error_count == 0:
                self.logger.info("✅ No severe browser errors found")
            else:
                self.logger.warning(f"⚠️ Found {error_count} browser errors")
            
            # Try to access API endpoint directly if possible
            try:
                # This is just a test - normally we'd use requests
                self.base_page.navigate_to("/api/health")  # Common health check endpoint
                time.sleep(2)
                
                current_url_api = self.base_page.get_current_url()
                if "api" in current_url_api:
                    self.logger.info("✅ API endpoint accessible")
                else:
                    self.logger.info("ℹ️ API endpoint redirected or not available")
                    
            except Exception as e:
                self.logger.info(f"ℹ️ API test inconclusive: {e}")
                
            return True 