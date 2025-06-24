#!/usr/bin/env python3
"""
🏥 GenCare Comprehensive Test Suite Runner
Main test runner for all GenCare healthcare system components
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
import time


class GenCareTestRunner:
    """Comprehensive test runner for GenCare Healthcare System"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent
        self.selenium_dir = self.root_dir / "selenium-tests"
        self.reports_dir = self.selenium_dir / "reports"
        
        # Test suite configurations
        self.test_suites = {
            "auth": {
                "name": "🔐 Authentication & Authorization Tests",
                "files": ["tests/test_authentication.py", "tests/test_authorization.py"],
                "priority": 1,
                "description": "Tests login, logout, and role-based access control"
            },
            "blog": {
                "name": "📝 Blog CRUD Tests",
                "files": ["tests/test_blog_crud_working.py", "tests/test_blog_new.py"],
                "priority": 2,
                "description": "Tests blog creation, reading, updating, and deletion"
            },
            "appointment": {
                "name": "📅 Appointment Management Tests",
                "files": ["tests/test_gencare_features.py", "tests/test_appointments.py"],
                "priority": 3,
                "description": "Tests appointment booking and management"
            },
            "health": {
                "name": "🏥 Health Features Tests",
                "files": ["tests/test_health_features.py"],
                "priority": 4,
                "description": "Tests health tracking and consultation features"
            },
            "admin": {
                "name": "👨‍💼 Admin Management Tests",
                "files": ["tests/test_admin_manual.py"],
                "priority": 5,
                "description": "Tests admin panel and user management"
            }
        }
    
    def setup_environment(self):
        """Setup test environment and directories"""
        print("🔧 Setting up test environment...")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        os.chdir(self.selenium_dir)
        print(f"📂 Working directory: {self.selenium_dir}")
    
    def run_test_suite(self, suite_name, verbose=False, headless=False, generate_report=True):
        """Run a specific test suite"""
        if suite_name not in self.test_suites:
            print(f"❌ Unknown test suite: {suite_name}")
            return False
        
        suite = self.test_suites[suite_name]
        print(f"\n🚀 Running {suite['name']}")
        print("=" * 60)
        
        # Build pytest command
        cmd = ["python", "-m", "pytest"]
        
        # Add test files
        for test_file in suite['files']:
            if (self.selenium_dir / test_file).exists():
                cmd.append(test_file)
        
        # Add options
        cmd.extend(["-v" if verbose else "-s", "--tb=short"])
        
        # Add report generation
        if generate_report:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            html_report = self.reports_dir / f"{suite_name}_report_{timestamp}.html"
            cmd.extend(["--html", str(html_report), "--self-contained-html"])
        
        # Set environment
        env = os.environ.copy()
        if headless:
            env["HEADLESS"] = "true"
        
        start_time = time.time()
        
        try:
            result = subprocess.run(cmd, env=env, check=False)
            duration = time.time() - start_time
            
            if result.returncode == 0:
                print(f"✅ {suite['name']} - ALL TESTS PASSED!")
                print(f"⏱️  Duration: {duration:.2f} seconds")
                return True
            else:
                print(f"❌ {suite['name']} - SOME TESTS FAILED!")
                return False
                
        except Exception as e:
            print(f"💥 Error running {suite['name']}: {e}")
            return False
    
    def run_all_suites(self, verbose=False, headless=False, generate_report=True, fail_fast=False):
        """Run all test suites"""
        print("🏥 GenCare Comprehensive Test Suite")
        print("=" * 60)
        
        sorted_suites = sorted(self.test_suites.items(), key=lambda x: x[1]['priority'])
        results = {}
        start_time = time.time()
        
        for suite_name, suite_info in sorted_suites:
            success = self.run_test_suite(suite_name, verbose, headless, generate_report)
            results[suite_name] = success
            
            if not success and fail_fast:
                break
        
        # Final summary
        total_duration = time.time() - start_time
        passed_count = sum(1 for success in results.values() if success)
        total_count = len(results)
        
        print("\n" + "=" * 60)
        print("🏁 FINAL TEST EXECUTION SUMMARY")
        print("=" * 60)
        print(f"📊 Total Suites: {total_count}")
        print(f"✅ Passed: {passed_count}")
        print(f"❌ Failed: {total_count - passed_count}")
        print(f"⏱️  Total Duration: {total_duration:.2f} seconds")
        
        if all(results.values()):
            print("🎉 ALL TEST SUITES PASSED! GenCare system is healthy! 🎉")
        else:
            print("⚠️  SOME TEST SUITES FAILED. Please review the reports.")
        
        return all(results.values())
    
    def list_available_suites(self):
        """List all available test suites"""
        print("🧪 Available GenCare Test Suites")
        print("=" * 60)
        
        for suite_name, suite_info in sorted(self.test_suites.items(), key=lambda x: x[1]['priority']):
            print(f"\n{suite_info['priority']}. {suite_info['name']}")
            print(f"   📝 {suite_info['description']}")
            print(f"   🔧 Command: python run_gencare_tests.py --suite {suite_name}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='🏥 GenCare Comprehensive Test Suite Runner')
    
    parser.add_argument('--suite', choices=['auth', 'blog', 'appointment', 'health', 'admin', 'all'], 
                       default='all', help='Specific test suite to run')
    parser.add_argument('--headless', action='store_true', help='Run tests in headless mode')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    parser.add_argument('--no-report', action='store_true', help='Skip report generation')
    parser.add_argument('--fail-fast', action='store_true', help='Stop on first failure')
    parser.add_argument('--list', action='store_true', help='List available test suites')
    
    args = parser.parse_args()
    
    runner = GenCareTestRunner()
    
    if args.list:
        runner.list_available_suites()
        return 0
    
    runner.setup_environment()
    
    if args.suite == 'all':
        success = runner.run_all_suites(args.verbose, args.headless, not args.no_report, args.fail_fast)
    else:
        success = runner.run_test_suite(args.suite, args.verbose, args.headless, not args.no_report)
    
    return 0 if success else 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️  Test execution interrupted by user")
        sys.exit(1) 