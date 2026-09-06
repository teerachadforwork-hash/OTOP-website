from app.database.database import SessionLocal
from app.models.models import User
from app.routers.auth_router import _close_account

db = SessionLocal()
users = db.query(User).filter(User.email.like("deleted_%")).all()
for user in users:
    print("Found user:", user.email)
    _close_account(db, user)
    try:
        db.commit()
        print("Hard deleted user successfully")
    except Exception as e:
        print("Error:", e)
        db.rollback()
