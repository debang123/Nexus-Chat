# def valid_ip(ip):
#     parts = ip.split(".")

#     if len(parts) != 4:
#         return False
    
#     for part in parts:
#         if not part.isdigit() or int(part) > 255:
#             return False
        
#         return True
    
# ip = input("Enter IP address: ")

# if valid_ip(ip):
#     print("Valid IP")
# else:
#     print("Invalid IP")
    


# 17
# blacklist = ["192.168.1.10", "10.0.0.5"]

# ip = input("Enter incoming IP: ")

# if ip in blacklist:
#     print("Access Denied")
# else:
#     print("Access Allowed")


# files = ["data.txt","viras.exe","image.jpg","script.bat"]

# for file in files:
#     if file.endswith(".exe") or file.endswith(".bat"):
#         print(file,"is suspicious")

# def check_url(url):
#     suspicious = ["login", "verify", "bank", "free", "secure"]

#     for word in suspicious:
#         if word in url.lower():
#             return "Suspicious URL"
        
#     return "Safe URL"

# url = input("Enter URL: ")
# print(check_url(url))


def detect_sql_injection(input_text):
    patterns = [" ", "--", "OR 1=1", "DROP", "SELECT"]

    for p in patterns:
        if p.lower() in input_text.lower():
            return "Possible SQL Injectioin"
    
    return "Safe Input"
data = input("Enter input: ")
print(detect_sql_injection(data))