# 🧪 GenCare Test Suite (Clean Version)

## 📋 Tổng quan
Test suite cho ứng dụng GenCare đã được clean up và sẵn sàng để tổ chức lại theo test plan mới.

## 🗂️ Cấu trúc hiện tại

```
selenium-tests/
├── tests/                      # Test files chính
│   ├── test_auth_flows.py     # Authentication tests (14KB)
│   ├── test_blog_flows.py     # Blog functionality tests (22KB)  
│   ├── test_gencare_features.py # Core GenCare features (14KB)
│   ├── test_health_features.py # Health features (17KB)
│   └── conftest.py            # Pytest config (6KB)
├── pages/                      # Page Object Model
├── config/                     # Test configuration
├── utils/                      # Test utilities
├── drivers/                    # WebDriver files
├── venv/                       # Virtual environment
├── pytest.ini                 # Pytest settings
├── requirements.txt            # Dependencies
├── run_tests.py               # Simple test runner
├── TEST_PLAN.md               # Test planning guide
└── README.md                  # This file
```

## 🚀 Cách chạy tests

### Option 1: Sử dụng Python script
```bash
# Chạy tất cả tests
python run_tests.py

# Chạy tests với pattern cụ thể
python run_tests.py "auth"
python run_tests.py "blog"
```

### Option 2: Sử dụng pytest trực tiếp
```bash
# Activate virtual environment
cd selenium-tests
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Chạy tất cả tests
pytest -v

# Chạy tests với HTML report
pytest -v --html=reports/test_report.html --self-contained-html
```

## 📊 Test Statistics
- **Total test files**: 4 chính + 1 config
- **Total code**: ~87KB
- **Status**: ✅ Clean & Ready for reorganization

## 📝 Next Steps
1. ✅ **Clean up completed** - Đã xóa tất cả file duplicate và không cần thiết
2. ⏳ **Chọn cấu trúc test plan** - Xem `TEST_PLAN.md` để chọn option
3. ⏳ **Reorganize tests** - Tổ chức lại theo cấu trúc đã chọn
4. ⏳ **Implement new test cases** - Thêm test cases mới theo plan

## 🔧 Requirements
- Python 3.8+
- Chrome/Edge browser
- Dependencies trong `requirements.txt`

---
**Ready for reorganization! 🎯** 