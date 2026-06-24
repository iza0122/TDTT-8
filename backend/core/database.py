import math
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings

# Config database URL, fallback to sqlite for local testing
DATABASE_URL = settings.DATABASE_URL

# SQLite needs some special configurations
engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False,
        "timeout": 30  # Tăng thời gian chờ khoá để tránh lỗi 'database is locked' khi có nhiều luồng
    }
    engine_args["connect_args"] = connect_args
else:
    # Tối ưu cấu hình Connection Pool cho PostgreSQL khi chạy trên Vercel/Production
    engine_args["pool_size"] = 20
    engine_args["max_overflow"] = 10
    engine_args["pool_recycle"] = 3600
    engine_args["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Test connection and notify successful connection
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    db_type = DATABASE_URL.split(":")[0].upper()
    db_name = DATABASE_URL.split("/")[-1].split("?")[0]
    print(f"[DATABASE] Kết nối thành công tới Database ({db_type}): '{db_name}' ✅")
except Exception as e:
    print(f"[DATABASE] ❌ Lỗi kết nối tới Database: {e}")

# Define SQLite math functions mapping so the Haversine SQL formula runs flawlessly on both SQLite and Postgres
def sqlite_radians(x):
    return math.radians(x) if x is not None else None

def sqlite_cos(x):
    return math.cos(x) if x is not None else None

def sqlite_sin(x):
    return math.sin(x) if x is not None else None

def sqlite_acos(x):
    if x is None:
        return None
    try:
        return math.acos(x)
    except ValueError:
        # Prevent math domain error for values slightly outside [-1.0, 1.0] due to float precision
        if x > 1.0:
            return 0.0
        if x < -1.0:
            return math.pi
        return 0.0

@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    # Register functions only if the underlying connection supports create_function (SQLite)
    if hasattr(dbapi_connection, "create_function"):
        dbapi_connection.create_function("radians", 1, sqlite_radians)
        dbapi_connection.create_function("cos", 1, sqlite_cos)
        dbapi_connection.create_function("sin", 1, sqlite_sin)
        dbapi_connection.create_function("acos", 1, sqlite_acos)
        
        # Tối ưu hóa SQLite cho tốc độ ghi cao và tránh file locks (WAL mode)
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000") # Cache 64MB
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.close()
        except Exception as e:
            print(f"[DATABASE] Lỗi khi kích hoạt PRAGMAs tối ưu SQLite: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
