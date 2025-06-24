#!/usr/bin/env python3
"""
GenCare Authentication Tests Runner
Runs comprehensive authentication and authorization tests for 5 user roles
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def main():
    """Main test runner function"""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run GenCare Authentication Tests')
    parser.add_argument('--role', choices=['customer', 'consultant', 'staff', 'admin', 'all'], 
                       default='all', help='Specific role to test (default: all)')
    parser.add_argument('--headless', action='store_true', 
                       help='Run tests in headless mode')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--report', action='store_true',
                       help='Generate Allure report')
    
    args = parser.parse_args()
    
    # Change to selenium-tests directory
    test_dir = Path(__file__).parent / "selenium-tests"
    os.chdir(test_dir)
    
    print("🔐 GenCare Authentication Tests Runner")
    print("=" * 50)
    print(f"📂 Working directory: {test_dir}")
    print(f"🎭 Testing role(s): {args.role}")
    print(f"👁️  Headless mode: {args.headless}")
    print()
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    # Add test files
    if args.role == 'all':
        cmd.extend([
            "tests/test_authentication.py",
            "tests/test_authorization.py"
        ])
    else:
        # Run specific role tests
        cmd.extend([
            "tests/test_authentication.py",
            "-k", f"test_valid_login_all_roles[{args.role}] or test_role_based_access_after_login[{args.role}]"
        ])
    
    # Add pytest options
    cmd.extend([
        "-v" if args.verbose else "-s",
        "--tb=short",
        "--strict-markers",
        "--disable-warnings"
    ])
    
    # Add Allure reporting if requested
    if args.report:
        allure_dir = test_dir / "reports" / "allure-results"
        allure_dir.mkdir(parents=True, exist_ok=True)
        cmd.extend(["--alluredir", str(allure_dir)])
    
    # Add headless mode environment variable
    env = os.environ.copy()
    if args.headless:
        env["HEADLESS"] = "true"
    
    print("🚀 Starting Authentication Tests...")
    print(f"📝 Command: {' '.join(cmd)}")
    print()
    
    try:
        # Run tests
        result = subprocess.run(cmd, env=env, check=False)
        
        print()
        print("=" * 50)
        
        if result.returncode == 0:
            print("✅ All Authentication Tests PASSED!")
            
            # Generate Allure report if requested
            if args.report:
                print("📊 Generating Allure report...")
                report_dir = test_dir / "reports" / "allure-report"
                
                try:
                    subprocess.run([
                        "allure", "generate", str(allure_dir), 
                        "--output", str(report_dir), "--clean"
                    ], check=True)
                    
                    print(f"📈 Allure report generated: {report_dir}")
                    print("💡 To view report: allure open reports/allure-report")
                    
                except subprocess.CalledProcessError:
                    print("⚠️  Failed to generate Allure report (allure command not found)")
                except FileNotFoundError:
                    print("⚠️  Allure not installed. Install with: pip install allure-pytest")
        else:
            print("❌ Some Authentication Tests FAILED!")
            print(f"💥 Exit code: {result.returncode}")
            
        return result.returncode
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Error running tests: {e}")
        return 1


def show_test_summary():
    """Show summary of available authentication tests"""
    
    print()
    print("🧪 GenCare Authentication Test Suite")
    print("=" * 50)
    print()
    
    print("📋 Test Categories:")
    print("  • Authentication Tests (test_authentication.py)")
    print("    - Valid login for all 5 roles")
    print("    - Invalid credentials handling") 
    print("    - Email format validation")
    print("    - Empty credentials validation")
    print("    - Password security")
    print("    - Remember Me functionality")
    print("    - Google OAuth integration")
    print("    - Logout functionality")
    print("    - Session management")
    print()
    
    print("  • Authorization Tests (test_authorization.py)")
    print("    - Guest public access")
    print("    - Customer permissions")
    print("    - Consultant permissions")
    print("    - Staff permissions") 
    print("    - Admin full access")
    print("    - Role hierarchy enforcement")
    print("    - Privilege escalation prevention")
    print("    - API endpoint security")
    print("    - Blog access control")
    print("    - Appointment access control")
    print("    - Data access control")
    print()
    
    print("🎭 User Roles Tested:")
    print("  1. Guest (anonymous) - Public content only")
    print("  2. Customer - Book appointments, view health records") 
    print("  3. Consultant - Manage appointments, create blogs")
    print("  4. Staff - Manage users, view reports")
    print("  5. Admin - Full system access")
    print()
    
    print("🚀 Usage Examples:")
    print("  python run_auth_tests.py                    # Run all auth tests")
    print("  python run_auth_tests.py --role customer    # Test customer role only")
    print("  python run_auth_tests.py --headless         # Run in headless mode")
    print("  python run_auth_tests.py --report           # Generate Allure report")
    print("  python run_auth_tests.py --verbose          # Verbose output")
    print()
    
    print("📊 Test Reports:")
    print("  • Console output: Real-time test results")
    print("  • Allure reports: HTML reports with detailed results")
    print("  • Screenshots: Saved for failed tests")
    print("  • Logs: Detailed execution logs")
    print()


if __name__ == "__main__":
    # Show summary if no arguments provided
    if len(sys.argv) == 1:
        show_test_summary()
        sys.exit(0)
    
    # Run tests
    exit_code = main()
    sys.exit(exit_code) 