"""
Driver Manager for GenCare Automation Framework
Handles WebDriver initialization, configuration, and management
"""

import os
import json
import logging
from typing import Optional
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.microsoft import EdgeChromiumDriverManager


class DriverManager:
    """Manages WebDriver instances and configuration"""
    
    def __init__(self, config_path: str = "config/config.json"):
        """
        Initialize DriverManager with configuration
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.driver: Optional[webdriver.Edge] = None
        self.wait: Optional[WebDriverWait] = None
        self.logger = logging.getLogger(__name__)
        
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Config file not found: {config_path}")
            return self._get_default_config()
        except json.JSONDecodeError:
            self.logger.error(f"Invalid JSON in config file: {config_path}")
            return self._get_default_config()
    
    def _get_default_config(self) -> dict:
        """Return default configuration if config file is not available"""
        return {
            "browser": {
                "type": "edge",
                "headless": False,
                "window_size": {"width": 1920, "height": 1080},
                "implicit_wait": 5,
                "explicit_wait": 10,
                "page_load_timeout": 15
            }
        }
    
    def create_driver(self) -> webdriver.Edge:
        """
        Create and configure Edge WebDriver instance
        
        Returns:
            webdriver.Edge: Configured Edge WebDriver instance
        """
        try:
            # Configure Edge options
            edge_options = Options()
            browser_config = self.config.get("browser", {})
            
            # Set headless mode
            if browser_config.get("headless", False):
                edge_options.add_argument("--headless")
                self.logger.info("Running in headless mode")
            
            # Additional Edge options for stability
            edge_options.add_argument("--no-sandbox")
            edge_options.add_argument("--disable-dev-shm-usage")
            edge_options.add_argument("--disable-gpu")
            edge_options.add_argument("--disable-extensions")
            edge_options.add_argument("--disable-popup-blocking")
            edge_options.add_argument("--disable-notifications")
            
            # Set window size
            window_size = browser_config.get("window_size", {"width": 1920, "height": 1080})
            edge_options.add_argument(f"--window-size={window_size['width']},{window_size['height']}")
            
            # Create Edge service with auto-downloaded driver
            service = Service(EdgeChromiumDriverManager().install())
            
            # Create driver instance
            self.driver = webdriver.Edge(service=service, options=edge_options)
            self.logger.info("Edge WebDriver created successfully")
            
            # Configure timeouts
            implicit_wait = browser_config.get("implicit_wait", 10)
            page_load_timeout = browser_config.get("page_load_timeout", 60)
            
            self.driver.implicitly_wait(implicit_wait)
            self.driver.set_page_load_timeout(page_load_timeout)
            
            # Create WebDriverWait instance
            explicit_wait = browser_config.get("explicit_wait", 30)
            self.wait = WebDriverWait(self.driver, explicit_wait)
            
            # Maximize window if not headless
            if not browser_config.get("headless", False):
                self.driver.maximize_window()
            
            self.logger.info(f"Driver configured with timeouts - Implicit: {implicit_wait}s, Page load: {page_load_timeout}s, Explicit: {explicit_wait}s")
            
            return self.driver
            
        except Exception as e:
            self.logger.error(f"Failed to create Edge WebDriver: {str(e)}")
            raise
    
    def get_driver(self) -> webdriver.Edge:
        """
        Get current driver instance or create new one
        
        Returns:
            webdriver.Edge: WebDriver instance
        """
        if self.driver is None:
            return self.create_driver()
        return self.driver
    
    def get_wait(self) -> WebDriverWait:
        """
        Get WebDriverWait instance
        
        Returns:
            WebDriverWait: WebDriverWait instance
        """
        if self.wait is None:
            if self.driver is None:
                self.create_driver()
            explicit_wait = self.config.get("browser", {}).get("explicit_wait", 30)
            self.wait = WebDriverWait(self.driver, explicit_wait)
        return self.wait
    
    def navigate_to(self, url: str) -> None:
        """
        Navigate to specified URL
        
        Args:
            url: URL to navigate to
        """
        try:
            self.get_driver().get(url)
            self.logger.info(f"Navigated to: {url}")
        except Exception as e:
            self.logger.error(f"Failed to navigate to {url}: {str(e)}")
            raise
    
    def take_screenshot(self, filename: str) -> str:
        """
        Take screenshot and save to file
        
        Args:
            filename: Name of the screenshot file
            
        Returns:
            str: Path to saved screenshot
        """
        try:
            # Create screenshots directory if it doesn't exist
            screenshots_dir = "reports/screenshots"
            os.makedirs(screenshots_dir, exist_ok=True)
            
            # Create full path
            screenshot_path = os.path.join(screenshots_dir, filename)
            
            # Take screenshot
            self.get_driver().save_screenshot(screenshot_path)
            self.logger.info(f"Screenshot saved: {screenshot_path}")
            
            return screenshot_path
            
        except Exception as e:
            self.logger.error(f"Failed to take screenshot: {str(e)}")
            return ""
    
    def quit_driver(self) -> None:
        """Quit the WebDriver instance"""
        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("WebDriver quit successfully")
            except Exception as e:
                self.logger.error(f"Error quitting WebDriver: {str(e)}")
            finally:
                self.driver = None
                self.wait = None
    
    def refresh_page(self) -> None:
        """Refresh the current page"""
        try:
            self.get_driver().refresh()
            self.logger.info("Page refreshed")
        except Exception as e:
            self.logger.error(f"Failed to refresh page: {str(e)}")
            raise
    
    def get_current_url(self) -> str:
        """Get current page URL"""
        try:
            current_url = self.get_driver().current_url
            self.logger.debug(f"Current URL: {current_url}")
            return current_url
        except Exception as e:
            self.logger.error(f"Failed to get current URL: {str(e)}")
            return ""
    
    def get_page_title(self) -> str:
        """Get current page title"""
        try:
            title = self.get_driver().title
            self.logger.debug(f"Page title: {title}")
            return title
        except Exception as e:
            self.logger.error(f"Failed to get page title: {str(e)}")
            return ""


# Singleton instance for global use
_driver_manager_instance: Optional[DriverManager] = None

def get_driver_manager() -> DriverManager:
    """Get singleton DriverManager instance"""
    global _driver_manager_instance
    if _driver_manager_instance is None:
        _driver_manager_instance = DriverManager()
    return _driver_manager_instance

def reset_driver_manager() -> None:
    """Reset singleton DriverManager instance"""
    global _driver_manager_instance
    if _driver_manager_instance:
        _driver_manager_instance.quit_driver()
    _driver_manager_instance = None 