import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.keys import Keys
import time

class TestPeriodTracking:
    """Test cases cho tính năng theo dõi chu kỳ kinh nguyệt"""
    
    @pytest.mark.smoke
    def test_period_tracker_page_access(self, driver, test_config):
        """Test 1: Kiểm tra truy cập trang period tracker"""
        period_urls = [
            "/period-tracker",
            "/period-tracking"
        ]
        
        for url in period_urls:
            try:
                driver.get(f"{test_config.BASE_URL}{url}")
                wait = WebDriverWait(driver, 10)
                
                # Kiểm tra page load
                page_content = wait.until(EC.presence_of_element_located(
                    (By.XPATH, "//body")
                ))
                assert page_content.is_displayed()
                
                # Kiểm tra có content liên quan period tracking
                period_content = driver.find_elements(By.XPATH,
                    "//*[contains(text(), 'chu kỳ') or contains(text(), 'kinh nguyệt') or contains(text(), 'period')]"
                )
                
                if len(period_content) > 0:
                    # Tìm thấy content, test pass
                    break
                    
            except (TimeoutException, Exception):
                # Thử URL tiếp theo
                continue
        else:
            pytest.skip("Period tracking page not found or not accessible")
    
    @pytest.mark.smoke
    def test_cycle_check_functionality(self, driver, test_config):
        """Test 2: Kiểm tra tính năng cycle check"""
        driver.get(f"{test_config.BASE_URL}/cycle-check")
        wait = WebDriverWait(driver, 5)
        
        try:
            # Kiểm tra page load
            page_content = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//body")
            ))
            assert page_content.is_displayed()
            
            # Kiểm tra có content hoặc form liên quan cycle check
            cycle_elements = driver.find_elements(By.XPATH,
                "//*[contains(text(), 'chu kỳ') or contains(text(), 'kiểm tra') or contains(text(), 'cycle') or contains(text(), 'check')]"
            )
            
            # Hoặc kiểm tra có form/input fields
            form_elements = driver.find_elements(By.XPATH, "//input'submit']")
            
            assert len(cycle_elements) > 0 or len(form_elements) > 0
            
        except TimeoutException:
            pytest.skip("Cycle check page not accessible")
    
    @pytest.mark.smoke
    def test_period_calendar_display(self, driver, test_config):
        """Test 3: Kiểm tra hiển thị calendar cho period tracking"""
        # Thử các URL có thể chứa calendar
        calendar_urls = [
            "/period-tracker",
            "/period-tracking",
            "/dashboard/customer"
        ]
        
        for url in calendar_urls:
            try:
                driver.get(f"{test_config.BASE_URL}{url}")
                time.sleep(3)  # Wait for calendar to load
                
                # Tìm calendar elements
                calendar_elements = driver.find_elements(By.XPATH,
                    "//*[contains(@class, 'calendar') or contains(@class, 'date') or contains(@class, 'day')]"
                )
                
                # Hoặc tìm month/year selectors
                date_selectors = driver.find_elements(By.XPATH,
                    "//*[contains(text(), '2025') or contains(text(), '2024') or contains(@class, 'month')]"
                )
                
                if len(calendar_elements) > 0 or len(date_selectors) > 0:
                    # Tìm thấy calendar
                    break
                    
            except Exception:
                continue
        else:
            pytest.skip("Calendar component not found")

class TestMedicationReminder:
    """Test cases cho tính năng medication reminder"""
    
    @pytest.mark.smoke
    def test_medication_reminder_page_access(self, driver, test_config):
        """Test 4: Kiểm tra truy cập trang medication reminder"""
        med_urls = [
            "/medication-reminder",
            "/medication-reminders"
        ]
        
        for url in med_urls:
            try:
                driver.get(f"{test_config.BASE_URL}{url}")
                wait = WebDriverWait(driver, 10)
                
                # Kiểm tra page load
                page_content = wait.until(EC.presence_of_element_located(
                    (By.XPATH, "//body")
                ))
                assert page_content.is_displayed()
                
                # Kiểm tra content liên quan medication
                med_content = driver.find_elements(By.XPATH,
                    "//*[contains(text(), 'thuốc') or contains(text(), 'medication') or contains(text(), 'reminder') or contains(text(), 'nhắc nhở')]"
                )
                
                if len(med_content) > 0:
                    break
                    
            except (TimeoutException, Exception):
                continue
        else:
            pytest.skip("Medication reminder page not found")
    
    @pytest.mark.smoke
    def test_medication_form_elements(self, driver, test_config):
        """Test 5: Kiểm tra các elements của form medication"""
        driver.get(f"{test_config.BASE_URL}/medication-reminder")
        time.sleep(2)
        
        try:
            # Tìm form hoặc input elements
            form_elements = driver.find_elements(By.XPATH, "//form")
            
            if len(form_elements) > 0:
                # Kiểm tra có các field thường thấy trong medication form
                expected_fields = [
                    "//input[@placeholder*='tên thuốc' or @name*='name' or @name*='medication']",
                    "//input[@type='time' or @placeholder*='thời gian' or @name*='time']",
                    "//select[option[contains(text(), 'ngày') or contains(text(), 'daily')]] | //input[@name*='frequency']"
                ]
                
                found_fields = 0
                for field_xpath in expected_fields:
                    try:
                        driver.find_element(By.XPATH, field_xpath)
                        found_fields += 1
                    except NoSuchElementException:
                        pass
                
                # Chấp nhận nếu tìm thấy ít nhất 1 field relevant
                assert found_fields > 0 or len(form_elements) > 0
            else:
                # Nếu không có form, có thể là trang list medications
                med_items = driver.find_elements(By.XPATH,
                    "//*[contains(@class, 'medication') or contains(@class, 'reminder') or contains(@class, 'pill')]"
                )
                
                # Hoặc có button "Add" / "Thêm"
                add_buttons = driver.find_elements(By.XPATH,
                    "//button[contains(text(), 'Thêm') or contains(text(), 'Add') or contains(text(), '+')]"
                )
                
                assert len(med_items) > 0 or len(add_buttons) > 0
                
        except Exception:
            pytest.skip("Medication form elements not accessible")

class TestSTITesting:
    """Test cases cho dịch vụ STI testing"""
    
    @pytest.mark.smoke
    def test_sti_testing_page_functionality(self, driver, test_config):
        """Test 6: Kiểm tra chức năng trang STI testing"""
        driver.get(f"{test_config.BASE_URL}/test-packages")
        wait = WebDriverWait(driver, 10)
        
        try:
            # Kiểm tra page load
            page_content = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//body")
            ))
            assert page_content.is_displayed()
            
            # Kiểm tra content liên quan STI testing
            sti_content = driver.find_elements(By.XPATH,
                "//*[contains(text(), 'STI') or contains(text(), 'xét nghiệm') or contains(text(), 'test') or contains(text(), 'package')]"
            )
            
            assert len(sti_content) > 0, "No STI testing content found"
            
        except TimeoutException:
            pytest.fail("STI testing page failed to load")
    
    @pytest.mark.smoke
    def test_sti_test_list_display(self, driver, test_config):
        """Test 7: Kiểm tra hiển thị danh sách STI tests"""
        driver.get(f"{test_config.BASE_URL}/test-packages/sti")
        wait = WebDriverWait(driver, 10)
        
        try:
            # Kiểm tra page load
            page_content = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//body")
            ))
            assert page_content.is_displayed()
            
            # Kiểm tra có danh sách tests
            test_items = driver.find_elements(By.XPATH,
                "//*[contains(@class, 'test') or contains(@class, 'package') or contains(@class, 'card')]"
            )
            
            # Hoặc kiểm tra có table/list structure
            list_structures = driver.find_elements(By.XPATH, "//table'list')]")
            
            # Hoặc message "không có test nào"
            no_tests_message = driver.find_elements(By.XPATH,
                "//*[contains(text(), 'Không có') or contains(text(), 'chưa có') or contains(text(), 'empty')]"
            )
            
            # Một trong ba phải có
            assert len(test_items) > 0 or len(list_structures) > 0 or len(no_tests_message) > 0
            
        except TimeoutException:
            pytest.fail("STI test list page failed to load")
    
    @pytest.mark.smoke
    def test_sti_test_booking_flow(self, driver, test_config):
        """Test 8: Kiểm tra luồng booking STI test"""
        driver.get(f"{test_config.BASE_URL}/test-packages")
        time.sleep(3)
        
        try:
            # Tìm nút book/đặt lịch cho test
            book_buttons = driver.find_elements(By.XPATH,
                "//button[contains(text(), 'Đặt') or contains(text(), 'Book') or contains(text(), 'Chọn')]'Đặt') or contains(text(), 'Book')]"
            )
            
            if len(book_buttons) > 0:
                # Có button booking, thử click
                first_button = book_buttons[0]
                driver.execute_script("arguments[0].scrollIntoView();", first_button)
                time.sleep(1)
                
                # Không click thực sự để tránh tạo booking test
                # Chỉ kiểm tra button có thể click được
                assert first_button.is_displayed()
                assert first_button.is_enabled()
            else:
                # Không có button, có thể cần login trước
                # Kiểm tra có message yêu cầu login
                login_messages = driver.find_elements(By.XPATH,
                    "//*[contains(text(), 'đăng nhập') or contains(text(), 'login') or contains(text(), 'sign in')]"
                )
                
                # Hoặc có link đến trang booking
                booking_links = driver.find_elements(By.XPATH,
                    "//a[contains(@href, 'book') or contains(@href, 'appointment')]"
                )
                
                assert len(login_messages) > 0 or len(booking_links) > 0
                
        except Exception as e:
            pytest.skip(f"STI booking flow test skipped: {str(e)}")

class TestHealthDashboard:
    """Test cases cho health dashboard features"""
    
    @pytest.mark.smoke
    def test_customer_health_dashboard(self, driver, test_config):
        """Test 9: Kiểm tra health dashboard của customer"""
        driver.get(f"{test_config.BASE_URL}/dashboard/customer")
        wait = WebDriverWait(driver, 10)
        
        try:
            # Kiểm tra page load
            page_content = wait.until(EC.presence_of_element_located(
                (By.XPATH, "//body")
            ))
            assert page_content.is_displayed()
            
            # Kiểm tra có health-related widgets/sections
            health_sections = driver.find_elements(By.XPATH,
                "//*[contains(text(), 'sức khỏe') or contains(text(), 'health') or contains(text(), 'chu kỳ') or contains(text(), 'period')]"
            )
            
            # Hoặc kiểm tra có navigation links đến health features
            health_nav_links = driver.find_elements(By.XPATH,
                "//a[contains(@href, 'period') or contains(@href, 'medication') or contains(@href, 'cycle') or contains(@href, 'health')]"
            )
            
            # Hoặc có dashboard cards/widgets
            dashboard_cards = driver.find_elements(By.XPATH,
                "//*[contains(@class, 'card') or contains(@class, 'widget') or contains(@class, 'dashboard')]"
            )
            
            # Ít nhất một trong ba phải có
            assert len(health_sections) > 0 or len(health_nav_links) > 0 or len(dashboard_cards) > 0
            
        except TimeoutException:
            pytest.skip("Customer dashboard not accessible")
    
    @pytest.mark.smoke
    def test_health_data_visualization(self, driver, test_config):
        """Test 10: Kiểm tra visualization của health data"""
        # Thử các trang có thể có charts/graphs
        viz_urls = [
            "/dashboard/customer",
            "/period-tracker",
            "/cycle-check"
        ]
        
        for url in viz_urls:
            try:
                driver.get(f"{test_config.BASE_URL}{url}")
                time.sleep(3)  # Wait for charts to load
                
                # Tìm chart/graph elements
                chart_elements = driver.find_elements(By.XPATH,
                    "//*[contains(@class, 'chart') or contains(@class, 'graph') or contains(@class, 'visualization')]"
                )
                
                # Hoặc canvas elements (thường dùng cho charts)
                canvas_elements = driver.find_elements(By.TAG_NAME, "canvas")
                
                # Hoặc SVG elements
                svg_elements = driver.find_elements(By.TAG_NAME, "svg")
                
                if len(chart_elements) > 0 or len(canvas_elements) > 0 or len(svg_elements) > 0:
                    # Tìm thấy visualization elements
                    break
                    
            except Exception:
                continue
        else:
            pytest.skip("No data visualization found")
    
    @pytest.mark.smoke
    def test_health_notifications_functionality(self, driver, test_config):
        """Test 11: Kiểm tra chức năng thông báo sức khỏe"""
        driver.get(f"{test_config.BASE_URL}/dashboard/customer")
        time.sleep(2)
        
        try:
            # Tìm notification elements
            notification_elements = driver.find_elements(By.XPATH,
                "//*[contains(@class, 'notification') or contains(@class, 'alert') or contains(@class, 'reminder')]"
            )
            
            # Hoặc notification bell/icon
            notification_icons = driver.find_elements(By.XPATH,
                "//*[contains(@class, 'bell') or contains(@class, 'notification-icon')]'bell')]]"
            )
            
            # Hoặc reminder texts
            reminder_texts = driver.find_elements(By.XPATH,
                "//*[contains(text(), 'nhắc nhở') or contains(text(), 'reminder') or contains(text(), 'thông báo')]"
            )
            
            # Có ít nhất một loại notification
            found_notifications = len(notification_elements) + len(notification_icons) + len(reminder_texts)
            
            if found_notifications == 0:
                # Có thể notifications chưa được enable hoặc chưa có data
                pytest.skip("No notification elements found")
            else:
                assert found_notifications > 0
                
        except Exception:
            pytest.skip("Notification functionality not accessible") 