from pydantic import BaseModel
from typing import Optional, List


# Task schemas
class TaskBase(BaseModel):
    text: str
    start_date: str
    end_date: str
    duration: Optional[int] = None
    progress: Optional[float] = 0.0
    parent: Optional[int] = 0
    kind_task: Optional[int] = 1
    owner_id: Optional[int] = 0
    sortorder: Optional[int] = 0
    color: Optional[str] = None
    textColor: Optional[str] = None
    ToDo: Optional[str] = None
    task_schedule: Optional[str] = None
    folder: Optional[str] = None
    url_adress: Optional[str] = None
    mail: Optional[str] = None
    memo: Optional[str] = None
    hyperlink: Optional[str] = None
    edit_date: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    text: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[int] = None
    progress: Optional[float] = None
    parent: Optional[int] = None
    kind_task: Optional[int] = None
    owner_id: Optional[int] = None
    sortorder: Optional[int] = None
    color: Optional[str] = None
    textColor: Optional[str] = None
    ToDo: Optional[str] = None
    task_schedule: Optional[str] = None
    folder: Optional[str] = None
    url_adress: Optional[str] = None
    mail: Optional[str] = None
    memo: Optional[str] = None
    hyperlink: Optional[str] = None
    edit_date: Optional[str] = None


class Task(TaskBase):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


# Link schemas
class LinkBase(BaseModel):
    source: int
    target: int
    type: Optional[int] = 0


class LinkCreate(LinkBase):
    pass


class Link(LinkBase):
    id: int

    class Config:
        from_attributes = True


# Response schemas
class GanttData(BaseModel):
    tasks: List[Task]
    links: List[Link]


class DeleteResponse(BaseModel):
    deleted_id: int
    deleted_children: List[int]


class ImportResponse(BaseModel):
    imported_count: int
    skipped_count: int
    errors: List[str]
