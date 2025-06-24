"""
Wait Helpers for GenCare Automation Framework
Custom wait conditions and helper functions for complex scenarios
"""

import logging
import time
from typing import Any, Callable, Optional, Union, List
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException


class WaitHelpers:
    """Custom wait conditions and helper methods"""
    
    def __init__(self, driver: webdriver.Edge, default_timeout: int = 10):
        """
        Initialize WaitHelpers
        
        Args:
            driver: WebDriver instance
            default_timeout: Default timeout in seconds
        """
        self.driver = driver
        self.default_timeout = default_timeout
        self.wait = WebDriverWait(driver, default_timeout)
        self.logger = logging.getLogger(__name__)
    
    def wait_for_element_clickable(
        self, 
        locator: tuple, 
        timeout: Optional[int] = None
    ) -> WebElement:
        """
        Wait for element to be clickable
        
        Args:
            locator: Tuple of (By, value)
            timeout: Custom timeout in seconds
            
        Returns:
            WebElement: Clickable element
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.element_to_be_clickable(locator))
            self.logger.debug(f"Element clickable: {locator}")
            return element
        except TimeoutException:
            self.logger.error(f"Element not clickable within {timeout}s: {locator}")
            raise
    
    def wait_for_element_visible(
        self, 
        locator: tuple, 
        timeout: Optional[int] = None
    ) -> WebElement:
        """
        Wait for element to be visible
        
        Args:
            locator: Tuple of (By, value)
            timeout: Custom timeout in seconds
            
        Returns:
            WebElement: Visible element
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.visibility_of_element_located(locator))
            self.logger.debug(f"Element visible: {locator}")
            return element
        except TimeoutException:
            self.logger.error(f"Element not visible within {timeout}s: {locator}")
            raise
    
    def wait_for_element_present(
        self, 
        locator: tuple, 
        timeout: Optional[int] = None
    ) -> WebElement:
        """
        Wait for element to be present in DOM
        
        Args:
            locator: Tuple of (By, value)
            timeout: Custom timeout in seconds
            
        Returns:
            WebElement: Present element
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.presence_of_element_located(locator))
            self.logger.debug(f"Element present: {locator}")
            return element
        except TimeoutException:
            self.logger.error(f"Element not present within {timeout}s: {locator}")
            raise
    
    def wait_for_elements_present(
        self, 
        locator: tuple, 
        timeout: Optional[int] = None
    ) -> List[WebElement]:
        """
        Wait for elements to be present in DOM
        
        Args:
            locator: Tuple of (By, value)
            timeout: Custom timeout in seconds
            
        Returns:
            List[WebElement]: List of present elements
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            elements = wait.until(EC.presence_of_all_elements_located(locator))
            self.logger.debug(f"Elements present: {locator}, count: {len(elements)}")
            return elements
        except TimeoutException:
            self.logger.error(f"Elements not present within {timeout}s: {locator}")
            raise
    
    def wait_for_text_in_element(
        self, 
        locator: tuple, 
        text: str, 
        timeout: Optional[int] = None
    ) -> bool:
        """
        Wait for specific text to appear in element
        
        Args:
            locator: Tuple of (By, value)
            text: Text to wait for
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if text found
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(EC.text_to_be_present_in_element(locator, text))
            self.logger.debug(f"Text '{text}' found in element: {locator}")
            return result
        except TimeoutException:
            self.logger.error(f"Text '{text}' not found in element within {timeout}s: {locator}")
            raise
    
    def wait_for_url_contains(
        self, 
        url_part: str, 
        timeout: Optional[int] = None
    ) -> bool:
        """
        Wait for URL to contain specific string
        
        Args:
            url_part: String that should be in URL
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if URL contains string
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(EC.url_contains(url_part))
            self.logger.debug(f"URL contains: {url_part}")
            return result
        except TimeoutException:
            current_url = self.driver.current_url
            self.logger.error(f"URL doesn't contain '{url_part}' within {timeout}s. Current URL: {current_url}")
            raise
    
    def wait_for_element_invisible(
        self, 
        locator: tuple, 
        timeout: Optional[int] = None
    ) -> bool:
        """
        Wait for element to become invisible
        
        Args:
            locator: Tuple of (By, value)
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if element is invisible
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(EC.invisibility_of_element_located(locator))
            self.logger.debug(f"Element invisible: {locator}")
            return result
        except TimeoutException:
            self.logger.error(f"Element still visible after {timeout}s: {locator}")
            raise
    
    def wait_for_page_load(self, timeout: Optional[int] = None) -> bool:
        """
        Wait for page to be fully loaded
        
        Args:
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if page loaded
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            self.logger.debug("Page fully loaded")
            return result
        except TimeoutException:
            self.logger.error(f"Page not loaded within {timeout}s")
            raise
    
    def wait_for_alert_present(self, timeout: Optional[int] = None) -> Any:
        """
        Wait for alert to be present
        
        Args:
            timeout: Custom timeout in seconds
            
        Returns:
            Alert: Alert object
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            alert = wait.until(EC.alert_is_present())
            self.logger.debug("Alert present")
            return alert
        except TimeoutException:
            self.logger.error(f"Alert not present within {timeout}s")
            raise
    
    def wait_for_loading_to_disappear(
        self, 
        loading_locator: tuple = (By.CLASS_NAME, "loading"),
        timeout: Optional[int] = None
    ) -> bool:
        """
        Wait for loading indicator to disappear
        
        Args:
            loading_locator: Locator for loading element
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if loading disappeared
        """
        timeout = timeout or self.default_timeout
        try:
            # First check if loading element exists
            if self.is_element_present(loading_locator, 2):
                wait = WebDriverWait(self.driver, timeout)
                result = wait.until(EC.invisibility_of_element_located(loading_locator))
                self.logger.debug("Loading indicator disappeared")
                return result
            else:
                self.logger.debug("Loading indicator not found, assuming already loaded")
                return True
        except TimeoutException:
            self.logger.error(f"Loading indicator still visible after {timeout}s")
            raise
    
    def wait_for_ajax_complete(self, timeout: Optional[int] = None) -> bool:
        """
        Wait for AJAX requests to complete (jQuery)
        
        Args:
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if AJAX complete
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(
                lambda driver: driver.execute_script("return jQuery.active == 0") if 
                driver.execute_script("return typeof jQuery !== 'undefined'") else True
            )
            self.logger.debug("AJAX requests completed")
            return result
        except TimeoutException:
            self.logger.error(f"AJAX requests not completed within {timeout}s")
            raise
    
    def is_element_present(self, locator: tuple, timeout: int = 3) -> bool:
        """
        Check if element is present without throwing exception
        
        Args:
            locator: Tuple of (By, value)
            timeout: Timeout in seconds
            
        Returns:
            bool: True if element present
        """
        try:
            wait = WebDriverWait(self.driver, timeout)
            wait.until(EC.presence_of_element_located(locator))
            return True
        except TimeoutException:
            return False
    
    def is_element_visible(self, locator: tuple, timeout: int = 3) -> bool:
        """
        Check if element is visible without throwing exception
        
        Args:
            locator: Tuple of (By, value)
            timeout: Timeout in seconds
            
        Returns:
            bool: True if element visible
        """
        try:
            wait = WebDriverWait(self.driver, timeout)
            wait.until(EC.visibility_of_element_located(locator))
            return True
        except TimeoutException:
            return False
    
    def retry_on_stale_element(
        self, 
        func: Callable, 
        max_retries: int = 3, 
        delay: float = 1.0
    ) -> Any:
        """
        Retry function on StaleElementReferenceException
        
        Args:
            func: Function to retry
            max_retries: Maximum number of retries
            delay: Delay between retries in seconds
            
        Returns:
            Any: Function result
        """
        for attempt in range(max_retries):
            try:
                return func()
            except StaleElementReferenceException:
                if attempt == max_retries - 1:
                    self.logger.error(f"StaleElementReferenceException after {max_retries} retries")
                    raise
                self.logger.warning(f"StaleElementReferenceException, retrying... ({attempt + 1}/{max_retries})")
                time.sleep(delay)
    
    def wait_for_element_count(
        self, 
        locator: tuple, 
        expected_count: int, 
        timeout: Optional[int] = None
    ) -> bool:
        """
        Wait for specific number of elements
        
        Args:
            locator: Tuple of (By, value)
            expected_count: Expected number of elements
            timeout: Custom timeout in seconds
            
        Returns:
            bool: True if count matches
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout)
            result = wait.until(
                lambda driver: len(driver.find_elements(*locator)) == expected_count
            )
            self.logger.debug(f"Element count {expected_count} achieved for: {locator}")
            return result
        except TimeoutException:
            actual_count = len(self.driver.find_elements(*locator))
            self.logger.error(f"Expected {expected_count} elements, found {actual_count} within {timeout}s: {locator}")
            raise
    
    def wait_with_custom_condition(
        self, 
        condition: Callable, 
        timeout: Optional[int] = None,
        poll_frequency: float = 0.5
    ) -> Any:
        """
        Wait with custom condition function
        
        Args:
            condition: Custom condition function
            timeout: Custom timeout in seconds
            poll_frequency: Polling frequency in seconds
            
        Returns:
            Any: Condition result
        """
        timeout = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, timeout, poll_frequency)
            result = wait.until(condition)
            self.logger.debug("Custom condition satisfied")
            return result
        except TimeoutException:
            self.logger.error(f"Custom condition not satisfied within {timeout}s")
            raise


# Custom Expected Conditions
class CustomExpectedConditions:
    """Custom expected conditions for specific GenCare scenarios"""
    
    @staticmethod
    def element_has_class(locator: tuple, class_name: str):
        """Wait for element to have specific class"""
        def _predicate(driver):
            try:
                element = driver.find_element(*locator)
                return class_name in element.get_attribute("class").split()
            except:
                return False
        return _predicate
    
    @staticmethod
    def element_attribute_contains(locator: tuple, attribute: str, value: str):
        """Wait for element attribute to contain specific value"""
        def _predicate(driver):
            try:
                element = driver.find_element(*locator)
                attr_value = element.get_attribute(attribute)
                return attr_value and value in attr_value
            except:
                return False
        return _predicate
    
    @staticmethod
    def page_title_matches(expected_title: str):
        """Wait for page title to match exactly"""
        def _predicate(driver):
            return driver.title == expected_title
        return _predicate
    
    @staticmethod
    def url_matches_pattern(pattern: str):
        """Wait for URL to match regex pattern"""
        import re
        def _predicate(driver):
            return re.search(pattern, driver.current_url) is not None
        return _predicate 