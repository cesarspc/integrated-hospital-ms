from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Connection URLs
def get_url(user, password, host, port, db):
    url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
    if "localhost" not in host and "127.0.0.1" not in host:
        url += "?sslmode=require"
    return url

URL_1 = get_url(settings.NODE_1_USER, settings.NODE_1_PASS, settings.NODE_1_HOST, settings.NODE_1_PORT, settings.NODE_1_DB)
URL_2 = get_url(settings.NODE_2_USER, settings.NODE_2_PASS, settings.NODE_2_HOST, settings.NODE_2_PORT, settings.NODE_2_DB)
URL_3 = get_url(settings.NODE_3_USER, settings.NODE_3_PASS, settings.NODE_3_HOST, settings.NODE_3_PORT, settings.NODE_3_DB)

engines = {
    1: create_engine(URL_1),
    2: create_engine(URL_2),
    3: create_engine(URL_3)
}

SessionLocals = {
    1: sessionmaker(autocommit=False, autoflush=False, bind=engines[1]),
    2: sessionmaker(autocommit=False, autoflush=False, bind=engines[2]),
    3: sessionmaker(autocommit=False, autoflush=False, bind=engines[3])
}

Base = declarative_base()

def get_db(node_id: int):
    if node_id not in SessionLocals:
        raise ValueError("Invalid Node ID")
    db = SessionLocals[node_id]()
    try:
        yield db
    finally:
        db.close()

from contextlib import contextmanager

@contextmanager
def get_db_context(node_id: int):
    if node_id not in SessionLocals:
        raise ValueError("Invalid Node ID")
    db = SessionLocals[node_id]()
    try:
        yield db
    finally:
        db.close()


from contextlib import contextmanager

@contextmanager
def get_db_context(node_id: int):
    if node_id not in SessionLocals:
        raise ValueError("Invalid Node ID")
    db = SessionLocals[node_id]()
    try:
        yield db
    finally:
        db.close()

