import os
import re

files_to_fix = [
    "views/PurchaseOrderDetail.tsx",
    "views/VendorPayments.tsx",
    "views/Alerts.tsx",
    "views/Orders.tsx",
    "views/OrganizationMembers.tsx",
    "views/Reports.tsx",
    "views/Profile.tsx",
    "views/OwnerDashboard.tsx",
    "views/VendorManagement.tsx",
    "views/PurchaseOrders.tsx",
    "views/Settings.tsx",
    "views/OwnerReports.tsx",
    "views/CreatePurchaseOrder.tsx",
    "views/ProductDetail.tsx",
    "views/StoreLocations.tsx",
    "views/Organizations.tsx",
]

base_dir = "/home/mbahmukong-destiny/Documents/7Academy/Inventory/stock-management-client/"

def pattern_replacer(match):
    num = match.group(1)
    if num:
        return f"flex flex-col gap-{num}"
    return "flex flex-col gap-0" # fallback if just space-y

for file_rel in files_to_fix:
    path = os.path.join(base_dir, file_rel)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        
        # Replace space-y-[num] with flex flex-col gap-[num]
        new_content = re.sub(r'space-y-([a-zA-Z0-9.\-]+)', pattern_replacer, content)
        
        # Also fix any rogue space-y
        new_content = re.sub(r'\bspace-y\b(?!-)', 'flex flex-col', new_content)
        
        if new_content != content:
            with open(path, 'w') as f:
                f.write(new_content)
            print(f"Updated {file_rel}")
    else:
        print(f"File not found: {file_rel}")

