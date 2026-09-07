from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database.database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/chat", tags=["chat"])

# --- Group Chat ---

@router.get("/groups", response_model=List[schemas.GroupChatOut])
def get_user_groups(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    member_groups = db.query(models.GroupChatMember).filter(models.GroupChatMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in member_groups]
    groups = db.query(models.GroupChat).filter(models.GroupChat.id.in_(group_ids)).all()
    return groups

@router.post("/groups", response_model=schemas.GroupChatOut, status_code=status.HTTP_201_CREATED)
def create_group(payload: schemas.GroupChatCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_group = models.GroupChat(name=payload.name, owner_id=current_user.id)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Add owner as a member
    member = models.GroupChatMember(group_id=new_group.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    
    return new_group

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    group = db.query(models.GroupChat).filter(models.GroupChat.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id and auth.user_role(current_user) != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="Not authorized to delete this group")
        
    db.delete(group)
    db.commit()

@router.put("/groups/{group_id}", response_model=schemas.GroupChatOut)
def update_group(group_id: int, payload: schemas.GroupChatUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    group = db.query(models.GroupChat).filter(models.GroupChat.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can edit group name")
        
    group.name = payload.name
    db.commit()
    db.refresh(group)
    return group

@router.get("/groups/{group_id}/members", response_model=List[schemas.GroupChatMemberOut])
def get_group_members(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_member = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id, models.GroupChatMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    members = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id).all()
    group = db.query(models.GroupChat).filter(models.GroupChat.id == group_id).first()
    
    result = []
    for m in members:
        user = m.user
        role = "owner" if user.id == group.owner_id else "member"
        result.append(schemas.GroupChatMemberOut(
            user_id=user.id,
            user_name=user.full_name,
            user_avatar=user.avatar_url,
            role=role,
            joined_at=m.joined_at
        ))
    return result

@router.post("/groups/{group_id}/members", response_model=schemas.GroupChatMemberOut)
def add_group_member(group_id: int, payload: schemas.GroupChatMemberAdd, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    group = db.query(models.GroupChat).filter(models.GroupChat.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can add members")
        
    user_to_add = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    existing_member = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id, models.GroupChatMember.user_id == user_to_add.id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")
        
    new_member = models.GroupChatMember(group_id=group_id, user_id=user_to_add.id)
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return schemas.GroupChatMemberOut(
        user_id=user_to_add.id,
        user_name=user_to_add.full_name,
        user_avatar=user_to_add.avatar_url,
        role="member",
        joined_at=new_member.joined_at
    )

@router.delete("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_group_member(group_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    group = db.query(models.GroupChat).filter(models.GroupChat.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Owner cannot leave, they must delete the group
    if user_id == group.owner_id and current_user.id == user_id:
        raise HTTPException(status_code=400, detail="เจ้าของกลุ่มไม่สามารถออกจากกลุ่มได้ กรุณากดลบกลุ่มแทน")
        
    # Only owner can kick, or user can leave themselves
    if current_user.id != group.owner_id and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this member")
        
    member = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id, models.GroupChatMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(member)
    db.commit()

@router.get("/groups/{group_id}/messages", response_model=List[schemas.GroupChatMessageOut])
def get_group_messages(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_member = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id, models.GroupChatMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    messages = db.query(models.GroupChatMessage).filter(models.GroupChatMessage.group_id == group_id).order_by(models.GroupChatMessage.created_at.asc()).all()
    result = []
    for msg in messages:
        sender = msg.sender
        out = schemas.GroupChatMessageOut(
            id=msg.id,
            group_id=msg.group_id,
            sender_id=msg.sender_id,
            content=msg.content,
            image_url=msg.image_url,
            created_at=msg.created_at,
            sender_name=sender.full_name if sender else None,
            sender_avatar=sender.avatar_url if sender else None,
            sender_role=sender.role if sender else None
        )
        result.append(out)
    return result

@router.post("/groups/{group_id}/messages", response_model=schemas.GroupChatMessageOut)
def send_group_message(group_id: int, payload: schemas.GroupChatMessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_member = db.query(models.GroupChatMember).filter(models.GroupChatMember.group_id == group_id, models.GroupChatMember.user_id == current_user.id).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    msg = models.GroupChatMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=payload.content,
        image_url=payload.image_url
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    return schemas.GroupChatMessageOut(
        id=msg.id,
        group_id=msg.group_id,
        sender_id=msg.sender_id,
        content=msg.content,
        image_url=msg.image_url,
        created_at=msg.created_at,
        sender_name=current_user.full_name,
        sender_avatar=current_user.avatar_url,
        sender_role=current_user.role
    )

# --- Private Chat ---

@router.get("/private", response_model=List[schemas.PrivateChatRoomOut])
def get_private_rooms(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    rooms = db.query(models.PrivateChatRoom).filter(
        (models.PrivateChatRoom.user1_id == current_user.id) | 
        (models.PrivateChatRoom.user2_id == current_user.id)
    ).all()
    
    result = []
    for room in rooms:
        other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
        other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
        result.append(schemas.PrivateChatRoomOut(
            id=room.id,
            user1_id=room.user1_id,
            user2_id=room.user2_id,
            created_at=room.created_at,
            other_user_name=other_user.full_name if other_user else None,
            other_user_avatar=other_user.avatar_url if other_user else None
        ))
    return result

@router.post("/private", response_model=schemas.PrivateChatRoomOut)
def get_or_create_private_room(payload: schemas.PrivateChatRoomCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if payload.user2_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
        
    room = db.query(models.PrivateChatRoom).filter(
        ((models.PrivateChatRoom.user1_id == current_user.id) & (models.PrivateChatRoom.user2_id == payload.user2_id)) |
        ((models.PrivateChatRoom.user1_id == payload.user2_id) & (models.PrivateChatRoom.user2_id == current_user.id))
    ).first()
    
    if not room:
        room = models.PrivateChatRoom(user1_id=current_user.id, user2_id=payload.user2_id)
        db.add(room)
        db.commit()
        db.refresh(room)
        
    other_user = db.query(models.User).filter(models.User.id == payload.user2_id).first()
    return schemas.PrivateChatRoomOut(
        id=room.id,
        user1_id=room.user1_id,
        user2_id=room.user2_id,
        created_at=room.created_at,
        other_user_name=other_user.full_name if other_user else None,
        other_user_avatar=other_user.avatar_url if other_user else None
    )

@router.get("/private/{room_id}/messages", response_model=List[schemas.PrivateChatMessageOut])
def get_private_messages(room_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    room = db.query(models.PrivateChatRoom).filter(models.PrivateChatRoom.id == room_id).first()
    if not room or (room.user1_id != current_user.id and room.user2_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this room")
        
    messages = db.query(models.PrivateChatMessage).filter(models.PrivateChatMessage.room_id == room_id).order_by(models.PrivateChatMessage.created_at.asc()).all()
    result = []
    for msg in messages:
        sender = msg.sender
        result.append(schemas.PrivateChatMessageOut(
            id=msg.id,
            room_id=msg.room_id,
            sender_id=msg.sender_id,
            content=msg.content,
            image_url=msg.image_url,
            created_at=msg.created_at,
            sender_name=sender.full_name if sender else None,
            sender_avatar=sender.avatar_url if sender else None,
            sender_role=sender.role if sender else None
        ))
    return result

@router.post("/private/{room_id}/messages", response_model=schemas.PrivateChatMessageOut)
def send_private_message(room_id: int, payload: schemas.PrivateChatMessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    room = db.query(models.PrivateChatRoom).filter(models.PrivateChatRoom.id == room_id).first()
    if not room or (room.user1_id != current_user.id and room.user2_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to post to this room")
        
    msg = models.PrivateChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=payload.content,
        image_url=payload.image_url
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    return schemas.PrivateChatMessageOut(
        id=msg.id,
        room_id=msg.room_id,
        sender_id=msg.sender_id,
        content=msg.content,
        image_url=msg.image_url,
        created_at=msg.created_at,
        sender_name=current_user.full_name,
        sender_avatar=current_user.avatar_url,
        sender_role=current_user.role
    )
