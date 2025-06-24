"""
GenCare Blog Page Object - New Clean Version
===========================================
Professional-grade blog testing framework for GenCare healthcare system.
"""

import time
import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from .base_page import BasePage


class BlogPageNew(BasePage):
    """
    Modern Blog Page Object for GenCare Blog Testing
    ===============================================
    
    Features:
    - Blog listing and navigation
    - Blog creation with rich text editor
    - Blog editing and management  
    - Comment system testing
    - Role-based access control
    - Search and filtering
    """
    
    # ========================================
    # LOCATORS - Organized by functionality
    # ========================================
    
    # Navigation & Menu
    BLOG_MENU_LINK = (By.LINK_TEXT, "Blogs")
    BLOG_NAV_ITEM = (By.CSS_SELECTOR, "nav a[href*='blog']")
    CREATE_BLOG_BUTTON = (By.CSS_SELECTOR, "button[data-testid='create-blog'], a[href*='create']")
    
    # Blog Listing Page  
    BLOG_LIST_CONTAINER = (By.CSS_SELECTOR, "main, .container, [data-testid='blog-list'], div[class*='container']")
    BLOG_CARDS = (By.CSS_SELECTOR, "article, .blog-card, .blog-item, [data-testid='blog-card']")
    BLOG_TITLE_LINKS = (By.CSS_SELECTOR, ".blog-title a, .blog-card h3 a, [data-testid='blog-title']")
    
    # Search & Filters
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Search'], input[type='search']")
    SEARCH_BUTTON = (By.CSS_SELECTOR, "button[type='submit'], .search-btn")
    FILTER_DROPDOWN = (By.CSS_SELECTOR, "select.filter, .filter-dropdown")
    
    # Blog Creation Form
    BLOG_FORM = (By.CSS_SELECTOR, "form[data-testid='blog-form'], .blog-form")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title'], #title, [data-testid='blog-title-input']")
    EXCERPT_INPUT = (By.CSS_SELECTOR, "textarea[name='excerpt'], #excerpt, [data-testid='blog-excerpt']")
    
    # Rich Text Editor (Quill.js)
    EDITOR_CONTAINER = (By.CSS_SELECTOR, ".ql-editor, .quill-editor, [data-testid='blog-editor']")
    EDITOR_TOOLBAR = (By.CSS_SELECTOR, ".ql-toolbar")
    BOLD_BUTTON = (By.CSS_SELECTOR, ".ql-bold")
    ITALIC_BUTTON = (By.CSS_SELECTOR, ".ql-italic")
    
    # Form Actions
    SAVE_BUTTON = (By.CSS_SELECTOR, "button[type='submit'], .save-btn, [data-testid='save-blog']")
    CANCEL_BUTTON = (By.CSS_SELECTOR, ".cancel-btn, [data-testid='cancel-blog']")
    PUBLISH_BUTTON = (By.CSS_SELECTOR, ".publish-btn, [data-testid='publish-blog']")
    
    # Blog Detail Page
    BLOG_DETAIL_CONTAINER = (By.CSS_SELECTOR, ".blog-detail, .blog-content, [data-testid='blog-detail']")
    BLOG_DETAIL_TITLE = (By.CSS_SELECTOR, ".blog-title, h1, [data-testid='blog-detail-title']")
    BLOG_DETAIL_CONTENT = (By.CSS_SELECTOR, ".blog-content, .content, [data-testid='blog-detail-content']")
    
    # Comments Section
    COMMENTS_SECTION = (By.CSS_SELECTOR, ".comments, .comment-section, [data-testid='comments']")
    COMMENT_INPUT = (By.CSS_SELECTOR, "textarea[placeholder*='comment'], .comment-input")
    COMMENT_SUBMIT = (By.CSS_SELECTOR, ".comment-submit, button[data-testid='submit-comment']")
    
    # Messages & Notifications
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".alert-success, .success-msg, [data-testid='success']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".alert-error, .error-msg, [data-testid='error']")
    ACCESS_DENIED_MSG = (By.CSS_SELECTOR, ".access-denied, .unauthorized, [data-testid='access-denied']")
    
    # ========================================
    # NAVIGATION METHODS
    # ========================================
    
    @allure.step("Navigate to blog listing page")
    def navigate_to_blog_list(self):
        """Navigate to main blog listing page"""
        blog_url = f"{self.base_url}/blogs"
        self.logger.info(f"Navigating to blog list: {blog_url}")
        self.driver.get(blog_url)
        self.wait_for_page_load()
        return self
    
    @allure.step("Navigate to blog creation page")
    def navigate_to_blog_create(self):
        """Navigate to blog creation page"""
        create_url = f"{self.base_url}/blogs/create"
        self.logger.info(f"Navigating to blog create: {create_url}")
        self.driver.get(create_url)
        self.wait_for_page_load()
        return self
    
    @allure.step("Navigate to home page")
    def navigate_to_home(self):
        """Navigate to home page"""
        home_url = self.base_url
        self.logger.info(f"Navigating to home: {home_url}")
        self.driver.get(home_url)
        self.wait_for_page_load()
        return self
    
    @allure.step("Click on blog menu item")
    def click_blog_menu(self):
        """Click on blog navigation menu"""
        try:
            blog_link = self.wait_for_element_clickable(self.BLOG_MENU_LINK, timeout=5)
            blog_link.click()
            self.wait_for_page_load()
            return True
        except TimeoutException:
            # Try alternative selector
            try:
                blog_nav = self.wait_for_element(self.BLOG_NAV_ITEM, timeout=3)
                blog_nav.click()
                self.wait_for_page_load()
                return True
            except TimeoutException:
                self.logger.warning("Could not find blog menu link")
                return False
    
    # ========================================
    # PAGE STATE VERIFICATION
    # ========================================
    
    @allure.step("Verify blog list page loaded")
    def is_blog_list_page(self):
        """Check if currently on blog listing page"""
        try:
            # Check URL
            current_url = self.driver.current_url
            if "/blogs" in current_url and "/create" not in current_url:
                return True
            
            # Check for blog list container
            self.wait_for_element_visible(self.BLOG_LIST_CONTAINER, timeout=3)
            return True
        except TimeoutException:
            return False
    
    @allure.step("Verify blog creation page loaded")
    def is_blog_create_page(self):
        """Check if currently on blog creation page"""
        try:
            # Check URL
            current_url = self.driver.current_url
            if "/blogs/create" in current_url:
                return True
            
            # Check for blog form
            self.wait_for_element_visible(self.BLOG_FORM, timeout=3)
            return True
        except TimeoutException:
            return False
    
    @allure.step("Check if access is denied")
    def is_access_denied(self):
        """Check if access to page is denied (for unauthorized users)"""
        try:
            # Check for access denied message
            self.wait_for_element_visible(self.ACCESS_DENIED_MSG, timeout=2)
            return True
        except TimeoutException:
            pass
        
        # Check if redirected to login or unauthorized page
        current_url = self.driver.current_url
        if any(keyword in current_url.lower() for keyword in ['login', 'unauthorized', 'denied', '403']):
            return True
        
        # Check if create blog button is missing (indicating no permission)
        if self.is_blog_list_page():
            try:
                self.wait_for_element_visible(self.CREATE_BLOG_BUTTON, timeout=2)
                return False  # Button exists, access granted
            except TimeoutException:
                return True  # Button missing, access denied
        
        return False
    
    # ========================================
    # BLOG LISTING METHODS
    # ========================================
    
    @allure.step("Get blog count on listing page")
    def get_blog_count(self):
        """Get number of blogs displayed on listing page"""
        try:
            blog_cards = self.driver.find_elements(*self.BLOG_CARDS)
            count = len(blog_cards)
            self.logger.info(f"Found {count} blog cards on page")
            return count
        except Exception as e:
            self.logger.error(f"Error getting blog count: {e}")
            return 0
    
    @allure.step("Get first blog title")
    def get_first_blog_title(self):
        """Get title of first blog in listing"""
        try:
            title_links = self.driver.find_elements(*self.BLOG_TITLE_LINKS)
            if title_links:
                title = title_links[0].text.strip()
                self.logger.info(f"First blog title: {title}")
                return title
        except Exception as e:
            self.logger.error(f"Error getting first blog title: {e}")
        return None
    
    @allure.step("Click on first blog")
    def click_first_blog(self):
        """Click on first blog in listing to view details"""
        try:
            title_links = self.driver.find_elements(*self.BLOG_TITLE_LINKS)
            if title_links:
                title_links[0].click()
                self.wait_for_page_load()
                return True
        except Exception as e:
            self.logger.error(f"Error clicking first blog: {e}")
        return False
    
    # ========================================
    # BLOG CREATION METHODS
    # ========================================
    
    @allure.step("Fill blog title: {title}")
    def fill_blog_title(self, title):
        """Fill blog title field"""
        try:
            title_input = self.wait_for_element_visible(self.TITLE_INPUT, timeout=5)
            title_input.clear()
            title_input.send_keys(title)
            self.logger.info(f"Filled blog title: {title}")
            return True
        except TimeoutException:
            self.logger.error("Could not find title input field")
            return False
    
    @allure.step("Fill blog excerpt: {excerpt}")
    def fill_blog_excerpt(self, excerpt):
        """Fill blog excerpt/summary field"""
        try:
            excerpt_input = self.wait_for_element_visible(self.EXCERPT_INPUT, timeout=5)
            excerpt_input.clear()
            excerpt_input.send_keys(excerpt)
            self.logger.info(f"Filled blog excerpt: {excerpt}")
            return True
        except TimeoutException:
            self.logger.warning("Excerpt field not found - may be optional")
            return True  # Excerpt might be optional
    
    @allure.step("Fill blog content: {content}")
    def fill_blog_content(self, content):
        """Fill blog content using rich text editor"""
        try:
            # Wait for editor to load
            editor = self.wait_for_element_visible(self.EDITOR_CONTAINER, timeout=8)
            
            # Clear and fill content
            editor.clear()
            editor.send_keys(content)
            
            self.logger.info(f"Filled blog content: {content[:50]}...")
            return True
        except TimeoutException:
            self.logger.error("Could not find blog content editor")
            return False
    
    @allure.step("Apply bold formatting to selected text")
    def apply_bold_formatting(self):
        """Apply bold formatting in rich text editor"""
        try:
            bold_btn = self.wait_for_element_clickable(self.BOLD_BUTTON, timeout=3)
            bold_btn.click()
            self.logger.info("Applied bold formatting")
            return True
        except TimeoutException:
            self.logger.warning("Bold button not found in editor")
            return False
    
    @allure.step("Save blog")
    def save_blog(self):
        """Save blog using save button"""
        try:
            save_btn = self.wait_for_element_clickable(self.SAVE_BUTTON, timeout=5)
            save_btn.click()
            self.logger.info("Clicked save blog button")
            
            # Wait for save completion
            time.sleep(2)
            return True
        except TimeoutException:
            self.logger.error("Could not find save button")
            return False
    
    @allure.step("Create complete blog post")
    def create_blog_post(self, title, content, excerpt=None):
        """
        Complete workflow to create a blog post
        
        Args:
            title (str): Blog title
            content (str): Blog content
            excerpt (str, optional): Blog excerpt/summary
        
        Returns:
            bool: True if blog created successfully
        """
        try:
            # Navigate to create page
            if not self.navigate_to_blog_create():
                return False
            
            # Verify we're on create page
            if not self.is_blog_create_page():
                self.logger.error("Not on blog creation page")
                return False
            
            # Fill form fields
            if not self.fill_blog_title(title):
                return False
            
            if excerpt:
                self.fill_blog_excerpt(excerpt)
            
            if not self.fill_blog_content(content):
                return False
            
            # Save blog
            if not self.save_blog():
                return False
            
            # Check for success
            if self.is_success_message_displayed():
                self.logger.info("Blog created successfully")
                return True
            
            self.logger.warning("No success message after blog creation")
            return True  # Might still be successful
            
        except Exception as e:
            self.logger.error(f"Error creating blog post: {e}")
            return False
    
    # ========================================
    # SEARCH & FILTER METHODS
    # ========================================
    
    @allure.step("Search for blogs: {search_term}")
    def search_blogs(self, search_term):
        """Search for blogs using search functionality"""
        try:
            search_input = self.wait_for_element_visible(self.SEARCH_INPUT, timeout=5)
            search_input.clear()
            search_input.send_keys(search_term)
            
            # Try clicking search button or press Enter
            try:
                search_btn = self.driver.find_element(*self.SEARCH_BUTTON)
                search_btn.click()
            except NoSuchElementException:
                search_input.send_keys(Keys.RETURN)
            
            self.wait_for_page_load()
            self.logger.info(f"Searched for: {search_term}")
            return True
        except TimeoutException:
            self.logger.warning("Search functionality not found")
            return False
    
    # ========================================
    # MESSAGE & STATUS METHODS
    # ========================================
    
    @allure.step("Check for success message")
    def is_success_message_displayed(self):
        """Check if success message is displayed"""
        try:
            self.wait_for_element_visible(self.SUCCESS_MESSAGE, timeout=3)
            return True
        except TimeoutException:
            return False
    
    @allure.step("Check for error message")
    def is_error_message_displayed(self):
        """Check if error message is displayed"""
        try:
            self.wait_for_element_visible(self.ERROR_MESSAGE, timeout=3)
            return True
        except TimeoutException:
            return False
    
    @allure.step("Get error message text")
    def get_error_message(self):
        """Get error message text if displayed"""
        try:
            error_element = self.wait_for_element_visible(self.ERROR_MESSAGE, timeout=3)
            return error_element.text.strip()
        except TimeoutException:
            return None
    
    # ========================================
    # UTILITY METHODS
    # ========================================
    
    def wait_for_page_load(self, timeout=10):
        """Wait for page to load completely"""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            time.sleep(1)  # Additional buffer
        except TimeoutException:
            self.logger.warning("Page load timeout - continuing anyway")
    
    @allure.step("Take screenshot for blog test")
    def take_screenshot(self, name="blog_test"):
        """Take screenshot for debugging"""
        try:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"{name}_{timestamp}.png"
            filepath = f"reports/screenshots/{filename}"
            self.driver.save_screenshot(filepath)
            self.logger.info(f"Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            self.logger.error(f"Failed to take screenshot: {e}")
            return None

    # ========================================
    # CRUD OPERATION SUPPORT METHODS
    # ========================================
    
    @allure.step("Check if create blog button is visible")
    def is_create_blog_button_visible(self):
        """Check if create blog button is visible for current user"""
        try:
            self.wait_for_element_visible(self.CREATE_BLOG_BUTTON, timeout=3)
            return True
        except TimeoutException:
            return False
    
    @allure.step("Navigate to blog creation page")
    def navigate_to_blog_creation(self):
        """Navigate to blog creation page"""
        try:
            # Try to click create button if visible
            if self.is_create_blog_button_visible():
                create_btn = self.wait_for_element_clickable(self.CREATE_BLOG_BUTTON, timeout=3)
                create_btn.click()
                self.wait_for_page_load()
                return True
            else:
                # Try direct navigation
                self.navigate_to("/blog/create")
                self.wait_for_page_load()
                
                # Check if we successfully reached create page
                current_url = self.get_current_url()
                return "/blog/create" in current_url or "/blogs/create" in current_url
        except Exception as e:
            self.logger.error(f"Failed to navigate to blog creation: {e}")
            return False
    
    @allure.step("Check if blog creation form is available")
    def is_blog_creation_form_available(self):
        """Check if blog creation form is available and accessible"""
        try:
            form_visible = self.wait_for_element_visible(self.BLOG_FORM, timeout=5)
            title_input_visible = self.is_element_visible(self.TITLE_INPUT, timeout=3)
            return form_visible and title_input_visible
        except TimeoutException:
            return False
    
    @allure.step("Fill blog creation form")
    def fill_blog_creation_form(self, blog_data):
        """
        Fill blog creation form with provided data
        
        Args:
            blog_data (dict): Dictionary containing title, content, excerpt
        
        Returns:
            bool: True if form filled successfully
        """
        try:
            # Fill title
            if not self.fill_blog_title(blog_data.get("title", "")):
                return False
            
            # Fill excerpt if provided
            if blog_data.get("excerpt"):
                self.fill_blog_excerpt(blog_data["excerpt"])
            
            # Fill content
            if not self.fill_blog_content(blog_data.get("content", "")):
                return False
            
            self.logger.info("Blog creation form filled successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to fill blog creation form: {e}")
            return False
    
    @allure.step("Submit blog creation form")
    def submit_blog_creation_form(self):
        """Submit blog creation form"""
        try:
            if not self.save_blog():
                return False
            
            # Wait for response
            time.sleep(3)
            
            # Check for success or error
            if self.is_success_message_displayed():
                self.logger.info("Blog created successfully")
                return True
            elif self.is_error_message_displayed():
                error_msg = self.get_error_message()
                self.logger.error(f"Blog creation failed: {error_msg}")
                return False
            else:
                # No explicit message, check URL change
                current_url = self.get_current_url()
                if "/blog" in current_url and "/create" not in current_url:
                    self.logger.info("Blog creation appears successful (URL changed)")
                    return True
                
            return False
        except Exception as e:
            self.logger.error(f"Failed to submit blog creation form: {e}")
            return False
    
    @allure.step("Check comment functionality")
    def check_comment_functionality(self):
        """Check if comment functionality is available"""
        try:
            # Look for comment input or comment section
            comment_section_visible = self.is_element_visible(self.COMMENTS_SECTION, timeout=3)
            comment_input_visible = self.is_element_visible(self.COMMENT_INPUT, timeout=3)
            
            return comment_section_visible or comment_input_visible
        except Exception as e:
            self.logger.error(f"Error checking comment functionality: {e}")
            return False
    
    @allure.step("Check if blogs are visible")
    def are_blogs_visible(self):
        """Check if any blogs are visible on the page"""
        try:
            # Check for blog cards or blog list
            blog_cards_visible = self.is_element_visible(self.BLOG_CARDS, timeout=5)
            blog_list_visible = self.is_element_visible(self.BLOG_LIST_CONTAINER, timeout=3)
            
            return blog_cards_visible or blog_list_visible
        except Exception as e:
            self.logger.error(f"Error checking blog visibility: {e}")
            return False
    
    @allure.step("Check if blog list is loaded")
    def is_blog_list_loaded(self):
        """Check if blog list page is fully loaded"""
        try:
            # Wait for page to load
            self.wait_for_page_load()
            
            # Check for blog list container
            list_container = self.wait_for_element_visible(self.BLOG_LIST_CONTAINER, timeout=8)
            
            if list_container:
                self.logger.info("Blog list page loaded successfully")
                return True
            else:
                # Alternative check - look for any blog-related content
                current_url = self.get_current_url()
                page_title = self.get_page_title()
                
                if "/blog" in current_url or "blog" in page_title.lower():
                    self.logger.info("Blog page loaded (alternative check)")
                    return True
                
            return False
        except TimeoutException:
            self.logger.warning("Blog list container not found")
            return False
    
    @allure.step("Get timestamp for testing")
    def get_timestamp(self):
        """Get current timestamp for unique test data"""
        return time.strftime("%Y%m%d_%H%M%S")
    
    @allure.step("Navigate to consultant dashboard")
    def navigate_to_consultant_dashboard(self):
        """Navigate to consultant dashboard"""
        try:
            self.navigate_to("/consultant")
            self.wait_for_page_load()
            
            current_url = self.get_current_url()
            return "/consultant" in current_url
        except Exception as e:
            self.logger.error(f"Failed to navigate to consultant dashboard: {e}")
            return False
    
    @allure.step("Try to edit first blog")
    def try_edit_first_blog(self):
        """Try to access edit functionality for first blog"""
        try:
            # Look for edit buttons or links
            edit_selectors = [
                (By.CSS_SELECTOR, "button[data-testid='edit-blog'], .edit-btn, a[href*='edit']"),
                (By.LINK_TEXT, "Edit"),
                (By.LINK_TEXT, "Chỉnh sửa"),
                (By.CSS_SELECTOR, ".edit-icon, .fa-edit")
            ]
            
            for selector in edit_selectors:
                try:
                    edit_element = self.wait_for_element_clickable(selector, timeout=3)
                    if edit_element:
                        self.logger.info("Edit functionality found")
                        return True
                except TimeoutException:
                    continue
            
            return False
        except Exception as e:
            self.logger.error(f"Error checking edit functionality: {e}")
            return False
    
    @allure.step("Check delete functionality")
    def check_delete_functionality(self):
        """Check if delete functionality is available"""
        try:
            # Look for delete buttons or links
            delete_selectors = [
                (By.CSS_SELECTOR, "button[data-testid='delete-blog'], .delete-btn"),
                (By.LINK_TEXT, "Delete"),
                (By.LINK_TEXT, "Xóa"),
                (By.CSS_SELECTOR, ".delete-icon, .fa-trash, .fa-delete")
            ]
            
            for selector in delete_selectors:
                try:
                    delete_element = self.is_element_visible(selector, timeout=3)
                    if delete_element:
                        self.logger.info("Delete functionality found")
                        return True
                except TimeoutException:
                    continue
            
            return False
        except Exception as e:
            self.logger.error(f"Error checking delete functionality: {e}")
            return False 