from app.database.database import SessionLocal
from app.models.models import User

db = SessionLocal()
try:
    users = db.query(User.id, User.email, User.created_at, User.deleted_at).all()
    for row in users:
        print(row)
finally:
    db.close()
