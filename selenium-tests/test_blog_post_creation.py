#!/usr/bin/env python3
"""
Blog Post Creation Test
Test complete blog posting functionality with consultant role
"""

import sys
import os
import time
import random

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.driver_manager import get_driver_manager
from utils.logger import get_logger

def test_blog_post_creation():
    """Test complete blog post creation workflow"""
    logger = get_logger("BlogPostCreationTest")
    logger.info("🧪 Starting blog post creation test")
    
    # Get driver
    driver_manager = get_driver_manager()
    driver = driver_manager.get_driver()
    
    try:
        # Initialize page objects
        base_page = BasePage(driver)
        blog_page = BlogPageNew(driver)
        
        # Generate unique test data
        timestamp = int(time.time())
        test_title = f"Test Blog Post - {timestamp}"
        test_content = f"""
Đây là bài viết test được tạo bởi automated test vào lúc {time.strftime('%Y-%m-%d %H:%M:%S')}.

Nội dung bài viết:
- Đây là test automation cho chức năng tạo blog
- Bài viết này được tạo bởi consultant role
- Timestamp: {timestamp}

Mục đích test:
1. Kiểm tra khả năng đăng nhập của consultant
2. Kiểm tra khả năng tạo bài viết mới
3. Kiểm tra form validation
4. Kiểm tra việc lưu và hiển thị bài viết

Test completed successfully if you can see this post!
        """.strip()
        
        logger.info(f"📝 Test data prepared:")
        logger.info(f"   Title: {test_title}")
        logger.info(f"   Content length: {len(test_content)} characters")
        
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
        
        # Verify login successful
        if "/consultant" not in current_url:
            page_source = base_page.driver.page_source.lower()
            if "consultant" not in page_source and "dashboard" not in page_source:
                logger.error(f"❌ Consultant login failed. Current URL: {current_url}")
                return False
        
        logger.info("✅ Consultant login successful")
        
        # Step 2: Navigate to blogs page
        logger.info("📝 Step 2: Navigating to blogs page")
        
        blog_navigation = blog_page.navigate_to_blog_list()
        if not blog_navigation:
            logger.error("❌ Could not navigate to blogs page")
            return False
        
        time.sleep(3)
        logger.info("✅ Successfully navigated to blogs page")
        
        # Step 3: Click create button
        logger.info("➕ Step 3: Clicking create blog button")
        
        create_button_clicked = base_page.click_element(
            ("xpath", "//button[contains(text(), 'Viết')]")
        )
        
        if not create_button_clicked:
            logger.error("❌ Could not click create blog button")
            return False
        
        time.sleep(3)
        
        # Verify we're on creation page
        current_url = base_page.get_current_url()
        if "create" not in current_url:
            logger.error(f"❌ Not on creation page. Current URL: {current_url}")
            return False
        
        logger.info(f"✅ Successfully navigated to creation page: {current_url}")
        
        # Step 4: Fill blog form
        logger.info("✍️ Step 4: Filling blog creation form")
        
        # Fill title
        title_filled = base_page.type_text(
            ("css selector", "input[placeholder*='tiêu đề']"),
            test_title
        )
        
        if not title_filled:
            # Try alternative selectors
            title_selectors = [
                ("name", "title"),
                ("xpath", "//input[@type='text']"),
                ("css selector", "input[type='text']")
            ]
            
            for selector in title_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        title_filled = base_page.type_text(selector, test_title)
                        if title_filled:
                            logger.info(f"✅ Title filled with selector: {selector}")
                            break
                except:
                    continue
        
        if not title_filled:
            logger.error("❌ Could not fill title field")
            return False
        
        logger.info("✅ Title field filled successfully")
        
        # Fill content
        content_filled = False
        content_selectors = [
            ("name", "content"),
            ("css selector", "textarea"),
            ("xpath", "//textarea"),
            ("css selector", "[contenteditable='true']"),
            ("css selector", ".editor, .content-editor")
        ]
        
        for selector in content_selectors:
            try:
                if base_page.is_element_visible(selector, timeout=2):
                    content_filled = base_page.type_text(selector, test_content)
                    if content_filled:
                        logger.info(f"✅ Content filled with selector: {selector}")
                        break
            except:
                continue
        
        if not content_filled:
            logger.warning("⚠️ Could not fill content field - may not be required or different selector needed")
            # Continue test as content might be optional or use rich text editor
        
        # Step 5: Submit the form
        logger.info("📤 Step 5: Submitting blog post")
        
        # Take screenshot before submission
        base_page.take_screenshot("_before_blog_submit")
        
        # Submit the form
        submit_clicked = base_page.click_element(
            ("xpath", "//button[@type='submit']")
        )
        
        if not submit_clicked:
            # Try alternative submit selectors
            submit_selectors = [
                ("xpath", "//button[contains(text(), 'Đăng')]"),
                ("xpath", "//button[contains(text(), 'Tạo')]"),
                ("xpath", "//button[contains(text(), 'Lưu')]"),
                ("xpath", "//button[contains(text(), 'Xuất bản')]"),
                ("css selector", "button[type='submit']"),
                ("css selector", ".submit-button, .publish-button")
            ]
            
            for selector in submit_selectors:
                try:
                    if base_page.is_element_visible(selector, timeout=2):
                        submit_clicked = base_page.click_element(selector)
                        if submit_clicked:
                            logger.info(f"✅ Submit clicked with selector: {selector}")
                            break
                except:
                    continue
        
        if not submit_clicked:
            logger.error("❌ Could not submit blog form")
            return False
        
        logger.info("✅ Blog form submitted")
        
        # Step 6: Wait for response and verify
        logger.info("⏳ Step 6: Waiting for submission response")
        
        time.sleep(5)
        
        current_url = base_page.get_current_url()
        logger.info(f"📍 After submission URL: {current_url}")
        
        # Check for success indicators
        success_indicators = [
            "blog đã được tạo",
            "thành công",
            "success",
            "đăng thành công",
            "tạo thành công"
        ]
        
        page_source = base_page.driver.page_source.lower()
        success_found = False
        
        for indicator in success_indicators:
            if indicator in page_source:
                success_found = True
                logger.info(f"✅ Success indicator found: '{indicator}'")
                break
        
        # Check if redirected to blog list or blog detail
        if "/blogs" in current_url and "create" not in current_url:
            logger.info("✅ Redirected to blogs page - likely successful")
            success_found = True
        
        # Step 7: Verify blog appears in list
        logger.info("🔍 Step 7: Verifying blog appears in list")
        
        # Navigate to blog list if not already there
        if "create" in current_url:
            blog_page.navigate_to_blog_list()
            time.sleep(3)
        
        # Look for our blog title in the page
        if test_title in base_page.driver.page_source:
            logger.info("✅ Blog title found in blog list!")
            success_found = True
        else:
            logger.warning("⚠️ Blog title not immediately visible in list")
            
            # Check if we need to scroll or load more
            try:
                # Scroll down to load more blogs
                base_page.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                if test_title in base_page.driver.page_source:
                    logger.info("✅ Blog title found after scrolling!")
                    success_found = True
            except:
                pass
        
        # Take final screenshot
        base_page.take_screenshot("_after_blog_creation")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 BLOG POST CREATION TEST SUMMARY")
        logger.info("="*60)
        logger.info(f"📝 Blog Title: {test_title}")
        logger.info(f"✅ Consultant Login: Success")
        logger.info(f"✅ Navigation to Creation Page: Success")
        logger.info(f"✅ Form Filling: Title={title_filled}, Content={content_filled}")
        logger.info(f"✅ Form Submission: {submit_clicked}")
        logger.info(f"{'✅' if success_found else '❌'} Blog Creation Success: {success_found}")
        
        if success_found:
            logger.info("🎉 BLOG POST CREATION TEST: PASSED")
            logger.info(f"🔗 Final URL: {current_url}")
        else:
            logger.warning("⚠️ BLOG POST CREATION TEST: UNCLEAR RESULT")
            logger.info("   Form was submitted but success confirmation unclear")
        
        return success_found
        
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
    success = test_blog_post_creation()
    exit(0 if success else 1) 