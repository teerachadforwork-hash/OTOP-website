from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.database import get_db
from .. import models, schemas, auth
from ..services.image_service import save_image
from ..utils.serializers import serialize_community

router = APIRouter(prefix="/api/community", tags=["community"])


def _dump(model):
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


def _product_counts(db: Session):
    rows = (
        db.query(models.Product.community_id, func.count(models.Product.id))
        .group_by(models.Product.community_id)
        .all()
    )
    return {community_id: count for community_id, count in rows}


@router.get("/", response_model=List[schemas.CommunityOut])
def read_communities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    communities = db.query(models.Community).offset(skip).limit(limit).all()
    counts = _product_counts(db)
    return [serialize_community(c, counts.get(c.id, 0)) for c in communities]


@router.get("/{community_id}", response_model=schemas.CommunityOut)
def read_community(community_id: int, db: Session = Depends(get_db)):
    community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="ไม่พบชุมชนนี้")
    count = db.query(func.count(models.Product.id)).filter(models.Product.community_id == community_id).scalar() or 0
    return serialize_community(community, count)


@router.post("/", response_model=schemas.CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    community: schemas.CommunityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role not in (models.RoleEnum.seller.value, models.RoleEnum.admin.value):
        raise HTTPException(status_code=403, detail="เฉพาะผู้ขายหรือผู้ดูแลระบบเท่านั้นที่สร้างชุมชนได้")
    payload = _dump(community)
    db_community = models.Community(**payload)
    db.add(db_community)
    db.commit()
    db.refresh(db_community)
    return serialize_community(db_community, 0)


@router.put("/{community_id}", response_model=schemas.CommunityOut)
def update_community(
    community_id: int,
    payload: schemas.CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่แก้ไขชุมชนได้")
    community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="ไม่พบชุมชนนี้")
    data = {k: v for k, v in _dump(payload).items() if v is not None}
    for key, value in data.items():
        setattr(community, key, value)
    db.commit()
    db.refresh(community)
    count = db.query(func.count(models.Product.id)).filter(models.Product.community_id == community_id).scalar() or 0
    return serialize_community(community, count)


@router.post("/{community_id}/banner", response_model=schemas.CommunityOut)
def upload_community_banner(
    community_id: int,
    banner: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่อัปโหลดรูปชุมชนได้")
    community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="ไม่พบชุมชนนี้")
    community.banner_image = save_image(banner, "communities")
    db.commit()
    db.refresh(community)
    count = db.query(func.count(models.Product.id)).filter(models.Product.community_id == community_id).scalar() or 0
    return serialize_community(community, count)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่ลบชุมชนได้")
    community = db.query(models.Community).filter(models.Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="ไม่พบชุมชนนี้")
    product_count = db.query(func.count(models.Product.id)).filter(models.Product.community_id == community_id).scalar() or 0
    if product_count:
        raise HTTPException(status_code=400, detail="ไม่สามารถลบชุมชนที่มีสินค้าอยู่ได้ กรุณาย้ายหรือลบสินค้าก่อน")
    db.delete(community)
    db.commit()
    return None
