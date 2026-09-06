import sqlite3

conn = sqlite3.connect('otop.db')
cursor = conn.cursor()
cursor.execute("SELECT id, email, role, is_active FROM users")
print(cursor.fetchall())
