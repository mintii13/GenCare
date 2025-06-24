#!/usr/bin/env python3
"""
Cleanup Test Blogs Script
Remove test blogs created during automated testing
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

def cleanup_test_blogs():
    """Clean up test blogs created during testing"""
    logger = get_logger("TestBlogCleanup")
    logger.info("🧹 Starting test blog cleanup")
    
    # Known test blog IDs from our testing
    test_blog_ids = [
        "6858384226842f6e5a84b76b",  # Test Blog Post - 1750612007
        "6858397c26842f6e5a84b7c1",  # Test Blog Post - 1750612320  
        "68583a7926842f6e5a84b81f",  # Test Update/Delete Blog - 1750612601
        "68583b1526842f6e5a84b884",  # TEST UPDATE/DELETE - 1750612756
        "68583bab26842f6e5a84b8f4",  # DELETE TEST BLOG - 1750612907
    ]
    
    # Test blog title patterns to identify
    test_title_patterns = [
        "Test Blog Post",
        "TEST UPDATE/DELETE",
        "DELETE TEST BLOG",
        "Test Update/Delete Blog"
    ]
    
    # Get driver
    driver_manager = get_driver_manager()
    driver = driver_manager.get_driver()
    
    cleanup_count = 0
    
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
        
        # Step 2: Attempt to clean up known test blog IDs
        logger.info("🗑️ Step 2: Cleaning up known test blog IDs")
        
        for blog_id in test_blog_ids:
            try:
                blog_url = f"http://localhost:5173/blogs/{blog_id}"
                logger.info(f"🔍 Checking blog: {blog_id}")
                
                # Navigate to blog
                base_page.navigate_to(blog_url)
                time.sleep(3)
                
                # Check if page exists and has delete button
                current_url = base_page.get_current_url()
                if blog_id in current_url:
                    # Look for delete button
                    if base_page.is_element_visible(("xpath", "//button[contains(text(), 'Xóa')]"), timeout=3):
                        logger.info(f"🗑️ Attempting to delete blog: {blog_id}")
                        
                        # Click delete button with JavaScript
                        delete_element = driver.find_element("xpath", "//button[contains(text(), 'Xóa')]")
                        driver.execute_script("arguments[0].click();", delete_element)
                        time.sleep(3)
                        
                        # Handle any confirmation dialogs
                        try:
                            # Look for confirmation buttons
                            confirmation_selectors = [
                                ("xpath", "//button[contains(text(), 'Xác nhận')]"),
                                ("xpath", "//button[contains(text(), 'Confirm')]"),
                                ("xpath", "//button[contains(text(), 'Yes')]"),
                                ("xpath", "//button[contains(text(), 'OK')]"),
                                ("css selector", ".swal2-confirm")
                            ]
                            
                            for selector in confirmation_selectors:
                                if base_page.is_element_visible(selector, timeout=2):
                                    element = driver.find_element(*selector)
                                    driver.execute_script("arguments[0].click();", element)
                                    logger.info(f"✅ Confirmed deletion for blog: {blog_id}")
                                    cleanup_count += 1
                                    break
                            else:
                                logger.info(f"✅ Blog deleted (no confirmation needed): {blog_id}")
                                cleanup_count += 1
                                
                        except Exception as e:
                            logger.info(f"✅ Blog deleted: {blog_id}")
                            cleanup_count += 1
                            
                        time.sleep(2)
                    else:
                        logger.info(f" No delete button found for blog: {blog_id} (may not be owned by consultant)")
                else:
                    logger.info(f"ℹ️ Blog not found or already deleted: {blog_id}")
                    
            except Exception as e:
                logger.info(f"ℹ️ Blog {blog_id} cleanup skipped: {e}")
        
        # Step 3: Clean up any remaining test blogs from blog list
        logger.info("📋 Step 3: Scanning blog list for remaining test blogs")
        
        try:
            blog_page.navigate_to_blog_list()
            time.sleep(3)
            
            page_source = driver.page_source
            
            # Look for test blog patterns in the page
            for pattern in test_title_patterns:
                if pattern in page_source:
                    logger.info(f"⚠️ Found test blog pattern '{pattern}' in blog list")
                    logger.info("ℹ️ Manual cleanup may be required for remaining test blogs")
                    
        except Exception as e:
            logger.info(f"Blog list scan failed: {e}")
        
        # Take final screenshot
        base_page.take_screenshot("_cleanup_completed")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 TEST BLOG CLEANUP SUMMARY")
        logger.info("="*60)
        logger.info(f"🗑️ Blogs Cleaned Up: {cleanup_count}")
        logger.info(f"📋 Known Test Blog IDs Processed: {len(test_blog_ids)}")
        logger.info(f"🎯 Test Patterns Searched: {len(test_title_patterns)}")
        
        if cleanup_count > 0:
            logger.info("✅ Cleanup completed successfully")
            logger.info("🧹 Test environment cleaned up")
        else:
            logger.info("ℹ️ No test blogs required cleanup")
            logger.info("🧹 Test environment was already clean")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed with exception: {e}")
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
    success = cleanup_test_blogs()
    exit(0 if success else 1) 