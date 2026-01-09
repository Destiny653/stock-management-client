"""Authentication endpoints"""
from datetime import timedelta
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.api import deps
from app.core.privileges import Privilege, ROLE_PERMISSIONS

router = APIRouter()


@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await User.find_one(User.username == form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            str(user.id), expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user_by_username = await User.find_one(User.username == user_in.username)
    if user_by_username:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
        
    hashed_password = security.get_password_hash(user_in.password)
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = hashed_password
    
    # Assign default permissions if none provided
    if not user_data.get("permissions"):
        user_data["permissions"] = ROLE_PERMISSIONS.get(user_in.role.value, [])
    
    # Set default status to active if registering directly
    user_data["status"] = "active"
    
    user = User(**user_data)
    await user.create()
    return user


@router.get("/privileges", response_model=List[str])
async def get_available_privileges() -> Any:
    """
    Get all available privileges in the system.
    """
    return [p.value for p in Privilege]


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_users_me(
    password: str = None,
    full_name: str = None,
    first_name: str = None,
    last_name: str = None,
    phone: str = None,
    avatar: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update current user
    """
    update_data = {}
    if password:
        update_data["hashed_password"] = security.get_password_hash(password)
    if full_name:
        update_data["full_name"] = full_name
    if first_name:
        update_data["first_name"] = first_name
    if last_name:
        update_data["last_name"] = last_name
    if phone:
        update_data["phone"] = phone
    if avatar:
        update_data["avatar"] = avatar
    
    if update_data:
        await current_user.update({"$set": update_data})
        await current_user.save()
    
    return current_user
