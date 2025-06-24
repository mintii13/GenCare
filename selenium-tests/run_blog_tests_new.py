#!/usr/bin/env python3
"""
GenCare Blog Test Runner - New Clean Version
============================================
Professional blog testing command-line runner with enhanced features.
"""

import os
import sys
import argparse
import subprocess
import json
from datetime import datetime
from pathlib import Path


class BlogTestRunnerNew:
    """
    Enhanced Blog Test Runner for GenCare
    ====================================
    
    Features:
    - Multiple test categories
    - Flexible execution options
    - Better error handling
    - Report generation
    - Parallel execution support
    """
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.test_file = "tests/test_blog_new.py"
        self.reports_dir = self.script_dir / "reports"
        self.ensure_reports_directory()
    
    def ensure_reports_directory(self):
        """Ensure reports directory exists"""
        self.reports_dir.mkdir(exist_ok=True)
        (self.reports_dir / "allure-results").mkdir(exist_ok=True)
        (self.reports_dir / "screenshots").mkdir(exist_ok=True)
    
    def get_test_categories(self):
        """Define available test categories"""
        return {
            "all": {
                "description": "Run all blog tests (comprehensive)",
                "filter": "",
                "tests": ["TestBlogSystemNew", "TestAuthenticatedBlogFeatures", "TestBlogPerformance"]
            },
            "basic": {
                "description": "Run basic blog functionality tests",
                "filter": "TestBlogSystemNew",
                "tests": ["TestBlogSystemNew"]
            },
            "listing": {
                "description": "Test blog listing and navigation",
                "filter": "test_blog_list or test_blog_navigation or test_blog_listing",
                "tests": ["test_blog_list_page_loads", "test_blog_navigation_menu", "test_blog_listing_display"]
            },
            "access": {
                "description": "Test access control and permissions",
                "filter": "test_guest_blog or test_access",
                "tests": ["test_guest_blog_creation_access", "test_guest_blog_listing_access"]
            },
            "creation": {
                "description": "Test blog creation functionality",
                "filter": "test_blog_creation",
                "tests": ["test_blog_creation_form_validation", "test_blog_creation_workflow"]
            },
            "auth": {
                "description": "Test authenticated blog features",
                "filter": "TestAuthenticatedBlogFeatures",
                "tests": ["TestAuthenticatedBlogFeatures"]
            },
            "search": {
                "description": "Test search and filtering",
                "filter": "test_blog_search",
                "tests": ["test_blog_search"]
            },
            "ui": {
                "description": "Test UI/UX and responsiveness",
                "filter": "test_blog_page_responsive or test_invalid_blog_url",
                "tests": ["test_blog_page_responsive", "test_invalid_blog_url"]
            },
            "performance": {
                "description": "Test blog performance",
                "filter": "TestBlogPerformance",
                "tests": ["TestBlogPerformance"]
            },
            "quick": {
                "description": "Run quick smoke tests (essential features)",
                "filter": "test_blog_list_page_loads or test_guest_blog_listing_access",
                "tests": ["test_blog_list_page_loads", "test_guest_blog_listing_access"]
            },
            "crud": {
                "description": "Test blog CRUD operations with role-based access",
                "filter": "TestBlogCRUD",
                "tests": ["TestBlogCRUD"]
            },
            "permissions": {
                "description": "Test role-based permissions matrix",
                "filter": "test_role_permissions_matrix or test_authorized_roles_can_create",
                "tests": ["test_role_permissions_matrix", "test_authorized_roles_can_create_blogs"]
            }
        }
    
    def build_pytest_command(self, category, options):
        """Build pytest command with proper options"""
        cmd = [sys.executable, "-m", "pytest"]
        
        # Add test file
        cmd.append(self.test_file)
        
        # Add category filter
        categories = self.get_test_categories()
        if category in categories and categories[category]["filter"]:
            cmd.extend(["-k", categories[category]["filter"]])
        
        # Add basic options
        cmd.extend(["-v", "--tb=short"])
        
        # Add report options
        if options.get("allure", True):
            cmd.extend([f"--alluredir={self.reports_dir}/allure-results"])
        
        if options.get("html", True):
            cmd.extend([f"--html={self.reports_dir}/report.html", "--self-contained-html"])
        
        # Add junit XML
        cmd.extend([f"--junit-xml={self.reports_dir}/junit.xml"])
        
        # Add parallel execution
        if options.get("parallel", False):
            cmd.extend(["-n", "auto"])
        
        # Add headless mode
        if options.get("headless", False):
            cmd.extend(["--headless"])
        
        # Add browser selection
        if options.get("browser"):
            cmd.extend([f"--browser={options['browser']}"])
        
        # Add custom markers
        if options.get("markers"):
            for marker in options["markers"]:
                cmd.extend(["-m", marker])
        
        # Add verbosity
        if options.get("verbose", False):
            cmd.append("-vv")
        
        # Add strict mode
        if options.get("strict", False):
            cmd.append("--strict-markers")
        
        return cmd
    
    def run_tests(self, category, options=None):
        """Execute blog tests with specified category and options"""
        if options is None:
            options = {}
        
        categories = self.get_test_categories()
        
        # Validate category
        if category not in categories:
            print(f"❌ Unknown category: {category}")
            print(f"Available categories: {', '.join(categories.keys())}")
            return False
        
        # Display test info
        category_info = categories[category]
        print(f"🚀 Running GenCare Blog Tests - {category.upper()}")
        print("=" * 50)
        print(f"📋 Description: {category_info['description']}")
        
        # Build command
        cmd = self.build_pytest_command(category, options)
        print(f"🔧 Command: {' '.join(cmd)}")
        print("-" * 50)
        
        # Execute tests
        try:
            start_time = datetime.now()
            
            # Run with subprocess for better control
            result = subprocess.run(
                cmd,
                cwd=self.script_dir,
                capture_output=False,  # Show output in real-time
                text=True
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Display results
            print("\n" + "=" * 50)
            if result.returncode == 0:
                print(f"✅ Blog tests completed successfully (exit code: {result.returncode})")
                print(f"⏱️  Duration: {duration:.2f} seconds")
            else:
                print(f"❌ Blog tests completed with errors (exit code: {result.returncode})")
                print(f"⏱️  Duration: {duration:.2f} seconds")
            
            return result.returncode == 0
            
        except FileNotFoundError:
            print("❌ pytest not found. Make sure it's installed in your virtual environment.")
            print("💡 Try: pip install pytest")
            return False
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return False
    
    def list_categories(self):
        """Display available test categories"""
        categories = self.get_test_categories()
        
        print("Available Blog Test Categories:")
        print("=" * 40)
        
        for category, info in categories.items():
            print(f"  {category:<12} - {info['description']}")
            if info['tests']:
                test_count = len(info['tests'])
                print(f"               ({test_count} tests)")
        
        print("\nExample usage:")
        print("  python run_blog_tests_new.py quick")
        print("  python run_blog_tests_new.py all --headless")
        print("  python run_blog_tests_new.py creation --parallel")
    
    def run_specific_test(self, test_name, options=None):
        """Run a specific test by name"""
        if options is None:
            options = {}
        
        print(f"🎯 Running specific test: {test_name}")
        print("=" * 50)
        
        cmd = [sys.executable, "-m", "pytest"]
        cmd.append(self.test_file)
        cmd.extend(["-k", test_name])
        cmd.extend(["-v", "--tb=short"])
        
        # Add options
        if options.get("allure", True):
            cmd.extend([f"--alluredir={self.reports_dir}/allure-results"])
        
        if options.get("headless", False):
            cmd.extend(["--headless"])
        
        try:
            result = subprocess.run(cmd, cwd=self.script_dir)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Error running specific test: {e}")
            return False
    
    def generate_report_summary(self):
        """Generate test report summary"""
        try:
            junit_file = self.reports_dir / "junit.xml"
            if junit_file.exists():
                print(f"📊 Test reports available in: {self.reports_dir}")
                print(f"   - HTML Report: {self.reports_dir}/report.html")
                print(f"   - JUnit XML: {self.reports_dir}/junit.xml")
                print(f"   - Allure Results: {self.reports_dir}/allure-results")
                return True
        except Exception as e:
            print(f"⚠️  Could not generate report summary: {e}")
        return False


def main():
    """Main entry point for blog test runner"""
    parser = argparse.ArgumentParser(
        description="GenCare Blog Test Runner - New Clean Version",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_blog_tests_new.py quick                    # Quick smoke tests
  python run_blog_tests_new.py all --headless          # All tests in headless mode
  python run_blog_tests_new.py creation --parallel     # Blog creation tests with parallel execution
  python run_blog_tests_new.py --list                  # Show available categories
  python run_blog_tests_new.py --test test_blog_list   # Run specific test
        """
    )
    
    # Category argument
    parser.add_argument(
        "category",
        nargs="?",
        default="quick",
        help="Test category to run (default: quick)"
    )
    
    # Options
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available test categories"
    )
    
    parser.add_argument(
        "--test",
        help="Run specific test by name"
    )
    
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run tests in headless mode"
    )
    
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="Run tests in parallel"
    )
    
    parser.add_argument(
        "--browser",
        choices=["chrome", "firefox", "edge"],
        help="Browser to use for tests"
    )
    
    parser.add_argument(
        "--no-allure",
        action="store_true",
        help="Disable Allure reporting"
    )
    
    parser.add_argument(
        "--no-html",
        action="store_true",
        help="Disable HTML reporting"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enable strict mode"
    )
    
    args = parser.parse_args()
    
    # Create runner instance
    runner = BlogTestRunnerNew()
    
    # Handle list request
    if args.list:
        runner.list_categories()
        return
    
    # Handle specific test request
    if args.test:
        options = {
            "headless": args.headless,
            "allure": not args.no_allure
        }
        success = runner.run_specific_test(args.test, options)
        sys.exit(0 if success else 1)
    
    # Build options
    options = {
        "headless": args.headless,
        "parallel": args.parallel,
        "browser": args.browser,
        "allure": not args.no_allure,
        "html": not args.no_html,
        "verbose": args.verbose,
        "strict": args.strict
    }
    
    # Run tests
    try:
        success = runner.run_tests(args.category, options)
        
        # Generate report summary
        runner.generate_report_summary()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 