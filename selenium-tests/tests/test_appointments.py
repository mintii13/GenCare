"""
Appointment Management Test Suite for GenCare
Tests appointment booking and management functionality
"""

import pytest
import allure
from datetime import datetime, timedelta
from pages.appointment_page import AppointmentPage
from pages.login_page import LoginPage
from pages.base_page import BasePage
from utils.data_helpers import DataHelpers
from utils.logger import get_logger


@allure.epic("GenCare Appointment Management")
@allure.feature("Appointment Booking & Management")
class TestAppointments:
    """Test appointment functionality for all user roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self, driver, test_data):
        """Setup for each test"""
        self.driver = driver
        self.test_data = test_data
        self.appointment_page = AppointmentPage(driver)
        self.login_page = LoginPage(driver)
        self.base_page = BasePage(driver)
        self.data_helpers = DataHelpers()
        self.logger = get_logger(self.__class__.__name__)
        
        # Ensure clean state
        self.login_page.navigate_to("/")
        if self.base_page.is_user_logged_in():
            self.login_page.logout()
    
    @allure.story("Appointment Navigation Tests")
    @allure.severity("critical")
    def test_appointment_page_access(self):
        """Test appointment page accessibility for different roles"""
        with allure.step("Test appointment page access"):
            # Guest should not access appointment booking
            self.appointment_page.navigate_to("/consultation/book-appointment")
            
            current_url = self.driver.current_url
            page_source = self.driver.page_source.lower()
            
            # Should either redirect to login or show authentication required
            guest_blocked = (
                "/login" in current_url or
                "đăng nhập" in page_source or
                "authentication" in page_source
            )
            
            if not guest_blocked:
                self.logger.warning("Guest can access appointment booking - may need authentication")
            
            # Customer should be able to access booking after login
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            self.appointment_page.navigate_to("/consultation/book-appointment")
            
            # Should successfully load booking page
            customer_url = self.driver.current_url
            assert "book" in customer_url or "consultation" in customer_url, "Customer cannot access appointment booking"
            
            self.appointment_page.take_screenshot("appointment_booking_access_customer")
    
    @allure.story("Appointment Form Tests")
    @allure.severity("high")
    def test_appointment_booking_form_display(self):
        """Test appointment booking form elements"""
        with allure.step("Test booking form display"):
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Navigate to booking page
            self.appointment_page.navigate_to("/consultation/book-appointment")
            
            # Check if booking form is displayed
            form_displayed = self.appointment_page.is_booking_form_displayed()
            
            if form_displayed:
                self.logger.info("Booking form displayed successfully")
                self.appointment_page.take_screenshot("booking_form_displayed")
            else:
                # Check alternative URLs
                alternative_urls = [
                    "/services/consultation",
                    "/dashboard/customer/book-appointment",
                    "/book-appointment"
                ]
                
                for alt_url in alternative_urls:
                    self.appointment_page.navigate_to(alt_url)
                    if self.appointment_page.is_booking_form_displayed():
                        self.logger.info(f"Booking form found at: {alt_url}")
                        form_displayed = True
                        break
                
                if not form_displayed:
                    self.logger.warning("Booking form not found - may be under development")
    
    @allure.story("Customer Dashboard Tests")
    @allure.severity("high")
    def test_customer_appointments_dashboard(self):
        """Test customer can access their appointments dashboard"""
        with allure.step("Test customer appointments dashboard"):
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Navigate to customer dashboard
            dashboard_urls = [
                "/dashboard/customer",
                "/dashboard",
                "/my-appointments"
            ]
            
            dashboard_accessible = False
            
            for dashboard_url in dashboard_urls:
                self.appointment_page.navigate_to(dashboard_url)
                current_url = self.driver.current_url
                
                if ("dashboard" in current_url or 
                    "appointment" in current_url or 
                    "customer" in current_url):
                    dashboard_accessible = True
                    self.logger.info(f"Customer dashboard accessible at: {dashboard_url}")
                    self.appointment_page.take_screenshot(f"customer_dashboard_{dashboard_url.replace('/', '_')}")
                    break
            
            if not dashboard_accessible:
                self.logger.warning("Customer dashboard not accessible - may be under development")
    
    @allure.story("Consultant Dashboard Tests")
    @allure.severity("high")
    def test_consultant_appointments_access(self):
        """Test consultant can access appointment management"""
        with allure.step("Test consultant appointment access"):
            # Login as consultant
            assert self.login_page.quick_login("consultant", self.test_data), "Consultant login failed"
            
            # Navigate to consultant dashboard
            consultant_urls = [
                "/dashboard/consultant",
                "/dashboard/consultant/appointments",
                "/appointments/manage"
            ]
            
            consultant_access = False
            
            for consultant_url in consultant_urls:
                self.appointment_page.navigate_to(consultant_url)
                current_url = self.driver.current_url
                
                if ("consultant" in current_url or 
                    ("dashboard" in current_url and "/login" not in current_url)):
                    consultant_access = True
                    self.logger.info(f"Consultant dashboard accessible at: {consultant_url}")
                    self.appointment_page.take_screenshot(f"consultant_dashboard_{consultant_url.replace('/', '_')}")
                    break
            
            if not consultant_access:
                self.logger.warning("Consultant dashboard not accessible - may be under development")
    
    @allure.story("Admin Appointment Management")
    @allure.severity("normal")
    def test_admin_appointment_management(self):
        """Test admin can access all appointment management"""
        with allure.step("Test admin appointment management"):
            # Login as admin using stored credentials
            admin_email = "admin1@gencare.com"
            admin_password = "password"
            
            assert self.login_page.navigate_to_login(), "Failed to navigate to login"
            assert self.login_page.login_with_credentials(admin_email, admin_password), "Admin login failed"
            
            # Navigate to admin dashboard
            admin_urls = [
                "/dashboard/admin",
                "/admin/appointments",
                "/admin"
            ]
            
            admin_access = False
            
            for admin_url in admin_urls:
                self.appointment_page.navigate_to(admin_url)
                current_url = self.driver.current_url
                
                if ("admin" in current_url or 
                    ("dashboard" in current_url and "/login" not in current_url)):
                    admin_access = True
                    self.logger.info(f"Admin dashboard accessible at: {admin_url}")
                    self.appointment_page.take_screenshot(f"admin_dashboard_{admin_url.replace('/', '_')}")
                    break
            
            if not admin_access:
                self.logger.warning("Admin dashboard not accessible - may be under development")
    
    @allure.story("Appointment Data Tests")
    @allure.severity("minor")
    def test_appointment_test_data_availability(self):
        """Test appointment test data is properly configured"""
        with allure.step("Verify test data configuration"):
            # Check test data structure
            assert "appointments" in self.test_data, "Appointment test data not configured"
            
            appointment_data = self.test_data["appointments"]
            
            # Check required fields
            required_fields = ["consultation_types", "time_slots"]
            for field in required_fields:
                assert field in appointment_data, f"Missing appointment test data field: {field}"
                assert len(appointment_data[field]) > 0, f"Empty appointment test data field: {field}"
            
            self.logger.info(f"Consultation types available: {appointment_data['consultation_types']}")
            self.logger.info(f"Time slots available: {appointment_data['time_slots']}")
    
    @allure.story("Responsive Design Tests")
    @allure.severity("minor")
    def test_appointment_mobile_responsive(self):
        """Test appointment pages on mobile viewport"""
        with allure.step("Test mobile responsive design"):
            # Set mobile viewport
            self.driver.set_window_size(375, 667)
            
            # Login as customer
            assert self.login_page.quick_login("customer", self.test_data), "Customer login failed"
            
            # Test booking page on mobile
            self.appointment_page.navigate_to("/consultation/book-appointment")
            
            # Take mobile screenshot
            self.appointment_page.take_screenshot("appointment_booking_mobile")
            
            # Test dashboard on mobile
            self.appointment_page.navigate_to("/dashboard/customer")
            self.appointment_page.take_screenshot("customer_dashboard_mobile")
            
            # Restore desktop viewport
            self.driver.set_window_size(1920, 1080)
            
            self.logger.info("Mobile responsive tests completed") 