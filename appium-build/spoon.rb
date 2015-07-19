require 'selenium-webdriver'
require 'base64'

caps                      = {}
caps['deviceName']        = 'Android Emulator'
caps['deviceOrientation'] = 'portrait'
caps['platformVersion']   = '5.1'
caps['platformName']      = 'Android'
caps['appPackage']        = 'com.android.settings'
caps['appActivity']       = '.Settings'
caps['newCommandTimeout'] = false

# local appium instance on default port
server_url                = 'http://127.0.0.1:4723/wd/hub'

client = Selenium::WebDriver::Remote::Http::Default.new
client.timeout = 999_999

driver = Selenium::WebDriver.for :remote, http_client: client, desired_capabilities: caps, url: server_url
data = driver.execute_script 'mobile: spoon'

spoon_output_zip = 'spoon-output.zip'
File.delete(spoon_output_zip) if File.exist?(spoon_output_zip)

File.open(spoon_output_zip, 'w') { |f| f.write Base64.decode64 data }

driver.quit rescue nil
