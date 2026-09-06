from app.database.database import SessionLocal
from app.models.models import User
from app.utils.serializers import serialize_admin_user

db = SessionLocal()
users = db.query(User).order_by(User.id.desc()).all()
try:
    res = [serialize_admin_user(user).model_dump() for user in users]
    print(f"Successfully serialized {len(res)} users")
except Exception as e:
    print("Serialization failed:", e)
