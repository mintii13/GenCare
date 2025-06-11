from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
import time

def open_login_modal(driver):
    driver.get("http://localhost:5173")
    time.sleep(1)
    driver.find_element(By.XPATH, "//button[contains(text(), 'Đăng nhập')]").click()
    time.sleep(1)

def test_login_success():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.NAME, "email").send_keys("consultant1@gencare.com")
    driver.find_element(By.NAME, "password").send_keys("password")
    driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]").click()
    time.sleep(2)
    print("Login success test completed!")
    driver.quit()

def test_login_wrong_password():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.NAME, "email").send_keys("consultant1@gencare.com")
    driver.find_element(By.NAME, "password").send_keys("sai_mat_khau")
    driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]").click()
    time.sleep(2)
    try:
        error = driver.find_element(By.CSS_SELECTOR, ".text-red-500")
        print("Error message:", error.text)
    except NoSuchElementException:
        print("No error message found!")
    driver.quit()

def test_login_empty_fields():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]").click()
    time.sleep(1)
    email_required = driver.find_element(By.NAME, "email").get_attribute("required")
    password_required = driver.find_element(By.NAME, "password").get_attribute("required")
    print("Email required:", email_required)
    print("Password required:", password_required)
    driver.quit()

def test_login_invalid_email():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.NAME, "email").send_keys("khongphaiemail")
    driver.find_element(By.NAME, "password").send_keys("password")
    driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]").click()
    time.sleep(2)
    try:
        error = driver.find_element(By.CSS_SELECTOR, ".text-red-500")
        print("Error message:", error.text)
    except NoSuchElementException:
        print("No error message found!")
    driver.quit()

def test_login_not_exist_user():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.NAME, "email").send_keys("khongtontai@example.com")
    driver.find_element(By.NAME, "password").send_keys("password")
    driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Đăng nhập')]").click()
    time.sleep(2)
    try:
        error = driver.find_element(By.CSS_SELECTOR, ".text-red-500")
        print("Error message:", error.text)
    except NoSuchElementException:
        print("No error message found!")
    driver.quit()

def test_close_modal():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.XPATH, "//div[contains(@class,'flex') and contains(@class,'justify-between') and contains(@class,'items-center') and contains(@class,'mb-4')]/button").click()
    time.sleep(1)
    try:
        driver.find_element(By.CSS_SELECTOR, ".fixed.inset-0")
        print("Modal vẫn còn mở!")
    except NoSuchElementException:
        print("Modal đã đóng thành công!")
    driver.quit()

def test_switch_to_register():
    driver = webdriver.Chrome()
    open_login_modal(driver)
    driver.find_element(By.XPATH, "//div[contains(@class,'mt-4') and contains(@class,'text-center')]//button[contains(text(),'Đăng ký')]").click()
    time.sleep(2)
    print("Đã chuyển sang trang đăng ký, url hiện tại:", driver.current_url)
    driver.quit()

if __name__ == "__main__":
    test_login_success()
    test_login_wrong_password()
    test_login_empty_fields()
    test_login_invalid_email()
    test_login_not_exist_user()
    test_close_modal()
    test_switch_to_register() 