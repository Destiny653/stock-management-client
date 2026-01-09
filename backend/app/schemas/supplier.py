"""Supplier schemas"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.supplier import PaymentTerms, SupplierStatus


class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    location_id: Optional[str] = None
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    lead_time_days: Optional[int] = None
    rating: Optional[float] = None
    status: SupplierStatus = SupplierStatus.ACTIVE
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    organization_id: str


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location_id: Optional[str] = None
    payment_terms: Optional[PaymentTerms] = None
    lead_time_days: Optional[int] = None
    rating: Optional[float] = None
    status: Optional[SupplierStatus] = None
    notes: Optional[str] = None


from beanie import PydanticObjectId

class SupplierResponse(SupplierBase):
    id: PydanticObjectId
    organization_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
