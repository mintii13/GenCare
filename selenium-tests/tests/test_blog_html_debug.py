"""
Blog HTML Structure Debug Test
Kiểm tra actual HTML structure của blog page để tìm selectors đúng
"""

import pytest
import allure
from pages.base_page import BasePage
from pages.blog_page_new import BlogPageNew
from utils.logger import get_logger


@allure.epic("GenCare Blog System")
@allure.feature("HTML Structure Debug")
class TestBlogHTMLDebug:
    """Debug actual HTML structure of blog page"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.logger = get_logger(cls.__name__)
        cls.logger.info("=== Blog HTML Debug Test Suite Started ===")
    
    def setup_method(self, method):
        """Setup for each test method"""
        self.logger.info(f"\n🔍 Starting HTML debug test: {method.__name__}")
    
    @pytest.fixture(autouse=True)
    def setup_pages(self, driver):
        """Setup page objects for each test"""
        self.base_page = BasePage(driver)
        self.blog_page = BlogPageNew(driver)
    
    @allure.story("HTML Structure Inspection")
    @allure.severity("critical")
    def test_inspect_blog_page_html(self):
        """Inspect actual HTML structure of blog page"""
        with allure.step("Inspecting blog page HTML structure"):
            
            # Navigate to blog page
            self.logger.info("Navigating to blog page")
            self.base_page.navigate_to("/blogs")
            self.base_page.wait_for_page_load()
            
            # Get page source
            page_source = self.base_page.driver.page_source
            
            # Log important parts of HTML
            self.logger.info("=== PAGE SOURCE ANALYSIS ===")
            
            # Check for common React/Vue patterns
            if "id=\"root\"" in page_source:
                self.logger.info("✅ Found React root element")
            
            if "data-react" in page_source:
                self.logger.info("✅ Found React data attributes")
            
            # Look for blog-related elements
            blog_keywords = [
                "blog", "Blog", "BLOG",
                "article", "Article", 
                "post", "Post",
                "content", "Content"
            ]
            
            found_keywords = []
            for keyword in blog_keywords:
                if keyword in page_source:
                    found_keywords.append(keyword)
            
            self.logger.info(f"Found blog-related keywords: {found_keywords}")
            
            # Check for CSS classes
            import re
            
            # Extract all CSS classes
            class_pattern = r'class="([^"]*)"'
            classes = re.findall(class_pattern, page_source)
            
            blog_related_classes = []
            for class_str in classes:
                if any(keyword.lower() in class_str.lower() for keyword in ["blog", "article", "post", "content"]):
                    blog_related_classes.append(class_str)
            
            self.logger.info(f"Blog-related CSS classes found: {blog_related_classes[:10]}")  # First 10
            
            # Look for specific patterns
            self.check_for_loading_states(page_source)
            self.check_for_error_messages(page_source)
            self.check_for_empty_states(page_source)
            
            # Check for API calls or data
            self.check_for_api_references(page_source)
            
            # Save HTML for manual inspection
            with open("reports/blog_page_source.html", "w", encoding="utf-8") as f:
                f.write(page_source)
            self.logger.info("📄 Page source saved to: reports/blog_page_source.html")
            
            # Take screenshot for visual inspection
            self.base_page.driver.save_screenshot("reports/screenshots/blog_page_structure.png")
            self.logger.info("📸 Screenshot saved for visual inspection")
    
    def check_for_loading_states(self, page_source):
        """Check for loading indicators"""
        loading_indicators = [
            "loading", "Loading", "LOADING",
            "spinner", "Spinner", 
            "đang tải", "Đang tải",
            "skeleton", "Skeleton"
        ]
        
        found_loading = []
        for indicator in loading_indicators:
            if indicator in page_source:
                found_loading.append(indicator)
        
        if found_loading:
            self.logger.info(f"🔄 Loading indicators found: {found_loading}")
        else:
            self.logger.info("❌ No loading indicators found")
    
    def check_for_error_messages(self, page_source):
        """Check for error messages"""
        error_indicators = [
            "error", "Error", "ERROR",
            "failed", "Failed", "FAILED",
            "lỗi", "Lỗi",
            "không thể", "Không thể",
            "404", "500", "Network Error"
        ]
        
        found_errors = []
        for indicator in error_indicators:
            if indicator in page_source:
                found_errors.append(indicator)
        
        if found_errors:
            self.logger.error(f"❌ Error indicators found: {found_errors}")
        else:
            self.logger.info("✅ No error indicators found")
    
    def check_for_empty_states(self, page_source):
        """Check for empty state messages"""
        empty_indicators = [
            "no blogs", "No blogs", "NO BLOGS",
            "không có blog", "Không có blog",
            "empty", "Empty", "EMPTY",
            "trống", "Trống"
        ]
        
        found_empty = []
        for indicator in empty_indicators:
            if indicator in page_source:
                found_empty.append(indicator)
        
        if found_empty:
            self.logger.info(f"📭 Empty state indicators found: {found_empty}")
        else:
            self.logger.info("✅ No empty state indicators found")
    
    def check_for_api_references(self, page_source):
        """Check for API-related content"""
        api_indicators = [
            "/api/", "/blogs", 
            "fetch", "axios", "api",
            "localhost", "gencare"
        ]
        
        found_api = []
        for indicator in api_indicators:
            if indicator in page_source:
                found_api.append(indicator)
        
        if found_api:
            self.logger.info(f"🌐 API references found: {found_api}")
        else:
            self.logger.info("❌ No API references found in page source")
    
    @allure.story("Element Finder")
    @allure.severity("high")
    def test_find_actual_blog_elements(self):
        """Try to find actual blog elements using different selectors"""
        with allure.step("Finding actual blog elements"):
            
            # Navigate to blog page
            self.base_page.navigate_to("/blogs")
            self.base_page.wait_for_page_load()
            
            # Try various selectors to find blog content
            potential_selectors = [
                # Generic article/content selectors
                ("tag name", "article"),
                ("tag name", "main"),
                ("tag name", "section"),
                ("css selector", "[role='main']"),
                
                # Blog-specific patterns
                ("css selector", "div[class*='blog']"),
                ("css selector", "div[class*='Blog']"),
                ("css selector", "div[class*='article']"),
                ("css selector", "div[class*='Article']"),
                ("css selector", "div[class*='post']"),
                ("css selector", "div[class*='Post']"),
                ("css selector", "div[class*='content']"),
                ("css selector", "div[class*='Content']"),
                
                # Grid/list patterns
                ("css selector", "div[class*='grid']"),
                ("css selector", "div[class*='Grid']"),
                ("css selector", "div[class*='list']"),
                ("css selector", "div[class*='List']"),
                ("css selector", "div[class*='container']"),
                ("css selector", "div[class*='Container']"),
                
                # Card patterns
                ("css selector", "div[class*='card']"),
                ("css selector", "div[class*='Card']"),
                
                # Common UI library patterns
                ("css selector", ".ant-list"),
                ("css selector", ".mui-list"),
                ("css selector", ".chakra-stack"),
                
                # Test ID patterns
                ("css selector", "[data-testid*='blog']"),
                ("css selector", "[data-cy*='blog']"),
                ("css selector", "[data-test*='blog']"),
            ]
            
            found_elements = []
            
            for selector_type, selector_value in potential_selectors:
                try:
                    elements = self.base_page.driver.find_elements(selector_type, selector_value)
                    if elements:
                        found_elements.append({
                            "selector": (selector_type, selector_value),
                            "count": len(elements),
                            "first_text": elements[0].text[:100] if elements[0].text else "No text",
                            "first_html": elements[0].get_attribute("outerHTML")[:200] if elements else "No HTML"
                        })
                        self.logger.info(f"✅ Found {len(elements)} elements with: {selector_type}={selector_value}")
                except Exception as e:
                    self.logger.debug(f"❌ Error with selector {selector_type}={selector_value}: {str(e)}")
            
            # Log findings
            self.logger.info(f"📊 Total selectors that found elements: {len(found_elements)}")
            
            for finding in found_elements[:5]:  # Top 5 findings
                self.logger.info(f"🎯 Selector: {finding['selector']}")
                self.logger.info(f"   Count: {finding['count']}")
                self.logger.info(f"   Text preview: {finding['first_text']}")
                self.logger.info(f"   HTML preview: {finding['first_html']}")
                self.logger.info("---")
            
            # Save findings to file
            import json
            with open("reports/blog_element_findings.json", "w", encoding="utf-8") as f:
                json.dump(found_elements, f, indent=2, ensure_ascii=False)
            
            self.logger.info("💾 Element findings saved to: reports/blog_element_findings.json") 