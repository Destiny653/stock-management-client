
path = '/home/mbahmukong-destiny/Documents/7Academy/inventory/pages/Profile.tsx'
with open(path, 'r') as f:
    content = f.read()
content = content.replace('activity.reference ||', 'activity.reference_id ||')
with open(path, 'w') as f:
    f.write(content)
