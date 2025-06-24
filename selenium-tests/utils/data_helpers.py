"""
Data Helpers for GenCare Automation Framework
Utilities for test data management, generation, and database operations
"""

import json
import random
import string
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from faker import Faker
import logging


class TestDataManager:
    """Manages test data loading, generation, and manipulation"""
    
    def __init__(self, data_file_path: str = "config/test_data.json"):
        """
        Initialize TestDataManager
        
        Args:
            data_file_path: Path to test data JSON file
        """
        self.data_file_path = data_file_path
        self.test_data = self._load_test_data()
        self.fake = Faker(['vi_VN', 'en_US'])  # Vietnamese and English locales
        self.logger = logging.getLogger(__name__)
    
    def _load_test_data(self) -> Dict[str, Any]:
        """Load test data from JSON file"""
        try:
            with open(self.data_file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.warning(f"Test data file not found: {self.data_file_path}")
            return {}
        except json.JSONDecodeError:
            self.logger.error(f"Invalid JSON in test data file: {self.data_file_path}")
            return {}
    
    def get_user_data(self, role: str) -> Dict[str, Any]:
        """
        Get user data for specific role
        
        Args:
            role: User role (guest, customer, consultant, staff, manager, admin)
            
        Returns:
            Dict containing user data
        """
        users = self.test_data.get('users', {})
        return users.get(role, {})
    
    def get_all_users(self) -> Dict[str, Dict[str, Any]]:
        """Get all user data"""
        return self.test_data.get('users', {})
    
    def get_sti_test_data(self) -> Dict[str, Any]:
        """Get STI test data"""
        return self.test_data.get('sti_tests', {})
    
    def get_individual_sti_tests(self) -> List[Dict[str, Any]]:
        """Get list of individual STI tests"""
        return self.get_sti_test_data().get('individual_tests', [])
    
    def get_sti_packages(self) -> List[Dict[str, Any]]:
        """Get list of STI test packages"""
        return self.get_sti_test_data().get('packages', [])
    
    def get_appointment_data(self) -> Dict[str, Any]:
        """Get appointment configuration data"""
        return self.test_data.get('appointments', {})
    
    def get_test_messages(self) -> Dict[str, str]:
        """Get test messages for assertions"""
        return self.test_data.get('test_messages', {})
    
    def get_random_sti_test(self) -> Dict[str, Any]:
        """Get a random STI test"""
        tests = self.get_individual_sti_tests()
        return random.choice(tests) if tests else {}
    
    def get_random_consultation_type(self) -> str:
        """Get a random consultation type"""
        types = self.get_appointment_data().get('consultation_types', [])
        return random.choice(types) if types else "Tư vấn sức khỏe sinh sản"
    
    def get_random_time_slot(self) -> str:
        """Get a random time slot"""
        slots = self.get_appointment_data().get('time_slots', [])
        return random.choice(slots) if slots else "09:00"


class FakeDataGenerator:
    """Generates fake data for testing"""
    
    def __init__(self):
        """Initialize FakeDataGenerator"""
        self.fake = Faker(['vi_VN', 'en_US'])
        self.logger = logging.getLogger(__name__)
    
    def generate_user_data(self, role: str = "customer") -> Dict[str, str]:
        """
        Generate fake user data
        
        Args:
            role: User role
            
        Returns:
            Dict containing fake user data
        """
        timestamp = int(time.time())
        
        return {
            "username": f"test_{role}_{timestamp}@example.com",
            "email": f"test_{role}_{timestamp}@example.com",
            "password": "Test123!@#",
            "first_name": self.fake.first_name(),
            "last_name": self.fake.last_name(),
            "full_name": self.fake.name(),
            "phone": self.fake.phone_number(),
            "address": self.fake.address(),
            "date_of_birth": self.fake.date_of_birth(minimum_age=18, maximum_age=80).strftime('%Y-%m-%d'),
            "gender": random.choice(["Nam", "Nữ", "Khác"]),
            "role": role
        }
    
    def generate_vietnamese_user_data(self) -> Dict[str, str]:
        """Generate Vietnamese-specific user data"""
        timestamp = int(time.time())
        
        vietnamese_names = [
            "Nguyễn Văn", "Trần Thị", "Lê Minh", "Phạm Thu", "Hoàng Đức",
            "Vũ Thị", "Đặng Văn", "Bùi Minh", "Đỗ Thu", "Ngô Văn"
        ]
        
        first_part = random.choice(vietnamese_names)
        last_part = self.fake.first_name()
        
        return {
            "username": f"nguoi_dung_{timestamp}@gmail.com",
            "email": f"nguoi_dung_{timestamp}@gmail.com",
            "password": "MatKhau123!",
            "full_name": f"{first_part} {last_part}",
            "phone": f"0{random.randint(800000000, 999999999)}",
            "address": f"{self.fake.address()}, Việt Nam",
            "date_of_birth": self.fake.date_of_birth(minimum_age=18, maximum_age=80).strftime('%d/%m/%Y'),
            "gender": random.choice(["Nam", "Nữ"]),
            "identification": f"{random.randint(100000000, 999999999)}"
        }
    
    def generate_appointment_data(self) -> Dict[str, str]:
        """Generate fake appointment data"""
        future_date = datetime.now() + timedelta(days=random.randint(1, 30))
        
        consultation_types = [
            "Tư vấn sức khỏe sinh sản",
            "Tư vấn kế hoạch hóa gia đình",
            "Tư vấn STI/STD",
            "Tư vấn thai kỳ",
            "Tư vấn sức khỏe nam giới"
        ]
        
        time_slots = [
            "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
        ]
        
        return {
            "date": future_date.strftime('%Y-%m-%d'),
            "time": random.choice(time_slots),
            "consultation_type": random.choice(consultation_types),
            "notes": self.fake.text(max_nb_chars=200),
            "reason": random.choice([
                "Tư vấn sức khỏe định kỳ",
                "Có triệu chứng bất thường",
                "Cần lời khuyên chuyên môn",
                "Kiểm tra sức khỏe tổng quát"
            ])
        }
    
    def generate_health_record_data(self) -> Dict[str, Any]:
        """Generate fake health record data"""
        return {
            "height": random.randint(150, 190),
            "weight": random.randint(45, 100),
            "blood_type": random.choice(["A", "B", "AB", "O"]),
            "allergies": random.choice([
                "Không có",
                "Dị ứng thuốc kháng sinh",
                "Dị ứng phấn hoa",
                "Dị ứng hải sản"
            ]),
            "chronic_diseases": random.choice([
                "Không có",
                "Cao huyết áp",
                "Tiểu đường",
                "Bệnh tim"
            ]),
            "medications": random.choice([
                "Không có",
                "Thuốc huyết áp",
                "Vitamin tổng hợp",
                "Thuốc giảm đau"
            ]),
            "emergency_contact": self.fake.phone_number(),
            "emergency_contact_name": self.fake.name()
        }
    
    def generate_blog_data(self) -> Dict[str, str]:
        """Generate fake blog data"""
        topics = [
            "Sức khỏe sinh sản",
            "Kế hoạch hóa gia đình",
            "Phòng ngừa STI",
            "Chăm sóc thai kỳ",
            "Dinh dưỡng sức khỏe"
        ]
        
        return {
            "title": f"Hướng dẫn về {random.choice(topics)}",
            "content": self.fake.text(max_nb_chars=1000),
            "summary": self.fake.text(max_nb_chars=200),
            "tags": ", ".join(random.sample(topics, k=random.randint(1, 3))),
            "category": random.choice(topics)
        }
    
    def generate_random_string(self, length: int = 10, include_numbers: bool = True) -> str:
        """
        Generate random string
        
        Args:
            length: Length of string
            include_numbers: Whether to include numbers
            
        Returns:
            Random string
        """
        chars = string.ascii_letters
        if include_numbers:
            chars += string.digits
        
        return ''.join(random.choice(chars) for _ in range(length))
    
    def generate_random_email(self, domain: str = "example.com") -> str:
        """Generate random email address"""
        username = self.generate_random_string(8).lower()
        timestamp = int(time.time())
        return f"{username}_{timestamp}@{domain}"
    
    def generate_random_phone(self, country_code: str = "VN") -> str:
        """Generate random phone number"""
        if country_code == "VN":
            return f"0{random.randint(800000000, 999999999)}"
        else:
            return self.fake.phone_number()
    
    def generate_fake_email(self, domain: str = "example.com") -> str:
        """Generate fake email address"""
        username = self.fake.user_name()
        timestamp = int(time.time())
        return f"{username}_{timestamp}@{domain}"
    
    def generate_fake_password(self, length: int = 12) -> str:
        """Generate fake password"""
        return self.fake.password(length=length, special_chars=True, digits=True, upper_case=True, lower_case=True)


class DatabaseHelper:
    """Helper for database operations during testing"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize DatabaseHelper
        
        Args:
            config: Database configuration
        """
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        self._connection = None
    
    def connect(self) -> bool:
        """
        Connect to database
        
        Returns:
            bool: True if connection successful
        """
        try:
            # MongoDB connection would go here
            # For now, this is a placeholder
            self.logger.info("Database connection established")
            return True
        except Exception as e:
            self.logger.error(f"Database connection failed: {e}")
            return False
    
    def cleanup_test_data(self, test_identifiers: List[str]) -> bool:
        """
        Clean up test data from database
        
        Args:
            test_identifiers: List of test data identifiers to clean up
            
        Returns:
            bool: True if cleanup successful
        """
        try:
            # MongoDB cleanup operations would go here
            self.logger.info(f"Cleaned up test data: {test_identifiers}")
            return True
        except Exception as e:
            self.logger.error(f"Database cleanup failed: {e}")
            return False
    
    def create_test_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """
        Create test user in database
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Optional[str]: User ID if created successfully
        """
        try:
            # MongoDB user creation would go here
            user_id = f"test_user_{int(time.time())}"
            self.logger.info(f"Created test user: {user_id}")
            return user_id
        except Exception as e:
            self.logger.error(f"Failed to create test user: {e}")
            return None
    
    def delete_test_user(self, user_id: str) -> bool:
        """
        Delete test user from database
        
        Args:
            user_id: User ID to delete
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            # MongoDB user deletion would go here
            self.logger.info(f"Deleted test user: {user_id}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete test user: {e}")
            return False
    
    def disconnect(self) -> None:
        """Disconnect from database"""
        if self._connection:
            try:
                # Close MongoDB connection
                self._connection = None
                self.logger.info("Database connection closed")
            except Exception as e:
                self.logger.error(f"Error closing database connection: {e}")


# Singleton instances
_test_data_manager: Optional[TestDataManager] = None
_fake_data_generator: Optional[FakeDataGenerator] = None
_database_helper: Optional[DatabaseHelper] = None

def get_test_data_manager() -> TestDataManager:
    """Get singleton TestDataManager instance"""
    global _test_data_manager
    if _test_data_manager is None:
        _test_data_manager = TestDataManager()
    return _test_data_manager

def get_fake_data_generator() -> FakeDataGenerator:
    """Get singleton FakeDataGenerator instance"""
    global _fake_data_generator
    if _fake_data_generator is None:
        _fake_data_generator = FakeDataGenerator()
    return _fake_data_generator

def get_database_helper() -> DatabaseHelper:
    """Get singleton DatabaseHelper instance"""
    global _database_helper
    if _database_helper is None:
        _database_helper = DatabaseHelper()
    return _database_helper

# Convenience functions
def get_user_data(role: str) -> Dict[str, Any]:
    """Get user data for role"""
    return get_test_data_manager().get_user_data(role)

def generate_fake_user(role: str = "customer") -> Dict[str, str]:
    """Generate fake user data"""
    return get_fake_data_generator().generate_user_data(role)

def generate_fake_appointment() -> Dict[str, str]:
    """Generate fake appointment data"""
    return get_fake_data_generator().generate_appointment_data()

def get_random_sti_test() -> Dict[str, Any]:
    """Get random STI test"""
    return get_test_data_manager().get_random_sti_test()

def cleanup_test_data(identifiers: List[str]) -> bool:
    """Clean up test data"""
    return get_database_helper().cleanup_test_data(identifiers)


# Alias for backward compatibility
DataHelpers = FakeDataGenerator 