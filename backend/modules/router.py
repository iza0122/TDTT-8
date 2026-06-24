from fastapi import APIRouter
from backend.modules.identity.router import router as identity_router
from backend.modules.merchant.router import router as merchant_router
from backend.modules.content.router import router as content_router
from backend.modules.search_interact.router import router as search_interact_router
from backend.modules.admin.router import router as admin_router # Add this line

api_router = APIRouter()

# Đăng ký các router con vào Router tổng với prefix và tag tương ứng
api_router.include_router(identity_router, prefix="/auth", tags=["Auth & Identity"])
api_router.include_router(merchant_router, prefix="/merchant", tags=["Merchant & Menu"])
api_router.include_router(content_router, prefix="/content", tags=["Content & Feed"])
api_router.include_router(search_interact_router, prefix="/interact", tags=["Search & Interaction"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Panel"]) # Add this line
