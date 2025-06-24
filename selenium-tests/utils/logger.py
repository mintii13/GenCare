"""
Logging System for GenCare Automation Framework
Comprehensive logging with file, console, and test-specific loggers
"""

import os
import json
import logging
import logging.handlers
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path


class LoggerManager:
    """Centralized logging manager for the framework"""
    
    def __init__(self, config_path: str = "config/config.json"):
        """
        Initialize LoggerManager
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.loggers: Dict[str, logging.Logger] = {}
        self._setup_log_directory()
        self._configure_root_logger()
    
    def _load_config(self, config_path: str) -> dict:
        """Load logging configuration from JSON file"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                return config.get('logging', {})
        except (FileNotFoundError, json.JSONDecodeError):
            return self._get_default_config()
    
    def _get_default_config(self) -> dict:
        """Return default logging configuration"""
        return {
            "level": "INFO",
            "file": "tests.log",
            "console": True,
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "date_format": "%Y-%m-%d %H:%M:%S"
        }
    
    def _setup_log_directory(self) -> None:
        """Create logs directory if it doesn't exist"""
        self.log_dir = Path("logs")
        self.log_dir.mkdir(exist_ok=True)
    
    def _configure_root_logger(self) -> None:
        """Configure the root logger"""
        # Clear existing handlers
        logging.getLogger().handlers.clear()
        
        # Set root logger level
        level = getattr(logging, self.config.get('level', 'INFO').upper())
        logging.getLogger().setLevel(level)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            fmt=self.config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'),
            datefmt=self.config.get('date_format', '%Y-%m-%d %H:%M:%S')
        )
        
        simple_formatter = logging.Formatter(
            fmt='%(levelname)s - %(message)s'
        )
        
        # Add console handler if enabled
        if self.config.get('console', True):
            console_handler = logging.StreamHandler()
            console_handler.setLevel(level)
            console_handler.setFormatter(simple_formatter)
            logging.getLogger().addHandler(console_handler)
        
        # Add file handler
        log_file = self.log_dir / self.config.get('file', 'tests.log')
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(detailed_formatter)
        logging.getLogger().addHandler(file_handler)
    
    def get_logger(self, name: str) -> logging.Logger:
        """
        Get or create a logger with the given name
        
        Args:
            name: Logger name
            
        Returns:
            logging.Logger: Configured logger
        """
        if name not in self.loggers:
            logger = logging.getLogger(name)
            self.loggers[name] = logger
        
        return self.loggers[name]
    
    def create_test_logger(self, test_name: str) -> logging.Logger:
        """
        Create a test-specific logger with its own file handler
        
        Args:
            test_name: Name of the test
            
        Returns:
            logging.Logger: Test-specific logger
        """
        logger_name = f"test.{test_name}"
        
        if logger_name in self.loggers:
            return self.loggers[logger_name]
        
        # Create logger
        logger = logging.getLogger(logger_name)
        logger.setLevel(getattr(logging, self.config.get('level', 'INFO').upper()))
        
        # Create test-specific formatter with more details
        test_formatter = logging.Formatter(
            fmt='%(asctime)s - [%(name)s] - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Create test-specific file handler
        test_log_file = self.log_dir / f"{test_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        test_file_handler = logging.FileHandler(test_log_file, encoding='utf-8')
        test_file_handler.setLevel(logging.DEBUG)  # Capture all details for test logs
        test_file_handler.setFormatter(test_formatter)
        
        logger.addHandler(test_file_handler)
        
        # Store logger
        self.loggers[logger_name] = logger
        
        logger.info(f"Test logger created for: {test_name}")
        return logger
    
    def log_test_start(self, test_name: str, logger: Optional[logging.Logger] = None) -> None:
        """
        Log test start with environment information
        
        Args:
            test_name: Name of the test
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('test_runner')
        
        separator = "=" * 80
        logger.info(separator)
        logger.info(f"STARTING TEST: {test_name}")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        logger.info(separator)
    
    def log_test_end(self, test_name: str, status: str, logger: Optional[logging.Logger] = None) -> None:
        """
        Log test end with status
        
        Args:
            test_name: Name of the test
            status: Test status (PASSED, FAILED, SKIPPED)
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('test_runner')
        
        separator = "=" * 80
        logger.info(separator)
        logger.info(f"FINISHED TEST: {test_name} - STATUS: {status}")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        logger.info(separator)
    
    def log_step(self, step_description: str, logger: Optional[logging.Logger] = None) -> None:
        """
        Log a test step
        
        Args:
            step_description: Description of the step
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('test_steps')
        
        logger.info(f"STEP: {step_description}")
    
    def log_assertion(self, assertion: str, result: bool, logger: Optional[logging.Logger] = None) -> None:
        """
        Log an assertion with result
        
        Args:
            assertion: Description of the assertion
            result: Whether assertion passed
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('assertions')
        
        status = "PASS" if result else "FAIL"
        level = logging.INFO if result else logging.ERROR
        logger.log(level, f"ASSERTION [{status}]: {assertion}")
    
    def log_page_action(self, action: str, element: str = "", logger: Optional[logging.Logger] = None) -> None:
        """
        Log a page action (click, type, etc.)
        
        Args:
            action: Action performed
            element: Element description (optional)
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('page_actions')
        
        message = f"ACTION: {action}"
        if element:
            message += f" on {element}"
        
        logger.info(message)
    
    def log_screenshot(self, screenshot_path: str, context: str = "", logger: Optional[logging.Logger] = None) -> None:
        """
        Log screenshot capture
        
        Args:
            screenshot_path: Path to screenshot file
            context: Context description (optional)
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('screenshots')
        
        message = f"SCREENSHOT: {screenshot_path}"
        if context:
            message += f" - {context}"
        
        logger.info(message)
    
    def log_performance(self, metric_name: str, value: float, unit: str = "ms", logger: Optional[logging.Logger] = None) -> None:
        """
        Log performance metrics
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('performance')
        
        logger.info(f"PERFORMANCE: {metric_name} = {value}{unit}")
    
    def log_api_call(self, method: str, url: str, status_code: int = None, response_time: float = None, logger: Optional[logging.Logger] = None) -> None:
        """
        Log API call details
        
        Args:
            method: HTTP method
            url: API endpoint URL
            status_code: Response status code (optional)
            response_time: Response time in milliseconds (optional)
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('api_calls')
        
        message = f"API: {method} {url}"
        if status_code is not None:
            message += f" - Status: {status_code}"
        if response_time is not None:
            message += f" - Time: {response_time}ms"
        
        logger.info(message)
    
    def log_error_with_context(self, error: Exception, context: Dict[str, Any], logger: Optional[logging.Logger] = None) -> None:
        """
        Log error with additional context
        
        Args:
            error: Exception that occurred
            context: Additional context information
            logger: Logger to use (optional)
        """
        if logger is None:
            logger = self.get_logger('errors')
        
        logger.error(f"ERROR: {type(error).__name__}: {str(error)}")
        logger.error(f"Context: {json.dumps(context, indent=2, default=str)}")
    
    def cleanup_old_logs(self, days_to_keep: int = 7) -> None:
        """
        Clean up log files older than specified days
        
        Args:
            days_to_keep: Number of days to keep logs
        """
        import time
        
        logger = self.get_logger('cleanup')
        cutoff_time = time.time() - (days_to_keep * 24 * 60 * 60)
        
        cleaned_count = 0
        for log_file in self.log_dir.glob("*.log"):
            if log_file.stat().st_mtime < cutoff_time:
                try:
                    log_file.unlink()
                    cleaned_count += 1
                    logger.debug(f"Deleted old log file: {log_file}")
                except Exception as e:
                    logger.warning(f"Failed to delete log file {log_file}: {e}")
        
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} old log files")


# Singleton instance
_logger_manager: Optional[LoggerManager] = None

def get_logger_manager() -> LoggerManager:
    """Get singleton LoggerManager instance"""
    global _logger_manager
    if _logger_manager is None:
        _logger_manager = LoggerManager()
    return _logger_manager

def get_logger(name: str) -> logging.Logger:
    """Get logger with specified name"""
    return get_logger_manager().get_logger(name)

def create_test_logger(test_name: str) -> logging.Logger:
    """Create test-specific logger"""
    return get_logger_manager().create_test_logger(test_name)

def log_test_start(test_name: str) -> None:
    """Log test start"""
    get_logger_manager().log_test_start(test_name)

def log_test_end(test_name: str, status: str) -> None:
    """Log test end with status"""
    get_logger_manager().log_test_end(test_name, status)

def log_step(step_description: str) -> None:
    """Log test step"""
    get_logger_manager().log_step(step_description)

def log_assertion(assertion: str, result: bool) -> None:
    """Log assertion result"""
    get_logger_manager().log_assertion(assertion, result)

def log_page_action(action: str, element: str = "") -> None:
    """Log page action"""
    get_logger_manager().log_page_action(action, element)

def log_screenshot(screenshot_path: str, context: str = "") -> None:
    """Log screenshot capture"""
    get_logger_manager().log_screenshot(screenshot_path, context)

def cleanup_old_logs(days_to_keep: int = 7) -> None:
    """Clean up old log files"""
    get_logger_manager().cleanup_old_logs(days_to_keep) 