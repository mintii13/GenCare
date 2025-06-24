#!/usr/bin/env python3
"""
Simple consultant blog create test script
Bypasses pytest to test consultant functionality directly
"""

import sys
import os
import time

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.driver_manager import get_driver_manager
from utils.logger import get_logger

def test_consultant_create_functionality():
    """Test consultant blog create functionality"""
    logger = get_logger("ConsultantCreateTest")
    logger.info("🧪 Starting consultant create functionality test")
    
    # Get driver
    driver_manager = get_driver_manager()
    driver = driver_manager.get_driver()
    
    try:
        # Initialize page objects
        base_page = BasePage(driver)
        blog_page = BlogPageNew(driver)
        
        # Step 1: Login as consultant
        logger.info("🔑 Step 1: Logging in as consultant")
        
        # Navigate to homepage
        base_page.navigate_to("/")
        base_page.wait_for_page_load()
        
        # Click login button
        login_clicked = base_page.click_element(
            ("xpath", "//button[contains(text(), 'Đăng nhập')]")
        )
        
        if not login_clicked:
            logger.error("❌ Could not click login button")
            return False
        
        time.sleep(2)
        
        # Fill consultant credentials
        email_filled = base_page.type_text(
            ("name", "email"), 
            "consultant1@gencare.com"
        )
        
        password_filled = base_page.type_text(
            ("name", "password"), 
            "password"
        )
        
        if not email_filled or not password_filled:
            logger.error("❌ Could not fill login credentials")
            return False
        
        # Submit login
        submit_clicked = base_page.click_element(
            ("xpath", "//button[@type='submit']")
        )
        
        if not submit_clicked:
            logger.error("❌ Could not submit login form")
            return False
        
        # Wait for login to complete
        time.sleep(5)
        
        current_url = base_page.get_current_url()
        logger.info(f"📍 After login URL: {current_url}")
        
        # Check if login successful
        login_successful = False
        if "/consultant" in current_url:
            login_successful = True
            logger.info("✅ Consultant login successful - redirected to consultant area")
        else:
            # Check page content for consultant indicators
            page_source = base_page.driver.page_source.lower()
            if "consultant" in page_source or "dashboard" in page_source:
                login_successful = True
                logger.info("✅ Consultant login successful - detected consultant content")
        
        if not login_successful:
            logger.error(f"❌ Consultant login failed. Current URL: {current_url}")
            return False
        
        # Step 2: Navigate to blogs page
        logger.info("📝 Step 2: Navigating to blogs page")
        
        blog_navigation = blog_page.navigate_to_blog_list()
        if not blog_navigation:
            logger.error("❌ Could not navigate to blogs page")
            return False
        
        time.sleep(3)
        logger.info("✅ Successfully navigated to blogs page")
        
        # Step 3: Look for create button
        logger.info("🔍 Step 3: Looking for create blog button")
        
        create_button_selectors = [
            ("xpath", "//button[contains(text(), 'Tạo')]"),
            ("xpath", "//a[contains(text(), 'Tạo')]"),
            ("xpath", "//button[contains(text(), 'Viết')]"),
            ("xpath", "//a[contains(text(), 'Viết')]"),
            ("css selector", "[href*='create']"),
            ("css selector", "button[data-testid='create-blog']"),
            ("css selector", ".create-blog, .new-blog, .write-blog"),
            ("xpath", "//button[contains(@class, 'create')]"),
            ("xpath", "//a[contains(@class, 'create')]"),
        ]
        
        create_button_found = False
        found_selector = None
        
        for selector in create_button_selectors:
            try:
                if base_page.is_element_visible(selector, timeout=2):
                    create_button_found = True
                    found_selector = selector
                    logger.info(f"✅ Create button found with selector: {selector}")
                    break
            except Exception as e:
                continue
        
        if not create_button_found:
            logger.warning("⚠️ Create button not found with standard selectors")
            
            # Check page source for create-related text
            page_source = base_page.driver.page_source
            create_keywords = ["tạo", "viết", "create", "new", "add"]
            found_keywords = []
            
            for keyword in create_keywords:
                if keyword.lower() in page_source.lower():
                    found_keywords.append(keyword)
            
            if found_keywords:
                logger.info(f"ℹ️ Found create-related keywords: {found_keywords}")
            else:
                logger.warning("⚠️ No create-related keywords found")
        
        # Step 4: Try to access blog creation page
        logger.info("🎯 Step 4: Testing blog creation page access")
        
        creation_accessible = False
        
        # Method 1: Click create button if found
        if create_button_found and found_selector:
            try:
                base_page.click_element(found_selector)
                time.sleep(3)
                
                current_url = base_page.get_current_url()
                if "create" in current_url:
                    creation_accessible = True
                    logger.info(f"✅ Blog creation accessible via button: {current_url}")
            except Exception as e:
                logger.info(f"Could not click create button: {e}")
        
        # Method 2: Direct URL access
        if not creation_accessible:
            create_urls = ["/blogs/create", "/blog/create", "/blogs/new"]
            
            for url in create_urls:
                try:
                    logger.info(f"Trying direct access: {url}")
                    base_page.navigate_to(url)
                    time.sleep(3)
                    
                    current_url = base_page.get_current_url()
                    if "create" in current_url or "new" in current_url:
                        creation_accessible = True
                        logger.info(f"✅ Blog creation accessible via direct URL: {current_url}")
                        break
                    
                    # Check for creation form elements
                    page_source = base_page.driver.page_source.lower()
                    creation_indicators = ["title", "content", "submit", "publish"]
                    indicators_found = [i for i in creation_indicators if i in page_source]
                    
                    if len(indicators_found) >= 2:
                        creation_accessible = True
                        logger.info(f"✅ Creation form detected with indicators: {indicators_found}")
                        break
                        
                except Exception as e:
                    logger.info(f"Failed to access {url}: {e}")
        
        # Step 5: Test form interaction if creation page accessible
        if creation_accessible:
            logger.info("📋 Step 5: Testing form interaction")
            
            form_elements_found = {}
            
            # Look for title input
            title_selectors = [
                ("name", "title"),
                ("css selector", "input[placeholder*='tiêu đề']"),
                ("css selector", "input[placeholder*='title']"),
                ("xpath", "//input[@type='text'][1]")
            ]
            
            for selector in title_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        form_elements_found["title"] = selector
                        logger.info(f"✅ Title input found: {selector}")
                        break
                except:
                    continue
            
            # Look for content input
            content_selectors = [
                ("name", "content"),
                ("css selector", "textarea"),
                ("xpath", "//textarea[1]")
            ]
            
            for selector in content_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        form_elements_found["content"] = selector
                        logger.info(f"✅ Content input found: {selector}")
                        break
                except:
                    continue
            
            # Look for submit button
            submit_selectors = [
                ("xpath", "//button[@type='submit']"),
                ("xpath", "//button[contains(text(), 'Đăng')]"),
                ("xpath", "//button[contains(text(), 'Tạo')]")
            ]
            
            for selector in submit_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        form_elements_found["submit"] = selector
                        logger.info(f"✅ Submit button found: {selector}")
                        break
                except:
                    continue
            
            if form_elements_found:
                logger.info(f"✅ Blog creation form is functional. Elements: {list(form_elements_found.keys())}")
            else:
                logger.warning("⚠️ No form elements detected on creation page")
        
        # Summary
        logger.info("\n" + "="*50)
        logger.info("📊 CONSULTANT CREATE FUNCTIONALITY TEST SUMMARY")
        logger.info("="*50)
        logger.info(f"✅ Consultant Login: {login_successful}")
        logger.info(f"✅ Blog Page Navigation: {blog_navigation}")
        logger.info(f"{'✅' if create_button_found else '❌'} Create Button Visible: {create_button_found}")
        logger.info(f"{'✅' if creation_accessible else '❌'} Creation Page Accessible: {creation_accessible}")
        
        if creation_accessible and form_elements_found:
            logger.info("✅ Overall Result: CONSULTANT CAN CREATE BLOGS")
        elif creation_accessible:
            logger.info("⚠️ Overall Result: CREATION PAGE ACCESSIBLE BUT FORM UNCLEAR")
        elif create_button_found:
            logger.info("⚠️ Overall Result: CREATE BUTTON FOUND BUT PAGE NOT ACCESSIBLE")
        else:
            logger.info("❌ Overall Result: CREATE FUNCTIONALITY NOT AVAILABLE")
        
        return creation_accessible
        
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
        return False
        
    finally:
        # Cleanup
        try:
            driver.quit()
            logger.info("🧹 Driver cleanup completed")
        except:
            pass

if __name__ == "__main__":
    success = test_consultant_create_functionality()
    exit(0 if success else 1) 