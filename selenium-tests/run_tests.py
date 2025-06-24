#!/usr/bin/env python3
"""
Simple test runner for GenCare Selenium Tests
"""

import subprocess
import sys
import os

def run_tests(test_pattern=""):
    """Run tests with optional pattern filter"""
    
    # Change to selenium-tests directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Base pytest command
    cmd = ["python", "-m", "pytest", "-v"]
    
    # Add test pattern if provided
    if test_pattern:
        cmd.extend(["-k", test_pattern])
    
    # Add HTML report
    cmd.extend(["--html=reports/test_report.html", "--self-contained-html"])
    
    # Create reports directory
    os.makedirs("reports", exist_ok=True)
    
    print(f"🚀 Running tests with command: {' '.join(cmd)}")
    print("=" * 50)
    
    try:
        result = subprocess.run(cmd, check=True)
        print("\n✅ Tests completed successfully!")
        print(f"📊 Report saved to: {script_dir}/reports/test_report.html")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Tests failed with exit code: {e.returncode}")
        return False

if __name__ == "__main__":
    # Get test pattern from command line argument if provided
    pattern = sys.argv[1] if len(sys.argv) > 1 else ""
    
    if pattern:
        print(f"🎯 Running tests matching pattern: {pattern}")
    else:
        print("🎯 Running all tests")
    
    success = run_tests(pattern)
    sys.exit(0 if success else 1) 