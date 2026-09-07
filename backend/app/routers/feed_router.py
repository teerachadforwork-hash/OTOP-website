from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/feed", tags=["feed"])

@router.get("/posts", response_model=List[schemas.PostOut])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).limit(50).all()
    result = []
    for post in posts:
        author = post.author
        comments_count = db.query(models.PostComment).filter(models.PostComment.post_id == post.id).count()
        result.append(schemas.PostOut(
            id=post.id,
            author_id=post.author_id,
            content=post.content,
            image_url=post.image_url,
            created_at=post.created_at,
            updated_at=post.updated_at,
            author_name=author.full_name if author else None,
            author_avatar=author.avatar_url if author else None,
            author_role=author.role if author else None,
            comments_count=comments_count
        ))
    return result

@router.get("/users/{user_id}/posts", response_model=List[schemas.PostOut])
def get_user_posts(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(models.Post).filter(models.Post.author_id == user_id).order_by(models.Post.created_at.desc()).limit(50).all()
    result = []
    for post in posts:
        author = post.author
        comments_count = db.query(models.PostComment).filter(models.PostComment.post_id == post.id).count()
        result.append(schemas.PostOut(
            id=post.id,
            author_id=post.author_id,
            content=post.content,
            image_url=post.image_url,
            created_at=post.created_at,
            updated_at=post.updated_at,
            author_name=author.full_name if author else None,
            author_avatar=author.avatar_url if author else None,
            author_role=author.role if author else None,
            comments_count=comments_count
        ))
    return result

@router.post("/posts", response_model=schemas.PostOut, status_code=status.HTTP_201_CREATED)
def create_post(payload: schemas.PostCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = models.Post(
        author_id=current_user.id,
        content=payload.content,
        image_url=payload.image_url
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return schemas.PostOut(
        id=post.id,
        author_id=post.author_id,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        author_role=current_user.role,
        comments_count=0
    )

@router.put("/posts/{post_id}", response_model=schemas.PostOut)
def update_post(post_id: int, payload: schemas.PostUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
    if payload.content is not None:
        post.content = payload.content
    if payload.image_url is not None:
        post.image_url = payload.image_url
        
    db.commit()
    db.refresh(post)
    
    comments_count = db.query(models.PostComment).filter(models.PostComment.post_id == post.id).count()
    return schemas.PostOut(
        id=post.id,
        author_id=post.author_id,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        author_role=current_user.role,
        comments_count=comments_count
    )

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id and auth.user_role(current_user) != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    db.delete(post)
    db.commit()

@router.get("/posts/{post_id}/comments", response_model=List[schemas.PostCommentOut])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    # Get top level comments
    comments = db.query(models.PostComment).filter(
        models.PostComment.post_id == post_id,
        models.PostComment.parent_comment_id == None
    ).order_by(models.PostComment.created_at.asc()).all()
    
    result = []
    for comment in comments:
        author = comment.author
        # Fetch replies (1 level deep)
        replies = db.query(models.PostComment).filter(
            models.PostComment.parent_comment_id == comment.id
        ).order_by(models.PostComment.created_at.asc()).all()
        
        reply_list = []
        for r in replies:
            r_auth = r.author
            reply_list.append(schemas.PostCommentOut(
                id=r.id,
                post_id=r.post_id,
                author_id=r.author_id,
                parent_comment_id=r.parent_comment_id,
                content=r.content,
                created_at=r.created_at,
                author_name=r_auth.full_name if r_auth else None,
                author_avatar=r_auth.avatar_url if r_auth else None,
                replies=[]
            ))
            
        result.append(schemas.PostCommentOut(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            parent_comment_id=comment.parent_comment_id,
            content=comment.content,
            created_at=comment.created_at,
            author_name=author.full_name if author else None,
            author_avatar=author.avatar_url if author else None,
            replies=reply_list
        ))
    return result

@router.post("/posts/{post_id}/comments", response_model=schemas.PostCommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(post_id: int, payload: schemas.PostCommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    comment = models.PostComment(
        post_id=post_id,
        author_id=current_user.id,
        content=payload.content,
        parent_comment_id=payload.parent_comment_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return schemas.PostCommentOut(
        id=comment.id,
        post_id=comment.post_id,
        author_id=comment.author_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        author_name=current_user.full_name,
        author_avatar=current_user.avatar_url,
        replies=[]
    )
