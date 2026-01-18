from sqlalchemy import Column, Integer, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    text = Column(Text, nullable=False)
    start_date = Column(Text, nullable=False)  # "YYYY-MM-DD HH:mm:ss"
    end_date = Column(Text, nullable=False)
    duration = Column(Integer)
    progress = Column(Float, default=0.0)
    parent = Column(Integer, default=0)  # 0 = top level
    kind_task = Column(Integer, default=1)  # 1: task, 2: project
    owner_id = Column(Integer, default=0)  # 0: 自分, 10: 待, 20: サイン取, 30: 他
    sortorder = Column(Integer, default=0)
    color = Column(Text)
    textColor = Column(Text)
    ToDo = Column(Text)
    task_schedule = Column(Text)
    folder = Column(Text)
    url_adress = Column(Text)
    mail = Column(Text)
    memo = Column(Text)
    hyperlink = Column(Text)
    edit_date = Column(Text)  # Comma-separated edit dates
    created_at = Column(Text)
    updated_at = Column(Text)


class Link(Base):
    __tablename__ = "links"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(Integer, nullable=False)  # Source task ID
    target = Column(Integer, nullable=False)  # Target task ID
    type = Column(Integer, default=0)  # 0: FS, 1: SS, 2: FF, 3: SF
