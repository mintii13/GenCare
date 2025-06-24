"""
Base Page Class for GenCare Automation Framework
Contains common functionality shared across all page objects
"""

import logging
import time
from typing import Optional, List, Tuple
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from utils.driver_manager import get_driver_manager
from utils.wait_helpers import WaitHelpers
from utils.logger import get_logger
from config.test_config import TestConfig


class BasePage:
    """Base class for all page objects in GenCare application"""
    
    def __init__(self, driver: Optional[webdriver.Edge] = None):
        """
        Initialize BasePage
        
        Args:
            driver: WebDriver instance (optional, will create new if not provided)
        """
        self.driver_manager = get_driver_manager()
        self.driver = driver or self.driver_manager.get_driver()
        self.wait_helpers = WaitHelpers(self.driver)
        self.logger = get_logger(self.__class__.__name__)
        self.base_url = "http://localhost:5173"
        
    # Common locators used across multiple pages
    LOADING_SPINNER = (By.CLASS_NAME, "loading")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast'], .toast, .notification")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".error, .error-message, [data-testid='error']")
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".success, .success-message, [data-testid='success']")
    
    # Navigation elements
    NAVBAR = (By.TAG_NAME, "nav")
    HOME_LINK = (By.LINK_TEXT, "Trang chủ")
    BLOG_LINK = (By.LINK_TEXT, "Blog")
    ABOUT_LINK = (By.LINK_TEXT, "Về chúng tôi")
    LOGIN_BUTTON = (By.XPATH, "//button[contains(text(), 'Đăng nhập')]")
    REGISTER_BUTTON = (By.XPATH, "//a[contains(text(), 'Đăng ký')] | //button[contains(text(), 'Đăng ký')]")
    USER_MENU = (By.CSS_SELECTOR, "[data-testid='user-menu'], .user-menu")
    LOGOUT_BUTTON = (By.XPATH, "//button[contains(text(), 'Đăng xuất')]")
        
    def navigate_to(self, url: str) -> None:
        """
        Navigate to specific URL
        
        Args:
            url: URL to navigate to
        """
        if not url.startswith('http'):
            url = f"{self.base_url}{url}"
        
        self.logger.info(f"Navigating to: {url}")
        self.driver.get(url)
        self.wait_for_page_load()
        
    def wait_for_page_load(self, timeout: int = 7) -> bool:
        """
        Wait for page to be fully loaded
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            bool: True if page loaded successfully
        """
        try:
            return self.wait_helpers.wait_for_page_load(timeout)
        except TimeoutException:
            self.logger.warning(f"Page load timeout after {timeout} seconds")
            return False
    
    def wait_for_element_clickable(self, locator: Tuple[str, str], timeout: int = 5) -> WebElement:
        """
        Wait for element to be clickable
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            WebElement: Clickable element
        """
        try:
            return self.wait_helpers.wait_for_element_clickable(locator, timeout)
        except TimeoutException:
            self.logger.error(f"Element not clickable: {locator}")
            raise
    
    def wait_for_element_visible(self, locator: Tuple[str, str], timeout: int = 5) -> WebElement:
        """
        Wait for element to be visible
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            WebElement: Visible element
        """
        try:
            return self.wait_helpers.wait_for_element_visible(locator, timeout)
        except TimeoutException:
            self.logger.error(f"Element not visible: {locator}")
            raise
    
    def click_element(self, locator: Tuple[str, str], timeout: int = 5) -> bool:
        """
        Click on element with wait
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            bool: True if click successful
        """
        try:
            element = self.wait_for_element_clickable(locator, timeout)
            element.click()
            self.logger.info(f"Clicked element: {locator}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to click element {locator}: {str(e)}")
            return False
            
    def type_text(self, locator: Tuple[str, str], text: str, clear_first: bool = True, timeout: int = 5) -> bool:
        """
        Type text into element
        
        Args:
            locator: Element locator tuple
            text: Text to type
            clear_first: Whether to clear field before typing
            timeout: Timeout in seconds
            
        Returns:
            bool: True if typing successful
        """
        try:
            element = self.wait_for_element_visible(locator, timeout)
            if clear_first:
                element.clear()
            element.send_keys(text)
            self.logger.info(f"Typed text into {locator}: {text}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to type text into {locator}: {str(e)}")
            return False
            
    def get_text(self, locator: Tuple[str, str], timeout: int = 5) -> str:
        """
        Get text from element
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            str: Element text
        """
        try:
            element = self.wait_for_element_visible(locator, timeout)
            text = element.text
            self.logger.debug(f"Got text from {locator}: {text}")
            return text
        except Exception as e:
            self.logger.error(f"Failed to get text from {locator}: {str(e)}")
            return ""
    
    def is_element_visible(self, locator: Tuple[str, str], timeout: int = 3) -> bool:
        """
        Check if element is visible
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            bool: True if element is visible
        """
        return self.wait_helpers.is_element_visible(locator, timeout)
        
    def is_element_present(self, locator: Tuple[str, str], timeout: int = 3) -> bool:
        """
        Check if element is present in DOM
        
        Args:
            locator: Element locator tuple
            timeout: Timeout in seconds
            
        Returns:
            bool: True if element is present
        """
        return self.wait_helpers.is_element_present(locator, timeout)
    
    def wait_for_text_in_element(self, locator: Tuple[str, str], text: str, timeout: int = 5) -> bool:
        """
        Wait for specific text to appear in element
        
        Args:
            locator: Element locator tuple
            text: Text to wait for
            timeout: Timeout in seconds
            
        Returns:
            bool: True if text found
        """
        try:
            return self.wait_helpers.wait_for_text_in_element(locator, text, timeout)
        except TimeoutException:
            self.logger.error(f"Text '{text}' not found in element {locator}")
            return False
    
    def wait_for_url_contains(self, url_part: str, timeout: int = 5) -> bool:
        """
        Wait for URL to contain specific string
        
        Args:
            url_part: String that should be in URL
            timeout: Timeout in seconds
            
        Returns:
            bool: True if URL contains string
        """
        try:
            return self.wait_helpers.wait_for_url_contains(url_part, timeout)
        except TimeoutException:
            current_url = self.driver.current_url
            self.logger.error(f"URL doesn't contain '{url_part}'. Current URL: {current_url}")
            return False
        
    def get_current_url(self) -> str:
        """
        Get current page URL
        
        Returns:
            str: Current URL
        """
        return self.driver.current_url
    
    def get_page_title(self) -> str:
        """
        Get current page title
        
        Returns:
            str: Page title
        """
        return self.driver.title
        
    def refresh_page(self) -> None:
        """Refresh the current page"""
        self.logger.info("Refreshing page")
        self.driver.refresh()
        self.wait_for_page_load()
    
    def take_screenshot(self, filename_suffix: str = "") -> str:
        """
        Take screenshot
        
        Args:
            filename_suffix: Suffix for filename
            
        Returns:
            str: Screenshot file path
        """
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        class_name = self.__class__.__name__
        filename = f"{class_name}_{timestamp}{filename_suffix}.png"
        return self.driver_manager.take_screenshot(filename)
    
    def scroll_to_element(self, locator: Tuple[str, str]) -> bool:
        """
        Scroll to element
        
        Args:
            locator: Element locator tuple
            
        Returns:
            bool: True if scroll successful
        """
        try:
            element = self.driver.find_element(*locator)
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.5)  # Wait for scroll to complete
            self.logger.info(f"Scrolled to element: {locator}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to scroll to element {locator}: {str(e)}")
            return False
    
    def hover_over_element(self, locator: Tuple[str, str]) -> bool:
        """
        Hover over element
        
        Args:
            locator: Element locator tuple
            
        Returns:
            bool: True if hover successful
        """
        try:
            element = self.wait_for_element_visible(locator)
            ActionChains(self.driver).move_to_element(element).perform()
            self.logger.info(f"Hovered over element: {locator}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to hover over element {locator}: {str(e)}")
            return False
    
    def press_key(self, key: str) -> bool:
        """
        Press keyboard key
        
        Args:
            key: Key to press (from Keys class)
            
        Returns:
            bool: True if key press successful
        """
        try:
            ActionChains(self.driver).send_keys(getattr(Keys, key.upper())).perform()
            self.logger.info(f"Pressed key: {key}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to press key {key}: {str(e)}")
            return False
    
    def wait_for_loading_to_disappear(self, timeout: int = 10) -> bool:
        """
        Wait for loading spinner to disappear
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            bool: True if loading disappeared
        """
        return self.wait_helpers.wait_for_loading_to_disappear(self.LOADING_SPINNER, timeout)
    
    def get_toast_message(self, timeout: int = 5) -> str:
        """
        Get toast/notification message
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            str: Toast message text
        """
        try:
            element = self.wait_for_element_visible(self.TOAST_MESSAGE, timeout)
            return element.text
        except TimeoutException:
            self.logger.debug("No toast message found")
            return ""
    
    def get_error_message(self, timeout: int = 5) -> str:
        """
        Get error message
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            str: Error message text
        """
        try:
            element = self.wait_for_element_visible(self.ERROR_MESSAGE, timeout)
            return element.text
        except TimeoutException:
            self.logger.debug("No error message found")
            return ""
    
    def get_success_message(self, timeout: int = 5) -> str:
        """
        Get success message
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            str: Success message text
        """
        try:
            element = self.wait_for_element_visible(self.SUCCESS_MESSAGE, timeout)
            return element.text
        except TimeoutException:
            self.logger.debug("No success message found")
            return ""
    
    def click_home_link(self) -> bool:
        """Click on Home navigation link"""
        return self.click_element(self.HOME_LINK)
    
    def click_blog_link(self) -> bool:
        """Click on Blog navigation link"""
        return self.click_element(self.BLOG_LINK)
    
    def click_login_button(self) -> bool:
        """Click on Login button"""
        return self.click_element(self.LOGIN_BUTTON)
    
    def click_logout_button(self) -> bool:
        """Click on Logout button"""
        return self.click_element(self.LOGOUT_BUTTON)
    
    def is_user_logged_in(self) -> bool:
        """
        Check if user is logged in by looking for user menu
        
        Returns:
            bool: True if user is logged in
        """
        return self.is_element_visible(self.USER_MENU, timeout=3)
    
    def is_login_button_visible(self) -> bool:
        """
        Check if login button is visible
        
        Returns:
            bool: True if login button is visible
        """
        return self.is_element_visible(self.LOGIN_BUTTON, timeout=3) 