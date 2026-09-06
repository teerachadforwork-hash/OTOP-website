from app.database.database import SessionLocal
from app.models.models import User
from sqlalchemy.orm import Session

db = SessionLocal()
user = db.query(User).filter(User.email.like("deleted_%")).first()
if user:
    print("Found user:", user.email)
    db.delete(user)
    try:
        db.commit()
        print("Deleted user successfully")
    except Exception as e:
        print("Error:", e)
else:
    print("No deleted user found")
