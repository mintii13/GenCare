"""
Authorization Test Suite for GenCare
Tests role-based access control and permissions for 5 user roles:
- Guest (anonymous)
- Customer  
- Consultant
- Staff
- Admin
"""

import pytest
import allure
from pages.login_page import LoginPage
from pages.base_page import BasePage
from utils.logger import get_logger


@allure.epic("GenCare Security")
@allure.feature("Authorization & Role-Based Access Control")
class TestAuthorization:
    """Test authorization and role-based access control"""
    
    @pytest.fixture(autouse=True)
    def setup(self, driver, test_data):
        """Setup for each test"""
        self.driver = driver
        self.test_data = test_data
        self.login_page = LoginPage(driver)
        self.base_page = BasePage(driver)
        self.logger = get_logger(self.__class__.__name__)
        
        # Start from clean state
        self.base_page.navigate_to("/")
        if self.base_page.is_user_logged_in():
            self.login_page.logout()
    
    @allure.story("Public Access Tests")
    @allure.severity("normal")
    def test_guest_public_access(self):
        """Test guest (anonymous) access to public pages"""
        with allure.step("Testing guest access to public content"):
            # Ensure logged out (guest state)
            assert not self.base_page.is_user_logged_in(), "Should be in guest state"
            
            public_pages = {
                "/": "Homepage",
                "/blog": "Blog listing",
                "/about": "About page"
            }
            
            for url, description in public_pages.items():
                self.logger.info(f"Testing guest access to {description}: {url}")
                
                # Navigate to public page
                self.base_page.navigate_to(url)
                
                # Should load successfully (no redirect to login)
                current_url = self.base_page.get_current_url()
                page_title = self.base_page.get_page_title()
                
                # Verify page loaded (not redirected to login)
                assert "/login" not in current_url, f"Guest should access {description}"
                assert "GenCare" in page_title or "404" not in page_title, f"{description} should load properly"
                
                self.logger.info(f"✅ Guest can access {description}")
    
    @allure.story("Public Access Tests")
    @allure.severity("critical")
    def test_guest_restricted_access(self):
        """Test guest (anonymous) cannot access restricted areas"""
        with allure.step("Testing guest restrictions on protected content"):
            # Ensure logged out (guest state)
            assert not self.base_page.is_user_logged_in(), "Should be in guest state"
            
            restricted_pages = {
                "/consultant": "Consultant dashboard",
                "/staff": "Staff dashboard", 
                "/admin": "Admin dashboard",
                "/profile": "User profile",
                "/appointments": "Appointments",
                "/consultant/appointments": "Consultant appointments",
                "/staff/users": "Staff user management",
                "/admin/system": "Admin system settings"
            }
            
            for url, description in restricted_pages.items():
                self.logger.info(f"Testing guest restriction for {description}: {url}")
                
                # Try to access restricted page
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should be redirected to login or denied access
                access_denied = (
                    "/login" in current_url or
                    current_url == f"{self.base_page.base_url}/" or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Guest should be denied access to {description}"
                self.logger.info(f"✅ Guest properly denied access to {description}")
    
    @allure.story("Customer Role Tests")
    @allure.severity("high")
    def test_customer_permissions(self):
        """Test customer role permissions and restrictions"""
        with allure.step("Testing customer role permissions"):
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Customer allowed pages
            allowed_pages = {
                "/": "Homepage",
                "/blog": "Blog listing", 
                "/about": "About page",
                "/appointments": "Book appointments",
                "/profile": "Profile page"
            }
            
            for url, description in allowed_pages.items():
                self.logger.info(f"Testing customer access to {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should access these pages
                access_granted = (
                    url in current_url or
                    "/login" not in current_url and "403" not in self.base_page.get_page_title()
                )
                
                assert access_granted, f"Customer should access {description}"
                self.logger.info(f"✅ Customer can access {description}")
            
            # Customer restricted pages
            restricted_pages = {
                "/consultant": "Consultant dashboard",
                "/staff": "Staff dashboard",
                "/admin": "Admin dashboard"
            }
            
            for url, description in restricted_pages.items():
                self.logger.info(f"Testing customer restriction for {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should be denied access
                access_denied = (
                    url not in current_url or
                    "/login" in current_url or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Customer should be denied access to {description}"
                self.logger.info(f"✅ Customer properly denied access to {description}")
            
            # Logout
            assert self.login_page.logout(), "Customer logout failed"
    
    @allure.story("Consultant Role Tests")
    @allure.severity("high")
    def test_consultant_permissions(self):
        """Test consultant role permissions and restrictions"""
        with allure.step("Testing consultant role permissions"):
            # Login as consultant
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            # Consultant allowed pages
            allowed_pages = {
                "/": "Homepage",
                "/blog": "Blog listing",
                "/about": "About page", 
                "/consultant": "Consultant dashboard",
                "/consultant/appointments": "Consultant appointments",
                "/consultant/profile": "Consultant profile",
                "/profile": "Profile page"
            }
            
            for url, description in allowed_pages.items():
                self.logger.info(f"Testing consultant access to {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should access these pages
                access_granted = (
                    url in current_url or
                    "/login" not in current_url and "403" not in self.base_page.get_page_title()
                )
                
                assert access_granted, f"Consultant should access {description}"
                self.logger.info(f"✅ Consultant can access {description}")
            
            # Consultant restricted pages
            restricted_pages = {
                "/staff": "Staff dashboard",
                "/admin": "Admin dashboard",
                "/staff/users": "Staff user management"
            }
            
            for url, description in restricted_pages.items():
                self.logger.info(f"Testing consultant restriction for {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should be denied access
                access_denied = (
                    url not in current_url or
                    "/login" in current_url or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Consultant should be denied access to {description}"
                self.logger.info(f"✅ Consultant properly denied access to {description}")
            
            # Logout
            assert self.login_page.logout(), "Consultant logout failed"
    
    @allure.story("Staff Role Tests")
    @allure.severity("high")
    def test_staff_permissions(self):
        """Test staff role permissions and restrictions"""
        with allure.step("Testing staff role permissions"):
            # Login as staff
            assert self.login_page.quick_login("staff", self.test_data), "Staff login failed"
            
            # Staff allowed pages
            allowed_pages = {
                "/": "Homepage",
                "/blog": "Blog listing",
                "/about": "About page",
                "/staff": "Staff dashboard", 
                "/staff/appointments": "Staff appointments",
                "/staff/users": "Staff user management",
                "/profile": "Profile page"
            }
            
            for url, description in allowed_pages.items():
                self.logger.info(f"Testing staff access to {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should access these pages
                access_granted = (
                    url in current_url or
                    "/login" not in current_url and "403" not in self.base_page.get_page_title()
                )
                
                assert access_granted, f"Staff should access {description}"
                self.logger.info(f"✅ Staff can access {description}")
            
            # Staff restricted pages
            restricted_pages = {
                "/admin": "Admin dashboard",
                "/admin/system": "Admin system settings"
            }
            
            for url, description in restricted_pages.items():
                self.logger.info(f"Testing staff restriction for {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should be denied access
                access_denied = (
                    url not in current_url or
                    "/login" in current_url or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Staff should be denied access to {description}"
                self.logger.info(f"✅ Staff properly denied access to {description}")
            
            # Logout
            assert self.login_page.logout(), "Staff logout failed"
    
    @allure.story("Admin Role Tests")
    @allure.severity("critical")
    def test_admin_permissions(self):
        """Test admin role has full access"""
        with allure.step("Testing admin role full access"):
            # Login as admin
            assert self.login_page.quick_login("admin", self.test_data), "Admin login failed"
            
            # Admin should access all areas
            all_pages = {
                "/": "Homepage",
                "/blog": "Blog listing",
                "/about": "About page",
                "/consultant": "Consultant dashboard",
                "/staff": "Staff dashboard",
                "/admin": "Admin dashboard",
                "/admin/system": "Admin system settings",
                "/profile": "Profile page"
            }
            
            for url, description in all_pages.items():
                self.logger.info(f"Testing admin access to {description}: {url}")
                
                self.base_page.navigate_to(url)
                current_url = self.base_page.get_current_url()
                
                # Should access all pages
                access_granted = (
                    url in current_url or
                    "/login" not in current_url and "403" not in self.base_page.get_page_title()
                )
                
                assert access_granted, f"Admin should have access to {description}"
                self.logger.info(f"✅ Admin can access {description}")
            
            # Logout
            assert self.login_page.logout(), "Admin logout failed"
    
    @allure.story("Role Hierarchy Tests")
    @allure.severity("high")
    def test_role_hierarchy_enforcement(self):
        """Test role hierarchy: Admin > Staff > Consultant > Customer > Guest"""
        with allure.step("Testing role hierarchy enforcement"):
            
            # Define role hierarchy and their exclusive areas
            role_hierarchy = {
                "customer": {
                    "can_access": ["/", "/blog", "/about", "/appointments", "/profile"],
                    "cannot_access": ["/consultant", "/staff", "/admin"]
                },
                "consultant": {
                    "can_access": ["/", "/blog", "/about", "/consultant", "/profile"],
                    "cannot_access": ["/staff", "/admin"]
                },
                "staff": {
                    "can_access": ["/", "/blog", "/about", "/consultant", "/staff", "/profile"],
                    "cannot_access": ["/admin"]
                },
                "admin": {
                    "can_access": ["/", "/blog", "/about", "/consultant", "/staff", "/admin", "/profile"],
                    "cannot_access": []
                }
            }
            
            for role, permissions in role_hierarchy.items():
                self.logger.info(f"Testing role hierarchy for: {role}")
                
                # Login as role
                assert self.login_page.quick_login(role, self.test_data), f"{role} login failed"
                
                # Test allowed access
                for allowed_url in permissions["can_access"]:
                    self.base_page.navigate_to(allowed_url)
                    current_url = self.base_page.get_current_url()
                    
                    access_granted = (
                        allowed_url in current_url or
                        "/login" not in current_url and "403" not in self.base_page.get_page_title()
                    )
                    
                    assert access_granted, f"{role} should access {allowed_url}"
                
                # Test denied access
                for denied_url in permissions["cannot_access"]:
                    self.base_page.navigate_to(denied_url)
                    current_url = self.base_page.get_current_url()
                    
                    access_denied = (
                        denied_url not in current_url or
                        "/login" in current_url or
                        "403" in self.base_page.get_page_title() or
                        self.base_page.get_error_message()
                    )
                    
                    assert access_denied, f"{role} should be denied access to {denied_url}"
                
                # Logout
                assert self.login_page.logout(), f"{role} logout failed"
    
    @allure.story("Privilege Escalation Tests")
    @allure.severity("critical")
    def test_privilege_escalation_prevention(self):
        """Test prevention of privilege escalation attacks"""
        with allure.step("Testing privilege escalation prevention"):
            
            # Login as customer (lowest privilege)
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Try various privilege escalation techniques
            escalation_attempts = [
                "/admin/../admin",
                "/admin/system",
                "/staff/delete-user",
                "/consultant/manage-all",
                "/api/admin/users",
                "/admin?bypass=true"
            ]
            
            for attempt_url in escalation_attempts:
                self.logger.info(f"Testing privilege escalation attempt: {attempt_url}")
                
                self.base_page.navigate_to(attempt_url)
                current_url = self.base_page.get_current_url()
                
                # Should be denied access
                escalation_blocked = (
                    "/admin" not in current_url or
                    "/login" in current_url or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert escalation_blocked, f"Privilege escalation should be blocked: {attempt_url}"
                self.logger.info(f"✅ Privilege escalation blocked: {attempt_url}")
            
            # Logout
            assert self.login_page.logout(), "Customer logout failed"
    
    @allure.story("Session Security Tests")
    @allure.severity("high")
    def test_session_security(self):
        """Test session security and role persistence"""
        with allure.step("Testing session security"):
            
            # Login as consultant
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            # Access consultant area
            self.base_page.navigate_to("/consultant")
            assert "/consultant" in self.base_page.get_current_url(), "Should access consultant area"
            
            # Refresh page - should maintain role
            self.base_page.refresh_page()
            assert "/consultant" in self.base_page.get_current_url(), "Role should persist after refresh"
            
            # Try to access admin area - should be denied
            self.base_page.navigate_to("/admin")
            current_url = self.base_page.get_current_url()
            
            admin_denied = (
                "/admin" not in current_url or
                "403" in self.base_page.get_page_title() or
                self.base_page.get_error_message()
            )
            
            assert admin_denied, "Consultant should not access admin area even with valid session"
            
            # Logout
            assert self.login_page.logout(), "Consultant logout failed"
    
    @allure.story("API Endpoint Security Tests")
    @allure.severity("high")
    def test_api_endpoint_authorization(self):
        """Test API endpoint authorization for different roles"""
        with allure.step("Testing API endpoint authorization"):
            
            # Test as guest (no login)
            api_endpoints = [
                "/api/admin/users",
                "/api/admin/system",
                "/api/staff/appointments",
                "/api/consultant/profile"
            ]
            
            for endpoint in api_endpoints:
                self.logger.info(f"Testing guest access to API: {endpoint}")
                
                self.base_page.navigate_to(endpoint)
                current_url = self.base_page.get_current_url()
                page_content = self.driver.page_source.lower()
                
                # Should be denied or redirected
                api_denied = (
                    "/login" in current_url or
                    "unauthorized" in page_content or
                    "403" in page_content or
                    "401" in page_content
                )
                
                assert api_denied, f"Guest should be denied API access: {endpoint}"
    
    @allure.story("Blog Access Control Tests")
    @allure.severity("normal")
    def test_blog_access_control(self):
        """Test blog access control for different roles"""
        with allure.step("Testing blog access control"):
            
            # Test guest blog access (should be read-only)
            self.base_page.navigate_to("/blog")
            assert "/blog" in self.base_page.get_current_url(), "Guest should view blog"
            
            # Test customer blog access
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            self.base_page.navigate_to("/blog")
            assert "/blog" in self.base_page.get_current_url(), "Customer should view blog"
            
            # Customer might be able to comment but not create blogs
            # (specific implementation depends on blog system)
            
            self.login_page.logout()
            
            # Test consultant blog access (should have create permissions)
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            self.base_page.navigate_to("/blog")
            assert "/blog" in self.base_page.get_current_url(), "Consultant should view blog"
            
            # Try to access blog creation (if available)
            self.base_page.navigate_to("/blog/create")
            create_url = self.base_page.get_current_url()
            
            # Consultant should be able to create blogs
            consultant_can_create = (
                "/blog/create" in create_url or
                "/blog" in create_url and "403" not in self.base_page.get_page_title()
            )
            
            self.logger.info(f"Consultant blog creation access: {consultant_can_create}")
            
            self.login_page.logout()
    
    @allure.story("Appointment Access Control Tests")
    @allure.severity("high")
    def test_appointment_access_control(self):
        """Test appointment system access control"""
        with allure.step("Testing appointment access control"):
            
            # Guest should not access appointments
            self.base_page.navigate_to("/appointments")
            current_url = self.base_page.get_current_url()
            
            guest_denied = (
                "/login" in current_url or
                "403" in self.base_page.get_page_title()
            )
            
            assert guest_denied, "Guest should not access appointments"
            
            # Customer should access appointment booking
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            self.base_page.navigate_to("/appointments")
            customer_url = self.base_page.get_current_url()
            
            customer_can_book = (
                "/appointments" in customer_url and
                "/login" not in customer_url and
                "403" not in self.base_page.get_page_title()
            )
            
            assert customer_can_book, "Customer should access appointment booking"
            
            self.login_page.logout()
            
            # Consultant should access appointment management
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            self.base_page.navigate_to("/consultant/appointments")
            consultant_url = self.base_page.get_current_url()
            
            consultant_can_manage = (
                "/consultant" in consultant_url and
                "403" not in self.base_page.get_page_title()
            )
            
            assert consultant_can_manage, "Consultant should manage appointments"
            
            self.login_page.logout()
    
    @allure.story("Data Access Control Tests")
    @allure.severity("critical")
    def test_data_access_control(self):
        """Test data access control and privacy"""
        with allure.step("Testing data access control"):
            
            # Test that users can only access their own data
            
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Try to access other users' data
            other_user_data_urls = [
                "/profile/other-user",
                "/appointments/user/123",
                "/health-records/456"
            ]
            
            for data_url in other_user_data_urls:
                self.logger.info(f"Testing customer access to other user data: {data_url}")
                
                self.base_page.navigate_to(data_url)
                current_url = self.base_page.get_current_url()
                
                # Should be denied access to other users' data
                access_denied = (
                    data_url not in current_url or
                    "403" in self.base_page.get_page_title() or
                    self.base_page.get_error_message()
                )
                
                assert access_denied, f"Customer should not access other user data: {data_url}"
            
            self.login_page.logout() 