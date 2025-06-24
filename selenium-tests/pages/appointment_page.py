"""
Appointment Page Object Model
Page object cho trang đặt lịch và quản lý appointments
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from pages.base_page import BasePage
from config.test_config import TestConfig
import time

class AppointmentPage(BasePage):
    """Appointment page object model"""
    
    # Booking Form Locators
    CONSULTANT_DROPDOWN = (By.CSS_SELECTOR, "select[name='consultantId']")
    DATE_PICKER = (By.CSS_SELECTOR, "input[type='date']")
    TIME_SLOT_BUTTONS = (By.CSS_SELECTOR, ".time-slot-button")
    AVAILABLE_SLOT = (By.CSS_SELECTOR, ".time-slot-button:not(.disabled)")
    SELECTED_SLOT = (By.CSS_SELECTOR, ".time-slot-button.selected")
    
    # Form Fields
    REASON_TEXTAREA = (By.CSS_SELECTOR, "textarea[name='reason']")
    NOTES_TEXTAREA = (By.CSS_SELECTOR, "textarea[name='notes']")
    CONTACT_PHONE = (By.CSS_SELECTOR, "input[name='phone']")
    
    # Buttons
    BOOK_APPOINTMENT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    CANCEL_BUTTON = (By.CSS_SELECTOR, "button:contains('Hủy')")
    CONFIRM_BUTTON = (By.CSS_SELECTOR, "button:contains('Xác nhận')")
    
    # Appointment List Locators
    APPOINTMENT_CARDS = (By.CSS_SELECTOR, ".appointment-card")
    APPOINTMENT_STATUS = (By.CSS_SELECTOR, ".appointment-status")
    VIEW_DETAIL_BUTTON = (By.CSS_SELECTOR, "button:contains('Xem chi tiết')")
    CANCEL_APPOINTMENT_BUTTON = (By.CSS_SELECTOR, "button:contains('Hủy lịch hẹn')")
    RESCHEDULE_BUTTON = (By.CSS_SELECTOR, "button:contains('Đổi lịch')")
    
    # Filter and Search
    STATUS_FILTER = (By.CSS_SELECTOR, "select[name='status']")
    DATE_FILTER = (By.CSS_SELECTOR, "input[name='filterDate']")
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[name='search']")
    SEARCH_BUTTON = (By.CSS_SELECTOR, "button:contains('Tìm kiếm')")
    
    # Appointment Details Modal
    MODAL = (By.CSS_SELECTOR, ".modal")
    MODAL_TITLE = (By.CSS_SELECTOR, ".modal-title")
    MODAL_CLOSE = (By.CSS_SELECTOR, ".modal .close")
    APPOINTMENT_DATE_TEXT = (By.CSS_SELECTOR, ".appointment-date")
    APPOINTMENT_TIME_TEXT = (By.CSS_SELECTOR, ".appointment-time")
    CONSULTANT_NAME_TEXT = (By.CSS_SELECTOR, ".consultant-name")
    
    # Messages
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".success-message")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".error-message")
    VALIDATION_ERROR = (By.CSS_SELECTOR, ".validation-error")
    
    def __init__(self, driver):
        super().__init__(driver)
        self.base_url = TestConfig.get_test_urls()['appointments']
        
    def navigate_to_book_appointment(self):
        """Navigate đến trang đặt lịch hẹn"""
        url = f"{TestConfig.BASE_URL}/consultation/book-appointment"
        self.navigate_to(url)
        self.wait_for_page_load()
        
    def navigate_to_my_appointments(self):
        """Navigate đến trang quản lý lịch hẹn của mình"""
        url = f"{TestConfig.BASE_URL}/dashboard/customer/appointments"
        self.navigate_to(url)
        self.wait_for_page_load()
        
    def select_consultant(self, consultant_name):
        """Chọn consultant từ dropdown"""
        self.select_dropdown_by_text(self.CONSULTANT_DROPDOWN, consultant_name)
        
    def select_date(self, date):
        """Chọn ngày (format: YYYY-MM-DD)"""
        self.enter_text(self.DATE_PICKER, date)
        
    def select_available_time_slot(self, slot_index=0):
        """Chọn time slot có sẵn (mặc định slot đầu tiên)"""
        available_slots = self.find_elements(self.AVAILABLE_SLOT)
        if available_slots and len(available_slots) > slot_index:
            available_slots[slot_index].click()
            return True
        return False
        
    def get_available_time_slots(self):
        """Lấy danh sách time slots có sẵn"""
        slots = []
        available_slots = self.find_elements(self.AVAILABLE_SLOT)
        for slot in available_slots:
            slots.append(slot.text)
        return slots
        
    def enter_reason(self, reason):
        """Nhập lý do đặt lịch"""
        self.enter_text(self.REASON_TEXTAREA, reason)
        
    def enter_notes(self, notes):
        """Nhập ghi chú"""
        self.enter_text(self.NOTES_TEXTAREA, notes)
        
    def enter_phone(self, phone):
        """Nhập số điện thoại"""
        self.enter_text(self.CONTACT_PHONE, phone)
        
    def click_book_appointment(self):
        """Click nút đặt lịch hẹn"""
        self.click_element(self.BOOK_APPOINTMENT_BUTTON)
        
    def book_appointment(self, consultant_name, date, reason, phone=None, notes=None):
        """
        Đặt lịch hẹn hoàn chỉnh
        
        Args:
            consultant_name (str): Tên consultant
            date (str): Ngày đặt lịch (YYYY-MM-DD)
            reason (str): Lý do đặt lịch
            phone (str): Số điện thoại (optional)
            notes (str): Ghi chú (optional)
        """
        self.select_consultant(consultant_name)
        self.select_date(date)
        time.sleep(1)  # Chờ load time slots
        
        if not self.select_available_time_slot():
            raise Exception("Không có time slot nào khả dụng")
            
        self.enter_reason(reason)
        
        if phone:
            self.enter_phone(phone)
        if notes:
            self.enter_notes(notes)
            
        self.click_book_appointment()
        
    def get_appointment_cards(self):
        """Lấy danh sách appointment cards"""
        return self.find_elements(self.APPOINTMENT_CARDS)
        
    def get_appointment_count(self):
        """Đếm số lượng appointments"""
        return len(self.get_appointment_cards())
        
    def click_view_detail(self, appointment_index=0):
        """Click xem chi tiết appointment"""
        cards = self.get_appointment_cards()
        if cards and len(cards) > appointment_index:
            detail_button = cards[appointment_index].find_element(
                By.CSS_SELECTOR, "button:contains('Xem chi tiết')")
            detail_button.click()
            
    def cancel_appointment(self, appointment_index=0):
        """Hủy appointment"""
        cards = self.get_appointment_cards()
        if cards and len(cards) > appointment_index:
            cancel_button = cards[appointment_index].find_element(
                By.CSS_SELECTOR, "button:contains('Hủy lịch hẹn')")
            cancel_button.click()
            # Confirm cancellation
            self.click_element(self.CONFIRM_BUTTON)
            
    def filter_by_status(self, status):
        """Lọc appointments theo status"""
        self.select_dropdown_by_text(self.STATUS_FILTER, status)
        
    def search_appointments(self, search_term):
        """Tìm kiếm appointments"""
        self.enter_text(self.SEARCH_INPUT, search_term)
        self.click_element(self.SEARCH_BUTTON)
        
    def is_booking_form_displayed(self):
        """Kiểm tra form đặt lịch có hiển thị không"""
        return (self.is_element_visible(self.CONSULTANT_DROPDOWN) and
                self.is_element_visible(self.DATE_PICKER) and
                self.is_element_visible(self.BOOK_APPOINTMENT_BUTTON))
                
    def is_appointment_booked_successfully(self):
        """Kiểm tra đặt lịch thành công"""
        return self.is_element_present(self.SUCCESS_MESSAGE)
        
    def get_success_message(self):
        """Lấy success message"""
        if self.is_element_present(self.SUCCESS_MESSAGE):
            return self.get_text(self.SUCCESS_MESSAGE)
        return None
        
    def get_error_message(self):
        """Lấy error message"""
        if self.is_element_present(self.ERROR_MESSAGE):
            return self.get_text(self.ERROR_MESSAGE)
        return None
        
    def wait_for_time_slots_load(self, timeout=10):
        """Chờ time slots load"""
        self.wait_for_element_visible(self.TIME_SLOT_BUTTONS, timeout) 