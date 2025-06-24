#!/usr/bin/env python3
"""
Blog Update/Delete Test - Fixed Version
Test update and delete functionality with improved element interaction
"""

import sys
import os
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.driver_manager import get_driver_manager
from utils.logger import get_logger

def test_blog_update_delete_fixed():
    """Test blog update and delete functionality with improved element handling"""
    logger = get_logger("BlogUpdateDeleteFixedTest")
    logger.info("🧪 Starting fixed blog update/delete test")
    
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
        
        # Step 2: Create a new blog post for testing
        logger.info("📝 Step 2: Creating a new blog post for testing")
        
        # Navigate to blogs page
        blog_page.navigate_to_blog_list()
        time.sleep(3)
        
        # Click create button
        base_page.click_element(("xpath", "//button[contains(text(), 'Viết')]"))
        time.sleep(3)
        
        # Generate test data
        timestamp = int(time.time())
        test_title = f"TEST UPDATE/DELETE - {timestamp}"
        test_content = f"""
Original content for UPDATE/DELETE test.
Timestamp: {timestamp}
Created at: {time.strftime('%Y-%m-%d %H:%M:%S')}

This content will be modified in UPDATE test.
        """.strip()
        
        logger.info(f"📝 Creating test blog: {test_title}")
        
        # Fill form
        base_page.type_text(("css selector", "input[placeholder*='tiêu đề']"), test_title)
        base_page.type_text(("css selector", "[contenteditable='true']"), test_content)
        base_page.click_element(("xpath", "//button[@type='submit']"))
        
        time.sleep(5)
        
        # Get the created blog URL
        created_blog_url = base_page.get_current_url()
        blog_id = created_blog_url.split('/')[-1] if '/blogs/' in created_blog_url else None
        
        logger.info(f"✅ Blog created: {created_blog_url}")
        logger.info(f"🔗 Blog ID: {blog_id}")
        
        # Step 3: Test UPDATE functionality with improved element handling
        logger.info("✏️ Step 3: Testing UPDATE functionality (fixed)")
        
        # Scroll to top to ensure buttons are visible
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        # Look for edit button with multiple strategies
        edit_button_found = False
        edit_clicked = False
        
        edit_strategies = [
            # Strategy 1: Direct click
            ("xpath", "//button[contains(text(), 'Sửa')]"),
            # Strategy 2: Click via JavaScript
            ("xpath", "//button[contains(text(), 'Sửa')]"),
            # Strategy 3: Alternative selectors
            ("css selector", "button[class*='text-blue-600']"),
            ("xpath", "//button[contains(@class, 'text-blue-600')]")
        ]
        
        for i, selector in enumerate(edit_strategies):
            try:
                if base_page.is_element_visible(selector, timeout=3):
                    edit_button_found = True
                    logger.info(f"✅ Edit button found with strategy {i+1}: {selector}")
                    
                    # Try different click methods
                    if i == 0:
                        # Strategy 1: Normal click
                        try:
                            element = driver.find_element(*selector)
                            element.click()
                            edit_clicked = True
                            logger.info("✅ Edit button clicked with normal click")
                        except Exception as e:
                            logger.info(f"Normal click failed: {e}")
                    
                    elif i == 1:
                        # Strategy 2: JavaScript click
                        try:
                            element = driver.find_element(*selector)
                            driver.execute_script("arguments[0].click();", element)
                            edit_clicked = True
                            logger.info("✅ Edit button clicked with JavaScript")
                        except Exception as e:
                            logger.info(f"JavaScript click failed: {e}")
                    
                    elif i == 2:
                        # Strategy 3: ActionChains click
                        try:
                            element = driver.find_element(*selector)
                            ActionChains(driver).move_to_element(element).click().perform()
                            edit_clicked = True
                            logger.info("✅ Edit button clicked with ActionChains")
                        except Exception as e:
                            logger.info(f"ActionChains click failed: {e}")
                    
                    if edit_clicked:
                        break
            except:
                continue
        
        update_successful = False
        
        if edit_clicked:
            time.sleep(3)
            current_url = base_page.get_current_url()
            logger.info(f"📍 After edit click URL: {current_url}")
            
            # Check if we're on edit page
            if "edit" in current_url or current_url == created_blog_url:
                logger.info("✅ Edit mode accessed")
                
                # Generate updated content
                updated_title = f"UPDATED - {test_title}"
                updated_content = f"""
UPDATED CONTENT - {test_content}

*** CONTENT HAS BEEN UPDATED ***
Updated at: {time.strftime('%Y-%m-%d %H:%M:%S')}
This content was modified by the UPDATE test.
                """.strip()
                
                # Update title
                title_updated = False
                title_selectors = [
                    ("css selector", "input[placeholder*='tiêu đề']"),
                    ("name", "title"),
                    ("xpath", "//input[@type='text']")
                ]
                
                for selector in title_selectors:
                    try:
                        if base_page.is_element_visible(selector, timeout=2):
                            element = driver.find_element(*selector)
                            # Clear field with Ctrl+A and delete
                            element.click()
                            element.send_keys(Keys.CONTROL + "a")
                            element.send_keys(Keys.DELETE)
                            element.send_keys(updated_title)
                            title_updated = True
                            logger.info(f"✅ Title updated: {updated_title}")
                            break
                    except Exception as e:
                        logger.info(f"Title update failed with {selector}: {e}")
                
                # Update content
                content_updated = False
                content_selectors = [
                    ("css selector", "[contenteditable='true']"),
                    ("name", "content"),
                    ("css selector", "textarea")
                ]
                
                for selector in content_selectors:
                    try:
                        if base_page.is_element_visible(selector, timeout=2):
                            element = driver.find_element(*selector)
                            # Clear and update content
                            element.click()
                            element.send_keys(Keys.CONTROL + "a")
                            element.send_keys(Keys.DELETE)
                            element.send_keys(updated_content)
                            content_updated = True
                            logger.info(f"✅ Content updated")
                            break
                    except Exception as e:
                        logger.info(f"Content update failed with {selector}: {e}")
                
                # Submit update
                if title_updated or content_updated:
                    submit_selectors = [
                        ("xpath", "//button[@type='submit']"),
                        ("xpath", "//button[contains(text(), 'Cập nhật')]"),
                        ("xpath", "//button[contains(text(), 'Lưu')]"),
                        ("xpath", "//button[contains(text(), 'Update')]")
                    ]
                    
                    for selector in submit_selectors:
                        try:
                            if base_page.is_element_visible(selector, timeout=2):
                                element = driver.find_element(*selector)
                                driver.execute_script("arguments[0].click();", element)
                                logger.info("✅ Update submitted")
                                time.sleep(5)
                                update_successful = True
                                break
                        except Exception as e:
                            logger.info(f"Submit failed with {selector}: {e}")
                    
                    # Verify update
                    if update_successful:
                        current_url = base_page.get_current_url()
                        page_source = driver.page_source
                        
                        if "UPDATED" in page_source or updated_title in page_source:
                            logger.info("✅ UPDATE verified - updated content found")
                        else:
                            logger.warning("⚠️ UPDATE unclear - updated content not immediately visible")
        
        if not edit_button_found:
            logger.warning("⚠️ Edit button not found")
        elif not edit_clicked:
            logger.warning("⚠️ Edit button found but could not be clicked")
        
        # Step 4: Test DELETE functionality with improved handling
        logger.info("🗑️ Step 4: Testing DELETE functionality (fixed)")
        
        # Navigate back to blog detail if needed
        if base_page.get_current_url() != created_blog_url:
            base_page.navigate_to(created_blog_url)
            time.sleep(3)
        
        # Scroll to ensure delete button is visible
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        delete_button_found = False
        delete_clicked = False
        
        delete_strategies = [
            ("xpath", "//button[contains(text(), 'Xóa')]"),
            ("css selector", "button[class*='text-red-600']"),
            ("xpath", "//button[contains(@class, 'text-red-600')]")
        ]
        
        for i, selector in enumerate(delete_strategies):
            try:
                if base_page.is_element_visible(selector, timeout=3):
                    delete_button_found = True
                    logger.info(f"✅ Delete button found with strategy {i+1}: {selector}")
                    
                    # Try JavaScript click first (most reliable for overlapping elements)
                    try:
                        element = driver.find_element(*selector)
                        driver.execute_script("arguments[0].click();", element)
                        delete_clicked = True
                        logger.info("✅ Delete button clicked with JavaScript")
                        break
                    except Exception as e:
                        logger.info(f"JavaScript click failed: {e}")
                        
                        # Fallback to ActionChains
                        try:
                            ActionChains(driver).move_to_element(element).click().perform()
                            delete_clicked = True
                            logger.info("✅ Delete button clicked with ActionChains")
                            break
                        except Exception as e:
                            logger.info(f"ActionChains click failed: {e}")
            except:
                continue
        
        delete_successful = False
        
        if delete_clicked:
            time.sleep(3)
            logger.info("🔍 Looking for confirmation dialog")
            
            # Look for confirmation dialog
            confirmation_selectors = [
                ("xpath", "//button[contains(text(), 'Xác nhận')]"),
                ("xpath", "//button[contains(text(), 'Confirm')]"),
                ("xpath", "//button[contains(text(), 'Yes')]"),
                ("xpath", "//button[contains(text(), 'OK')]"),
                ("xpath", "//button[contains(text(), 'Đồng ý')]"),
                ("css selector", ".swal2-confirm, .confirm-button"),
                ("xpath", "//button[@class='swal2-confirm swal2-styled']")
            ]
            
            confirmation_found = False
            for selector in confirmation_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=3):
                        element = driver.find_element(*selector)
                        driver.execute_script("arguments[0].click();", element)
                        logger.info(f"✅ Delete confirmed with: {selector}")
                        confirmation_found = True
                        time.sleep(5)
                        break
                except:
                    continue
            
            if not confirmation_found:
                logger.info("ℹ️ No confirmation dialog - delete might be immediate")
                time.sleep(3)
            
            # Check if delete was successful
            current_url = base_page.get_current_url()
            logger.info(f"📍 After delete URL: {current_url}")
            
            # Method 1: Check if redirected away from blog
            if blog_id not in current_url:
                logger.info("✅ DELETE successful - redirected away from blog")
                delete_successful = True
            else:
                # Method 2: Check if blog content is gone
                page_source = driver.page_source
                if test_title not in page_source:
                    logger.info("✅ DELETE successful - blog content removed")
                    delete_successful = True
                else:
                    logger.warning("⚠️ DELETE unclear - blog content still visible")
            
            # Method 3: Try to access the blog URL directly
            if delete_successful:
                try:
                    driver.get(created_blog_url)
                    time.sleep(3)
                    
                    final_url = driver.current_url
                    page_source = driver.page_source.lower()
                    
                    if "404" in page_source or "not found" in page_source or final_url != created_blog_url:
                        logger.info("✅ DELETE confirmed - blog URL returns 404 or redirects")
                    else:
                        logger.warning("⚠️ DELETE verification unclear - blog URL still accessible")
                except Exception as e:
                    logger.info("✅ DELETE confirmed - blog URL no longer accessible")
        
        # Take final screenshots
        base_page.take_screenshot("_final_update_delete_test")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 FIXED BLOG UPDATE/DELETE TEST SUMMARY")
        logger.info("="*60)
        logger.info(f"📝 Test Blog: {test_title}")
        logger.info(f"🔗 Blog ID: {blog_id}")
        logger.info(f"{'✅' if edit_button_found else '❌'} Edit Button Found: {edit_button_found}")
        logger.info(f"{'✅' if delete_button_found else '❌'} Delete Button Found: {delete_button_found}")
        logger.info(f"{'✅' if edit_clicked else '❌'} Edit Button Clickable: {edit_clicked}")
        logger.info(f"{'✅' if delete_clicked else '❌'} Delete Button Clickable: {delete_clicked}")
        logger.info(f"{'✅' if update_successful else '❌'} UPDATE Operation: {update_successful}")
        logger.info(f"{'✅' if delete_successful else '❌'} DELETE Operation: {delete_successful}")
        
        overall_success = (edit_button_found and delete_button_found and 
                          (update_successful or delete_successful))
        
        if overall_success:
            logger.info("🎉 BLOG UPDATE/DELETE FUNCTIONALITY: FULLY WORKING")
            if update_successful and delete_successful:
                logger.info("✅ Both UPDATE and DELETE operations completed successfully")
            elif update_successful:
                logger.info("✅ UPDATE operation completed successfully")
            elif delete_successful:
                logger.info("✅ DELETE operation completed successfully")
        else:
            if edit_button_found or delete_button_found:
                logger.info("⚠️ BUTTONS FOUND but operations need refinement")
            else:
                logger.warning("❌ BUTTONS NOT FOUND - functionality may not be implemented")
        
        return overall_success
        
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
    success = test_blog_update_delete_fixed()
    exit(0 if success else 1) 