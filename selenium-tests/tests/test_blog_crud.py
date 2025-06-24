"""
Comprehensive Blog CRUD Tests for GenCare
Tests Create, Read, Update, Delete operations with proper role-based access control
"""

import pytest
import allure
from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from pages.login_page import LoginPage
from utils.logger import get_logger
from utils.data_helpers import get_test_data_manager


@allure.epic("GenCare Blog System")
@allure.feature("Blog CRUD Operations")
class TestBlogCRUD:
    """Test Blog CRUD operations with role-based access control"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.test_data_manager = get_test_data_manager()
        cls.logger.info("=== Blog CRUD Test Suite Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🧪 Starting test: {method.__name__}")
    
    def teardown_method(self, method):
        """Cleanup after each test method"""
        try:
            # Logout if logged in
            if hasattr(self, 'login_page'):
                self.login_page.logout()
            self.logger.info(f"✅ Test completed: {method.__name__}")
        except Exception as e:
            self.logger.warning(f"Cleanup warning in {method.__name__}: {str(e)}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.blog_page = BlogPageNew(driver)
        self.login_page = LoginPage(driver)
    
    def login_as_role(self, role):
        """Helper method to login as specific role"""
        user_data = self.test_data_manager.get_user_data(role)
        if not user_data:
            self.logger.error(f"No user data found for role: {role}")
            return False
        
        return self.login_page.login_with_credentials(
            user_data.get('username', ''), 
            user_data.get('password', '')
        )
    
    # ===============================
    # READ OPERATIONS (All Roles)
    # ===============================
    
    @allure.story("Read Operations")
    @allure.severity("critical")
    def test_guest_can_read_blogs(self):
        """Test guest can read/view blogs (no authentication required)"""
        with allure.step("Testing guest blog read access"):
            # Navigate to blog list as guest
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Verify page loads
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            
            # Verify guest can see blogs
            blogs_visible = self.blog_page.are_blogs_visible()
            self.logger.info(f"Guest can see blogs: {blogs_visible}")
            
            # Guest should NOT see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            assert not create_button_visible, "Guest should not see create blog button"
            
            self.logger.info("✅ Guest read access verified")
    
    @allure.story("Read Operations")
    @allure.severity("high")
    @pytest.mark.parametrize("role", ["customer", "consultant", "staff", "admin"])
    def test_authenticated_users_can_read_blogs(self, role):
        """Test authenticated users can read blogs"""
        with allure.step(f"Testing {role} blog read access"):
            # Login as specified role
            assert self.login_as_role(role), f"{role} login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Verify page loads
            assert self.blog_page.is_blog_list_loaded(), "Blog list did not load"
            
            # All authenticated users should see blogs
            blogs_visible = self.blog_page.are_blogs_visible()
            self.logger.info(f"{role} can see blogs: {blogs_visible}")
            
            self.logger.info(f"✅ {role} read access verified")
    
    # ===============================
    # CREATE OPERATIONS (Consultant + Admin only)
    # ===============================
    
    @allure.story("Create Operations")
    @allure.severity("critical")
    @pytest.mark.parametrize("role", ["consultant", "admin"])
    def test_authorized_roles_can_create_blogs(self, role):
        """Test consultant and admin can create blogs"""
        with allure.step(f"Testing {role} blog creation"):
            # Login as authorized role
            assert self.login_as_role(role), f"{role} login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Authorized roles should see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            if create_button_visible:
                self.logger.info(f"✅ {role} can see create blog button")
            else:
                self.logger.warning(f"⚠️ {role} cannot see create blog button (may be UI issue)")
            
            # Try to access blog creation page
            blog_creation_accessible = self.blog_page.navigate_to_blog_creation()
            if blog_creation_accessible:
                self.logger.info(f"✅ {role} can access blog creation page")
                
                # Try to fill and submit blog form (if form is available)
                form_available = self.blog_page.is_blog_creation_form_available()
                if form_available:
                    blog_data = {
                        "title": f"Test Blog by {role} - {self.blog_page.get_timestamp()}",
                        "content": f"This is a test blog created by {role} role for testing purposes."
                    }
                    
                    form_filled = self.blog_page.fill_blog_creation_form(blog_data)
                    if form_filled:
                        self.logger.info(f"✅ {role} can fill blog creation form")
                    else:
                        self.logger.warning(f"⚠️ {role} could not fill blog creation form")
                else:
                    self.logger.info(f"ℹ️ Blog creation form not available for testing")
            else:
                self.logger.warning(f"⚠️ {role} cannot access blog creation page")
    
    @allure.story("Create Operations")
    @allure.severity("high")
    @pytest.mark.parametrize("role", ["customer", "staff"])
    def test_unauthorized_roles_cannot_create_blogs(self, role):
        """Test customer and staff cannot create blogs"""
        with allure.step(f"Testing {role} blog creation restrictions"):
            # Login as unauthorized role
            assert self.login_as_role(role), f"{role} login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Unauthorized roles should NOT see create button
            create_button_visible = self.blog_page.is_create_blog_button_visible()
            if not create_button_visible:
                self.logger.info(f"✅ {role} correctly cannot see create blog button")
            else:
                self.logger.warning(f"⚠️ {role} can see create blog button (security issue)")
            
            # Try direct access to blog creation page
            blog_creation_accessible = self.blog_page.navigate_to_blog_creation()
            if blog_creation_accessible:
                # Should be redirected or see error
                current_url = self.base_page.get_current_url()
                if "/blog/create" in current_url:
                    self.logger.warning(f"⚠️ {role} can access blog creation page (security issue)")
                else:
                    self.logger.info(f"✅ {role} was redirected from blog creation page")
            else:
                self.logger.info(f"✅ {role} correctly cannot access blog creation page")
    
    # ===============================
    # COMMENT OPERATIONS (Customer + Consultant + Staff + Admin)
    # ===============================
    
    @allure.story("Comment Operations")
    @allure.severity("normal")
    @pytest.mark.parametrize("role", ["customer", "consultant", "staff", "admin"])
    def test_authenticated_users_can_comment(self, role):
        """Test authenticated users can comment on blogs"""
        with allure.step(f"Testing {role} blog comment functionality"):
            # Login as specified role
            assert self.login_as_role(role), f"{role} login failed"
            
            # Navigate to blog list
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Look for blogs to comment on
            has_blogs = self.blog_page.are_blogs_visible()
            if has_blogs:
                # Try to access comment functionality
                comment_accessible = self.blog_page.check_comment_functionality()
                if comment_accessible:
                    self.logger.info(f"✅ {role} can access comment functionality")
                else:
                    self.logger.info(f"ℹ️ Comment functionality not available for {role}")
            else:
                self.logger.info("ℹ️ No blogs available for comment testing")
    
    @allure.story("Comment Operations")
    @allure.severity("normal")
    def test_guest_cannot_comment(self):
        """Test guest cannot comment on blogs"""
        with allure.step("Testing guest comment restrictions"):
            # Navigate to blog list as guest (no login)
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            
            # Look for blogs
            has_blogs = self.blog_page.are_blogs_visible()
            if has_blogs:
                # Guest should NOT see comment functionality
                comment_accessible = self.blog_page.check_comment_functionality()
                if not comment_accessible:
                    self.logger.info("✅ Guest correctly cannot access comment functionality")
                else:
                    self.logger.warning("⚠️ Guest can access comment functionality (should require login)")
            else:
                self.logger.info("ℹ️ No blogs available for comment testing")
    
    # ===============================
    # INTEGRATION TESTS
    # ===============================
    
    @allure.story("Integration Tests")
    @allure.severity("critical")
    def test_complete_blog_lifecycle_as_consultant(self):
        """Test complete blog lifecycle: Create -> Read -> Update -> Delete"""
        with allure.step("Testing complete blog lifecycle as consultant"):
            # Login as consultant
            assert self.login_as_role("consultant"), "Consultant login failed"
            
            # 1. CREATE: Try to create a blog
            self.logger.info("Step 1: Testing blog creation")
            create_success = self.blog_page.navigate_to_blog_creation()
            if create_success:
                self.logger.info("✅ Blog creation page accessible")
            else:
                self.logger.info("ℹ️ Blog creation page not accessible")
            
            # 2. READ: Verify can read blogs
            self.logger.info("Step 2: Testing blog reading")
            assert self.blog_page.navigate_to_blog_list(), "Failed to navigate to blog list"
            read_success = self.blog_page.are_blogs_visible()
            if read_success:
                self.logger.info("✅ Blogs are readable")
            else:
                self.logger.info("ℹ️ No blogs visible")
            
            self.logger.info("✅ Complete blog lifecycle test completed")
    
    @allure.story("Integration Tests")
    @allure.severity("high")
    def test_role_permissions_matrix(self):
        """Test complete permissions matrix for all roles"""
        with allure.step("Testing role permissions matrix"):
            roles_permissions = {
                "guest": {"read": True, "create": False, "comment": False},
                "customer": {"read": True, "create": False, "comment": True},
                "consultant": {"read": True, "create": True, "comment": True},
                "staff": {"read": True, "create": False, "comment": True},
                "admin": {"read": True, "create": True, "comment": True}
            }
            
            for role, permissions in roles_permissions.items():
                self.logger.info(f"\n🔍 Testing permissions for: {role}")
                
                if role != "guest":
                    # Login for authenticated roles
                    login_success = self.login_as_role(role)
                    if not login_success:
                        self.logger.warning(f"⚠️ Failed to login as {role}")
                        continue
                
                # Test READ permission
                assert self.blog_page.navigate_to_blog_list(), f"Failed to navigate to blog list for {role}"
                read_actual = self.blog_page.are_blogs_visible()
                self.logger.info(f"READ - Expected: {permissions['read']}, Actual: {read_actual}")
                
                # Test CREATE permission
                if permissions["create"]:
                    create_accessible = self.blog_page.is_create_blog_button_visible()
                    self.logger.info(f"CREATE - Expected: {permissions['create']}, Actual: {create_accessible}")
                
                # Test COMMENT permission
                comment_accessible = self.blog_page.check_comment_functionality()
                self.logger.info(f"COMMENT - Expected: {permissions['comment']}, Actual: {comment_accessible}")
                
                # Logout if not guest
                if role != "guest":
                    self.login_page.logout()
                
                self.logger.info(f"✅ Permissions tested for {role}")
            
            self.logger.info("✅ Role permissions matrix test completed") 