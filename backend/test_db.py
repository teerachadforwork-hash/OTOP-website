from app.database.database import SessionLocal
from app.models.models import User

db = SessionLocal()
try:
    users = db.query(User.id, User.email, User.role, User.is_active).all()
    print(users)
finally:
    db.close()
