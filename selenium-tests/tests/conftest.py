"""
Pytest Configuration và Fixtures
Cấu hình chung cho tất cả test cases
"""
import pytest
import os
import sys
from datetime import datetime
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

# Add parent directory to path để import được modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.driver_manager import DriverManager
from config.test_config import TestConfig
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.appointment_page import AppointmentPage

@pytest.fixture(scope="session")
def test_config():
    """Test configuration fixture"""
    return TestConfig

@pytest.fixture(scope="function")
def driver():
    """WebDriver fixture - tạo và đóng driver cho mỗi test"""
    driver_manager = DriverManager()
    driver = driver_manager.get_driver()
    
    yield driver
    
    # Cleanup
    driver_manager.quit_driver()

@pytest.fixture(scope="function")
def driver_session(request):
    """Session-scoped driver fixture cho các test cần share session"""
    if not hasattr(request.config, '_session_driver'):
        driver_manager = DriverManager()
        request.config._session_driver = driver_manager.get_driver()
        request.config._driver_manager = driver_manager
    
    yield request.config._session_driver

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment"""
    # Tạo directories cần thiết
    os.makedirs(TestConfig.SCREENSHOTS_PATH, exist_ok=True)
    os.makedirs(TestConfig.DOWNLOADS_PATH, exist_ok=True)
    os.makedirs(TestConfig.REPORTS_PATH, exist_ok=True)
    
    print(f"\n🚀 Starting GenCare Test Suite - {datetime.now()}")
    print(f"📍 Base URL: {TestConfig.BASE_URL}")
    print(f"🌐 Browser: {TestConfig.BROWSER}")
    print(f"📱 Headless: {TestConfig.HEADLESS}")
    
    yield
    
    print(f"\n✅ Test Suite Complete - {datetime.now()}")

@pytest.fixture(scope="function")
def login_page(driver):
    """Login page fixture"""
    return LoginPage(driver)

@pytest.fixture(scope="function")
def dashboard_page(driver):
    """Dashboard page fixture"""
    return DashboardPage(driver)

@pytest.fixture(scope="function")
def appointment_page(driver):
    """Appointment page fixture"""
    return AppointmentPage(driver)

@pytest.fixture(scope="function")
def logged_in_consultant(driver):
    """Fixture để đăng nhập với consultant account"""
    login_page = LoginPage(driver)
    login_page.navigate_to_login()
    login_page.login_with_valid_credentials()
    
    # Verify login success
    dashboard_page = DashboardPage(driver)
    dashboard_page.wait_for_dashboard_load()
    
    yield driver

@pytest.fixture(scope="function")
def logged_in_customer(driver):
    """Fixture để đăng nhập với customer account"""
    login_page = LoginPage(driver)
    login_page.navigate_to_login()
    login_page.login_as_customer()
    
    # Verify login success
    dashboard_page = DashboardPage(driver)
    dashboard_page.wait_for_dashboard_load()
    
    yield driver

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook để capture screenshot khi test fail"""
    outcome = yield
    report = outcome.get_result()
    
    if report.when == "call" and report.failed:
        # Lấy driver từ fixture
        driver = item.funcargs.get('driver')
        if driver:
            # Capture screenshot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_name = f"failed_{item.name}_{timestamp}.png"
            screenshot_path = os.path.join(TestConfig.SCREENSHOTS_PATH, screenshot_name)
            
            try:
                driver.save_screenshot(screenshot_path)
                print(f"\n📸 Screenshot saved: {screenshot_path}")
                
                # Attach to allure report nếu có
                try:
                    import allure
                    allure.attach.file(screenshot_path, name="Failed Test Screenshot", 
                                     attachment_type=allure.attachment_type.PNG)
                except ImportError:
                    pass
                    
            except Exception as e:
                print(f"\n❌ Failed to capture screenshot: {e}")

def pytest_configure(config):
    """Pytest configuration"""
    # Add custom markers
    config.addinivalue_line(
        "markers", "smoke: marks tests as smoke tests"
    )
    config.addinivalue_line(
        "markers", "regression: marks tests as regression tests"
    )
    config.addinivalue_line(
        "markers", "login: marks tests related to login functionality"
    )
    config.addinivalue_line(
        "markers", "appointment: marks tests related to appointment functionality"
    )
    config.addinivalue_line(
        "markers", "critical: marks tests as critical priority"
    )

def pytest_sessionfinish(session, exitstatus):
    """Session cleanup"""
    if hasattr(session.config, '_session_driver'):
        try:
            session.config._driver_manager.quit_driver()
        except:
            pass

# Test data fixtures
@pytest.fixture
def valid_login_data():
    """Valid login test data"""
    return {
        "email": TestConfig.VALID_EMAIL,
        "password": TestConfig.VALID_PASSWORD
    }

@pytest.fixture
def invalid_login_data():
    """Invalid login test data"""
    return [
        {"email": "invalid@email.com", "password": "wrongpassword"},
        {"email": "test@email.com", "password": ""},
        {"email": "", "password": "password123"},
        {"email": "notanemail", "password": "password123"},
    ]

@pytest.fixture
def appointment_test_data():
    """Appointment booking test data"""
    return {
        "consultant_name": "Dr. Nguyen Van A",
        "date": "2024-12-25",
        "reason": "Tư vấn sức khỏe sinh sản",
        "phone": "0987654321",
        "notes": "Cần tư vấn về chu kỳ kinh nguyệt"
    }

@pytest.fixture
def test_data():
    """Load test data from JSON config file"""
    import json
    try:
        data_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'test_data.json')
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback data if file not found
        return {
            "users": {
                "customer": {
                    "username": "customer1@gencare.com",
                    "password": "password",
                    "role": "customer"
                },
                "consultant": {
                    "username": "consultant1@gencare.com", 
                    "password": "password",
                    "role": "consultant"
                },
                "staff": {
                    "username": "staff1@gencare.com",
                    "password": "password", 
                    "role": "staff"
                },
                "admin": {
                    "username": "admin@gencare.com",
                    "password": "password",
                    "role": "admin"
                }
            }
        } 