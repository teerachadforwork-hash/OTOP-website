from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from ..database.database import get_db
from .. import models, schemas, auth
from ..services.image_service import save_image
from ..utils.serializers import serialize_news, serialize_news_comment

router = APIRouter(prefix="/api/news", tags=["news"])


def _dump(model):
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


def _query(db: Session):
    return db.query(models.NewsArticle).options(
        joinedload(models.NewsArticle.author),
        joinedload(models.NewsArticle.comments),
    )


def _visible_article(
    db: Session,
    news_id: int,
    current_user: Optional[models.User] = None,
) -> models.NewsArticle:
    article = _query(db).filter(models.NewsArticle.id == news_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="ไม่พบข่าวนี้")
    can_read_draft = current_user and current_user.role == models.RoleEnum.admin.value
    if not article.is_published and not can_read_draft:
        raise HTTPException(status_code=404, detail="ไม่พบข่าวนี้")
    return article


@router.get("/", response_model=List[schemas.NewsOut])
def list_news(
    include_drafts: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    query = _query(db)
    if not (include_drafts and current_user and current_user.role == models.RoleEnum.admin.value):
        query = query.filter(models.NewsArticle.is_published.is_(True))
    articles = query.order_by(models.NewsArticle.created_at.desc()).all()
    return [serialize_news(a) for a in articles]


@router.get("/{news_id}", response_model=schemas.NewsOut)
def get_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    article = _visible_article(db, news_id, current_user)
    return serialize_news(article)


@router.get("/{news_id}/comments", response_model=List[schemas.NewsCommentOut])
def list_news_comments(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    _visible_article(db, news_id, current_user)
    comments = (
        db.query(models.NewsComment)
        .options(joinedload(models.NewsComment.user))
        .filter(models.NewsComment.news_id == news_id)
        .order_by(models.NewsComment.created_at.asc(), models.NewsComment.id.asc())
        .all()
    )
    return [serialize_news_comment(comment) for comment in comments]


@router.post("/{news_id}/comments", response_model=schemas.NewsCommentOut, status_code=status.HTTP_201_CREATED)
def create_news_comment(
    news_id: int,
    payload: schemas.NewsCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    article = _visible_article(db, news_id, current_user)
    if not article.is_published and current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ยังไม่สามารถแสดงความคิดเห็นในข่าวฉบับร่างได้")
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="กรุณาพิมพ์ข้อความก่อนส่ง")
    comment = models.NewsComment(news_id=news_id, user_id=current_user.id, content=content)
    db.add(comment)
    db.commit()
    comment = (
        db.query(models.NewsComment)
        .options(joinedload(models.NewsComment.user))
        .filter(models.NewsComment.id == comment.id)
        .first()
    )
    return serialize_news_comment(comment)


@router.delete("/{news_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news_comment(
    news_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    comment = (
        db.query(models.NewsComment)
        .filter(models.NewsComment.id == comment_id, models.NewsComment.news_id == news_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="ไม่พบความคิดเห็นนี้")
    if comment.user_id != current_user.id and current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบความคิดเห็นนี้")
    db.delete(comment)
    db.commit()
    return None


@router.post("/", response_model=schemas.NewsOut, status_code=status.HTTP_201_CREATED)
def create_news(
    payload: schemas.NewsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่ลงข่าวได้")
    article = models.NewsArticle(**_dump(payload), author_id=current_user.id)
    db.add(article)
    db.commit()
    db.refresh(article)
    article = _query(db).filter(models.NewsArticle.id == article.id).first()
    return serialize_news(article)


@router.put("/{news_id}", response_model=schemas.NewsOut)
def update_news(
    news_id: int,
    payload: schemas.NewsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่แก้ไขข่าวได้")
    article = db.query(models.NewsArticle).filter(models.NewsArticle.id == news_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="ไม่พบข่าวนี้")
    data = {k: v for k, v in _dump(payload).items() if v is not None}
    for key, value in data.items():
        setattr(article, key, value)
    db.commit()
    article = _query(db).filter(models.NewsArticle.id == news_id).first()
    return serialize_news(article)


@router.post("/{news_id}/cover", response_model=schemas.NewsOut)
def upload_news_cover(
    news_id: int,
    cover: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่อัปโหลดรูปข่าวได้")
    article = db.query(models.NewsArticle).filter(models.NewsArticle.id == news_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="ไม่พบข่าวนี้")
    article.cover_image = save_image(cover, "news")
    db.commit()
    article = _query(db).filter(models.NewsArticle.id == news_id).first()
    return serialize_news(article)


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="เฉพาะผู้ดูแลระบบที่ลบข่าวได้")
    article = db.query(models.NewsArticle).filter(models.NewsArticle.id == news_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="ไม่พบข่าวนี้")
    db.query(models.NewsComment).filter(models.NewsComment.news_id == news_id).delete()
    db.delete(article)
    db.commit()
    return None
