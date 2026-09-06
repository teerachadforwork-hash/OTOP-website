import sqlite3

conn = sqlite3.connect('otop.db')
cursor = conn.cursor()
cursor.execute("SELECT id, email, created_at, deleted_at FROM users")
for row in cursor.fetchall():
    print(row)
