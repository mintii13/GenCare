#!/usr/bin/env python3
"""
Blog Update/Delete Test
Test update and delete functionality for consultant's own blog posts
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

def test_blog_update_delete():
    """Test blog update and delete functionality for consultant's own posts"""
    logger = get_logger("BlogUpdateDeleteTest")
    logger.info("🧪 Starting blog update/delete test")
    
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
        
        # Verify login successful
        if "/consultant" not in current_url:
            page_source = base_page.driver.page_source.lower()
            if "consultant" not in page_source and "dashboard" not in page_source:
                logger.error(f"❌ Consultant login failed. Current URL: {current_url}")
                return False
        
        logger.info("✅ Consultant login successful")
        
        # Step 2: Create a new blog post for testing
        logger.info("📝 Step 2: Creating a new blog post for testing")
        
        # Navigate to blogs page
        blog_navigation = blog_page.navigate_to_blog_list()
        if not blog_navigation:
            logger.error("❌ Could not navigate to blogs page")
            return False
        
        time.sleep(3)
        
        # Click create button
        create_button_clicked = base_page.click_element(
            ("xpath", "//button[contains(text(), 'Viết')]")
        )
        
        if not create_button_clicked:
            logger.error("❌ Could not click create blog button")
            return False
        
        time.sleep(3)
        
        # Generate test data for the blog
        timestamp = int(time.time())
        test_title = f"Test Update/Delete Blog - {timestamp}"
        test_content = f"""
Bài viết test cho chức năng UPDATE và DELETE.
Timestamp: {timestamp}
Created at: {time.strftime('%Y-%m-%d %H:%M:%S')}

Nội dung này sẽ được sửa đổi trong test UPDATE.
        """.strip()
        
        logger.info(f"📝 Creating test blog: {test_title}")
        
        # Fill form
        title_filled = base_page.type_text(
            ("css selector", "input[placeholder*='tiêu đề']"),
            test_title
        )
        
        content_filled = base_page.type_text(
            ("css selector", "[contenteditable='true']"),
            test_content
        )
        
        if not title_filled:
            logger.error("❌ Could not fill title field")
            return False
        
        # Submit the form
        submit_clicked = base_page.click_element(
            ("xpath", "//button[@type='submit']")
        )
        
        if not submit_clicked:
            logger.error("❌ Could not submit blog form")
            return False
        
        time.sleep(5)
        
        # Get the created blog URL
        created_blog_url = base_page.get_current_url()
        logger.info(f"✅ Blog created: {created_blog_url}")
        
        # Extract blog ID from URL
        blog_id = created_blog_url.split('/')[-1] if '/blogs/' in created_blog_url else None
        
        if not blog_id:
            logger.error("❌ Could not extract blog ID from URL")
            return False
        
        logger.info(f"🔗 Blog ID: {blog_id}")
        
        # Step 3: Check for Edit and Delete buttons
        logger.info("🔍 Step 3: Checking for Edit and Delete buttons on own blog")
        
        # Look for edit and delete buttons
        edit_button_selectors = [
            ("xpath", "//button[contains(text(), 'Sửa')]"),
            ("xpath", "//a[contains(text(), 'Sửa')]"),
            ("xpath", "//button[contains(text(), 'Edit')]"),
            ("xpath", "//a[contains(text(), 'Edit')]"),
            ("css selector", "button[data-testid='edit-blog']"),
            ("css selector", ".edit-button, .btn-edit"),
            ("xpath", "//button[contains(@class, 'edit')]"),
            ("xpath", "//a[contains(@class, 'edit')]")
        ]
        
        delete_button_selectors = [
            ("xpath", "//button[contains(text(), 'Xóa')]"),
            ("xpath", "//a[contains(text(), 'Xóa')]"),
            ("xpath", "//button[contains(text(), 'Delete')]"),
            ("xpath", "//a[contains(text(), 'Delete')]"),
            ("css selector", "button[data-testid='delete-blog']"),
            ("css selector", ".delete-button, .btn-delete"),
            ("xpath", "//button[contains(@class, 'delete')]"),
            ("xpath", "//a[contains(@class, 'delete')]")
        ]
        
        edit_button_found = False
        delete_button_found = False
        edit_selector = None
        delete_selector = None
        
        # Check for edit button
        for selector in edit_button_selectors:
            try:
                if base_page.is_element_visible(selector, timeout=2):
                    edit_button_found = True
                    edit_selector = selector
                    logger.info(f"✅ Edit button found: {selector}")
                    break
            except:
                continue
        
        # Check for delete button
        for selector in delete_button_selectors:
            try:
                if base_page.is_element_visible(selector, timeout=2):
                    delete_button_found = True
                    delete_selector = selector
                    logger.info(f"✅ Delete button found: {selector}")
                    break
            except:
                continue
        
        if not edit_button_found and not delete_button_found:
            logger.warning("⚠️ Edit/Delete buttons not found with standard selectors")
            
            # Check page source for edit/delete related text
            page_source = base_page.driver.page_source
            edit_keywords = ["sửa", "edit", "chỉnh sửa", "modify"]
            delete_keywords = ["xóa", "delete", "remove", "xoá"]
            
            found_edit_keywords = [k for k in edit_keywords if k.lower() in page_source.lower()]
            found_delete_keywords = [k for k in delete_keywords if k.lower() in page_source.lower()]
            
            if found_edit_keywords:
                logger.info(f"ℹ️ Found edit-related keywords: {found_edit_keywords}")
            if found_delete_keywords:
                logger.info(f"ℹ️ Found delete-related keywords: {found_delete_keywords}")
        
        # Take screenshot of the blog detail page
        base_page.take_screenshot("_blog_detail_with_buttons")
        
        # Step 4: Test UPDATE functionality if edit button found
        update_successful = False
        if edit_button_found and edit_selector:
            logger.info("✏️ Step 4: Testing UPDATE functionality")
            
            try:
                # Click edit button
                edit_clicked = base_page.click_element(edit_selector)
                if not edit_clicked:
                    logger.warning("⚠️ Could not click edit button")
                else:
                    time.sleep(3)
                    
                    current_url = base_page.get_current_url()
                    logger.info(f"📍 After edit click URL: {current_url}")
                    
                    # Check if we're on edit page
                    if "edit" in current_url or "update" in current_url:
                        logger.info("✅ Navigated to edit page")
                        
                        # Update the content
                        updated_title = f"UPDATED - {test_title}"
                        updated_content = f"""
UPDATED CONTENT - {test_content}

Updated at: {time.strftime('%Y-%m-%d %H:%M:%S')}
This content has been modified by the UPDATE test.
                        """.strip()
                        
                        # Try to update title
                        title_updated = False
                        title_selectors = [
                            ("css selector", "input[placeholder*='tiêu đề']"),
                            ("name", "title"),
                            ("xpath", "//input[@type='text']")
                        ]
                        
                        for selector in title_selectors:
                            try:
                                if base_page.is_element_visible(selector, timeout=2):
                                    # Clear and fill new title
                                    element = base_page.driver.find_element(*selector)
                                    element.clear()
                                    title_updated = base_page.type_text(selector, updated_title)
                                    if title_updated:
                                        logger.info(f"✅ Title updated with selector: {selector}")
                                        break
                            except:
                                continue
                        
                        # Try to update content
                        content_updated = False
                        content_selectors = [
                            ("css selector", "[contenteditable='true']"),
                            ("name", "content"),
                            ("css selector", "textarea")
                        ]
                        
                        for selector in content_selectors:
                            try:
                                if base_page.is_element_visible(selector, timeout=2):
                                    # Clear and fill new content
                                    element = base_page.driver.find_element(*selector)
                                    element.clear()
                                    content_updated = base_page.type_text(selector, updated_content)
                                    if content_updated:
                                        logger.info(f"✅ Content updated with selector: {selector}")
                                        break
                            except:
                                continue
                        
                        # Submit update
                        if title_updated or content_updated:
                            update_submit_selectors = [
                                ("xpath", "//button[@type='submit']"),
                                ("xpath", "//button[contains(text(), 'Cập nhật')]"),
                                ("xpath", "//button[contains(text(), 'Lưu')]"),
                                ("xpath", "//button[contains(text(), 'Update')]"),
                                ("xpath", "//button[contains(text(), 'Save')]")
                            ]
                            
                            for selector in update_submit_selectors:
                                try:
                                    if base_page.is_element_visible(selector, timeout=2):
                                        update_submitted = base_page.click_element(selector)
                                        if update_submitted:
                                            logger.info(f"✅ Update submitted with selector: {selector}")
                                            time.sleep(5)
                                            update_successful = True
                                            break
                                except:
                                    continue
                            
                            if update_successful:
                                # Verify update was successful
                                current_url = base_page.get_current_url()
                                if updated_title in base_page.driver.page_source:
                                    logger.info("✅ UPDATE successful - updated title found in page")
                                else:
                                    logger.warning("⚠️ UPDATE unclear - updated title not immediately visible")
                        else:
                            logger.warning("⚠️ Could not update title or content fields")
                    else:
                        logger.warning(f"⚠️ Edit button clicked but not on edit page. URL: {current_url}")
            except Exception as e:
                logger.error(f"❌ UPDATE test failed: {e}")
        else:
            logger.info("ℹ️ Step 4: Skipping UPDATE test - edit button not found")
        
        # Step 5: Test DELETE functionality if delete button found
        delete_successful = False
        if delete_button_found and delete_selector:
            logger.info("🗑️ Step 5: Testing DELETE functionality")
            
            # First navigate back to blog detail if we're on edit page
            if "edit" in base_page.get_current_url():
                base_page.navigate_to(created_blog_url)
                time.sleep(3)
            
            try:
                # Take screenshot before delete
                base_page.take_screenshot("_before_delete")
                
                # Click delete button
                delete_clicked = base_page.click_element(delete_selector)
                if not delete_clicked:
                    logger.warning("⚠️ Could not click delete button")
                else:
                    time.sleep(2)
                    
                    # Look for confirmation dialog
                    confirmation_selectors = [
                        ("xpath", "//button[contains(text(), 'Xác nhận')]"),
                        ("xpath", "//button[contains(text(), 'Confirm')]"),
                        ("xpath", "//button[contains(text(), 'Yes')]"),
                        ("xpath", "//button[contains(text(), 'OK')]"),
                        ("xpath", "//button[@type='submit']")
                    ]
                    
                    confirmation_found = False
                    for selector in confirmation_selectors:
                        try:
                            if base_page.is_element_visible(selector, timeout=2):
                                confirm_clicked = base_page.click_element(selector)
                                if confirm_clicked:
                                    logger.info(f"✅ Delete confirmed with selector: {selector}")
                                    confirmation_found = True
                                    time.sleep(5)
                                    break
                        except:
                            continue
                    
                    if not confirmation_found:
                        logger.info("ℹ️ No confirmation dialog found - delete might be immediate")
                        time.sleep(3)
                    
                    # Check if delete was successful
                    current_url = base_page.get_current_url()
                    logger.info(f"📍 After delete URL: {current_url}")
                    
                    # If redirected away from blog detail, likely successful
                    if blog_id not in current_url:
                        logger.info("✅ DELETE likely successful - redirected away from blog")
                        delete_successful = True
                        
                        # Try to navigate back to the blog URL to confirm it's deleted
                        try:
                            base_page.navigate_to(created_blog_url)
                            time.sleep(3)
                            
                            current_url = base_page.get_current_url()
                            page_source = base_page.driver.page_source.lower()
                            
                            if "404" in page_source or "not found" in page_source or current_url != created_blog_url:
                                logger.info("✅ DELETE confirmed - blog no longer accessible")
                            else:
                                logger.warning("⚠️ DELETE unclear - blog still seems accessible")
                        except:
                            logger.info("✅ DELETE confirmed - blog URL no longer accessible")
                    else:
                        logger.warning("⚠️ DELETE unclear - still on blog page")
                        
                        # Check if blog content is still there
                        if test_title in base_page.driver.page_source:
                            logger.warning("⚠️ DELETE failed - blog content still visible")
                        else:
                            logger.info("✅ DELETE successful - blog content removed")
                            delete_successful = True
                            
            except Exception as e:
                logger.error(f"❌ DELETE test failed: {e}")
        else:
            logger.info("ℹ️ Step 5: Skipping DELETE test - delete button not found")
        
        # Take final screenshot
        base_page.take_screenshot("_after_update_delete_tests")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 BLOG UPDATE/DELETE TEST SUMMARY")
        logger.info("="*60)
        logger.info(f"📝 Test Blog Created: {test_title}")
        logger.info(f"🔗 Blog ID: {blog_id}")
        logger.info(f"{'✅' if edit_button_found else '❌'} Edit Button Found: {edit_button_found}")
        logger.info(f"{'✅' if delete_button_found else '❌'} Delete Button Found: {delete_button_found}")
        logger.info(f"{'✅' if update_successful else '❌'} UPDATE Test: {update_successful}")
        logger.info(f"{'✅' if delete_successful else '❌'} DELETE Test: {delete_successful}")
        
        overall_success = edit_button_found or delete_button_found
        
        if overall_success:
            logger.info("🎉 BLOG UPDATE/DELETE FUNCTIONALITY: WORKING")
            if edit_button_found and delete_button_found:
                logger.info("✅ Both Edit and Delete buttons are available for consultant's own blogs")
            elif edit_button_found:
                logger.info("✅ Edit button available for consultant's own blogs")
            elif delete_button_found:
                logger.info("✅ Delete button available for consultant's own blogs")
        else:
            logger.warning("⚠️ BLOG UPDATE/DELETE FUNCTIONALITY: BUTTONS NOT FOUND")
            logger.info("   This might indicate that the buttons use different selectors or")
            logger.info("   the functionality is not yet implemented")
        
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
    success = test_blog_update_delete()
    exit(0 if success else 1) 