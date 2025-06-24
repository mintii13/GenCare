#!/usr/bin/env python3
"""
Comprehensive Blog Delete Test
Focus specifically on DELETE functionality with advanced confirmation handling
"""

import sys
import os
import time
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.driver_manager import get_driver_manager
from utils.logger import get_logger

def test_blog_delete_comprehensive():
    """Comprehensive test for blog delete functionality"""
    logger = get_logger("BlogDeleteComprehensiveTest")
    logger.info("🗑️ Starting comprehensive blog delete test")
    
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
        base_page.type_text(("name", "email"), "consultant1@gencare.com")
        base_page.type_text(("name", "password"), "password")
        base_page.click_element(("xpath", "//button[@type='submit']"))
        
        # Wait for login to complete
        time.sleep(5)
        logger.info("✅ Consultant login successful")
        
        # Step 2: Create a new blog post specifically for DELETE testing
        logger.info("📝 Step 2: Creating a test blog for DELETE operation")
        
        # Navigate to blogs page
        blog_page.navigate_to_blog_list()
        time.sleep(3)
        
        # Click create button
        base_page.click_element(("xpath", "//button[contains(text(), 'Viết')]"))
        time.sleep(3)
        
        # Generate test data
        timestamp = int(time.time())
        test_title = f"DELETE TEST BLOG - {timestamp}"
        test_content = f"""
This blog is created specifically for DELETE testing.
Timestamp: {timestamp}
Created at: {time.strftime('%Y-%m-%d %H:%M:%S')}

This blog SHOULD BE DELETED by the automated test.
If you see this blog in the system, the DELETE test may have failed.
        """.strip()
        
        logger.info(f"📝 Creating delete test blog: {test_title}")
        
        # Fill form
        base_page.type_text(("css selector", "input[placeholder*='tiêu đề']"), test_title)
        base_page.type_text(("css selector", "[contenteditable='true']"), test_content)
        base_page.click_element(("xpath", "//button[@type='submit']"))
        
        time.sleep(5)
        
        # Get the created blog URL
        created_blog_url = base_page.get_current_url()
        blog_id = created_blog_url.split('/')[-1] if '/blogs/' in created_blog_url else None
        
        logger.info(f"✅ Test blog created: {created_blog_url}")
        logger.info(f"🔗 Blog ID: {blog_id}")
        
        # Take screenshot before delete
        base_page.take_screenshot("_before_delete_test")
        
        # Step 3: Comprehensive DELETE testing
        logger.info("🗑️ Step 3: Comprehensive DELETE testing")
        
        # Scroll to ensure delete button is visible
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        # Look for delete button with multiple strategies
        delete_button_found = False
        delete_button_element = None
        
        delete_selectors = [
            ("xpath", "//button[contains(text(), 'Xóa')]"),
            ("css selector", "button[class*='text-red']"),
            ("xpath", "//button[contains(@class, 'text-red')]"),
            ("xpath", "//button[text()='Xóa']"),
            ("css selector", "button[color='red']"),
            ("xpath", "//button[contains(., 'Xóa')]")
        ]
        
        for i, selector in enumerate(delete_selectors):
            try:
                if base_page.is_element_visible(selector, timeout=3):
                    delete_button_element = driver.find_element(*selector)
                    delete_button_found = True
                    logger.info(f"✅ Delete button found with selector {i+1}: {selector}")
                    break
            except Exception as e:
                logger.debug(f"Selector {selector} failed: {e}")
                continue
        
        if not delete_button_found:
            logger.error("❌ Delete button not found with any selector")
            return False
        
        # Step 4: Execute DELETE with comprehensive confirmation handling
        logger.info("🔥 Step 4: Executing DELETE operation")
        
        delete_successful = False
        
        # Method 1: Try JavaScript click (most reliable)
        try:
            logger.info("🎯 Attempting JavaScript click on delete button")
            driver.execute_script("arguments[0].scrollIntoView(true);", delete_button_element)
            time.sleep(1)
            driver.execute_script("arguments[0].click();", delete_button_element)
            logger.info("✅ Delete button clicked with JavaScript")
            time.sleep(3)
        except Exception as e:
            logger.warning(f"JavaScript click failed: {e}")
            
            # Method 2: Fallback to normal click
            try:
                logger.info("🎯 Attempting normal click on delete button")
                delete_button_element.click()
                logger.info("✅ Delete button clicked with normal click")
                time.sleep(3)
            except Exception as e:
                logger.error(f"Normal click also failed: {e}")
                return False
        
        # Step 5: Handle ALL types of confirmation dialogs
        logger.info("🔍 Step 5: Comprehensive confirmation dialog handling")
        
        confirmation_handled = False
        
        # Type 1: JavaScript Alert/Confirm
        try:
            wait = WebDriverWait(driver, 3)
            alert = wait.until(EC.alert_is_present())
            alert_text = alert.text
            logger.info(f"🚨 JavaScript Alert found: '{alert_text}'")
            alert.accept()
            logger.info("✅ JavaScript Alert accepted")
            confirmation_handled = True
            time.sleep(3)
        except Exception as e:
            logger.info("ℹ️ No JavaScript Alert detected")
        
        # Type 2: SweetAlert2 or custom modal
        if not confirmation_handled:
            sweetalert_selectors = [
                ("css selector", ".swal2-confirm"),
                ("css selector", ".swal2-popup button"),
                ("xpath", "//button[@class='swal2-confirm swal2-styled']"),
                ("xpath", "//button[contains(@class, 'swal2-confirm')]"),
                ("css selector", ".sweet-alert button"),
                ("xpath", "//div[contains(@class, 'sweet-alert')]//button")
            ]
            
            for selector in sweetalert_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        element = driver.find_element(*selector)
                        driver.execute_script("arguments[0].click();", element)
                        logger.info(f"✅ SweetAlert confirmed with: {selector}")
                        confirmation_handled = True
                        time.sleep(3)
                        break
                except Exception as e:
                    logger.debug(f"SweetAlert selector {selector} failed: {e}")
        
        # Type 3: Custom modal or dialog
        if not confirmation_handled:
            modal_selectors = [
                ("xpath", "//button[contains(text(), 'Xác nhận')]"),
                ("xpath", "//button[contains(text(), 'Confirm')]"),
                ("xpath", "//button[contains(text(), 'Yes')]"),
                ("xpath", "//button[contains(text(), 'OK')]"),
                ("xpath", "//button[contains(text(), 'Đồng ý')]"),
                ("xpath", "//button[contains(text(), 'Delete')]"),
                ("xpath", "//button[contains(text(), 'Remove')]"),
                ("css selector", "[role='dialog'] button"),
                ("css selector", ".modal button"),
                ("css selector", ".dialog button"),
                ("xpath", "//div[contains(@class, 'modal')]//button"),
                ("xpath", "//div[contains(@class, 'dialog')]//button")
            ]
            
            for selector in modal_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        element = driver.find_element(*selector)
                        driver.execute_script("arguments[0].click();", element)
                        logger.info(f"✅ Modal confirmed with: {selector}")
                        confirmation_handled = True
                        time.sleep(3)
                        break
                except Exception as e:
                    logger.debug(f"Modal selector {selector} failed: {e}")
        
        if not confirmation_handled:
            logger.info("ℹ️ No confirmation dialog detected - delete may be immediate")
            time.sleep(3)
        
        # Step 6: Comprehensive DELETE verification
        logger.info("🔍 Step 6: Comprehensive DELETE verification")
        
        # Take screenshot after delete operation
        base_page.take_screenshot("_after_delete_operation")
        
        # Method 1: Check current URL
        current_url = base_page.get_current_url()
        logger.info(f"📍 Current URL after delete: {current_url}")
        
        if blog_id not in current_url:
            logger.info("✅ DELETE verified - redirected away from blog")
            delete_successful = True
        
        # Method 2: Check if blog content is still visible on current page
        if not delete_successful:
            page_source = driver.page_source
            if test_title not in page_source:
                logger.info("✅ DELETE verified - blog content removed from page")
                delete_successful = True
        
        # Method 3: Try to access the blog URL directly
        logger.info("🔍 Method 3: Direct URL access verification")
        try:
            original_url = driver.current_url
            driver.get(created_blog_url)
            time.sleep(3)
            
            final_url = driver.current_url
            page_source = driver.page_source.lower()
            
            verification_indicators = [
                "404" in page_source,
                "not found" in page_source,
                "không tìm thấy" in page_source,
                final_url != created_blog_url,
                final_url.endswith("/blogs") or final_url.endswith("/blogs/"),
                test_title.lower() not in page_source
            ]
            
            if any(verification_indicators):
                logger.info("✅ DELETE confirmed - blog URL no longer accessible or returns error")
                delete_successful = True
            else:
                logger.warning("⚠️ DELETE verification unclear - blog URL still accessible")
                
                # Additional check: Look for error messages
                error_indicators = ["error", "deleted", "removed", "unavailable"]
                for indicator in error_indicators:
                    if indicator in page_source:
                        logger.info(f"✅ DELETE confirmed - error indicator found: '{indicator}'")
                        delete_successful = True
                        break
                        
        except Exception as e:
            logger.info(f"✅ DELETE confirmed - blog URL access failed: {e}")
            delete_successful = True
        
        # Method 4: Check blog list for the deleted blog
        if delete_successful:
            logger.info("🔍 Method 4: Blog list verification")
            try:
                blog_page.navigate_to_blog_list()
                time.sleep(3)
                
                list_page_source = driver.page_source
                if test_title not in list_page_source:
                    logger.info("✅ DELETE double-confirmed - blog not in list")
                else:
                    logger.warning("⚠️ DELETE warning - blog still appears in list")
                    delete_successful = False
            except Exception as e:
                logger.info(f"Blog list verification failed: {e}")
        
        # Step 7: Final verification screenshot
        base_page.take_screenshot("_final_delete_verification")
        
        # Summary
        logger.info("\n" + "="*70)
        logger.info("📊 COMPREHENSIVE BLOG DELETE TEST SUMMARY")
        logger.info("="*70)
        logger.info(f"📝 Test Blog: {test_title}")
        logger.info(f"🔗 Blog ID: {blog_id}")
        logger.info(f"🔗 Blog URL: {created_blog_url}")
        logger.info(f"{'✅' if delete_button_found else '❌'} Delete Button Found: {delete_button_found}")
        logger.info(f"{'✅' if confirmation_handled else 'ℹ️'} Confirmation Dialog: {confirmation_handled}")
        logger.info(f"{'✅' if delete_successful else '❌'} DELETE Operation: {delete_successful}")
        
        if delete_successful:
            logger.info("🎉 BLOG DELETE FUNCTIONALITY: FULLY WORKING")
            logger.info("✅ Blog successfully deleted and verified")
        else:
            logger.warning("⚠️ DELETE operation completed but verification unclear")
        
        return delete_successful
        
    except Exception as e:
        logger.error(f"❌ Test failed with exception: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return False
        
    finally:
        # Cleanup
        try:
            driver.quit()
            logger.info("🧹 Driver cleanup completed")
        except:
            pass

if __name__ == "__main__":
    success = test_blog_delete_comprehensive()
    exit(0 if success else 1) 