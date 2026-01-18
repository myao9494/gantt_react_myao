from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Task as TaskModel, Link as LinkModel
from schemas import Task, TaskCreate, TaskUpdate, GanttData, DeleteResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def calculate_duration(start_date: str, end_date: str) -> int:
    """Calculate duration in days between two dates."""
    try:
        start = datetime.strptime(start_date.split(" ")[0], "%Y-%m-%d")
        end = datetime.strptime(end_date.split(" ")[0], "%Y-%m-%d")
        return max(1, (end - start).days)
    except (ValueError, AttributeError, IndexError):
        return 1


@router.get("", response_model=GanttData)
def get_all_tasks(db: Session = Depends(get_db)):
    """Get all tasks and links."""
    tasks = db.query(TaskModel).order_by(TaskModel.parent, TaskModel.sortorder).all()
    links = db.query(LinkModel).all()
    return GanttData(tasks=tasks, links=links)


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID."""
    task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    duration = task.duration or calculate_duration(task.start_date, task.end_date)

    # Get max sortorder for the parent
    max_sortorder = db.query(TaskModel).filter(
        TaskModel.parent == (task.parent or 0)
    ).count()

    db_task = TaskModel(
        text=task.text,
        start_date=task.start_date,
        end_date=task.end_date,
        duration=duration,
        progress=task.progress or 0.0,
        parent=task.parent or 0,
        kind_task=task.kind_task or 1,
        owner_id=task.owner_id or 0,
        sortorder=task.sortorder if task.sortorder else max_sortorder,
        color=task.color,
        textColor=task.textColor,
        ToDo=task.ToDo,
        task_schedule=task.task_schedule,
        folder=task.folder,
        url_adress=task.url_adress,
        mail=task.mail,
        memo=task.memo,
        hyperlink=task.hyperlink,
        edit_date=task.edit_date,
        created_at=now,
        updated_at=now,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}", response_model=Task)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task."""
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task.model_dump(exclude_unset=True)

    # Recalculate duration if dates changed
    if "start_date" in update_data or "end_date" in update_data:
        start = update_data.get("start_date", db_task.start_date)
        end = update_data.get("end_date", db_task.end_date)
        update_data["duration"] = calculate_duration(start, end)

    update_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Add to edit_date history
    today = datetime.now().strftime("%Y-%m-%d")
    if db_task.edit_date:
        if today not in db_task.edit_date:
            update_data["edit_date"] = f"{db_task.edit_date},{today}"
    else:
        update_data["edit_date"] = today

    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}", response_model=DeleteResponse)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task and all its children."""
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Find all children recursively
    deleted_children = []

    def find_children(parent_id: int):
        children = db.query(TaskModel).filter(TaskModel.parent == parent_id).all()
        for child in children:
            deleted_children.append(child.id)
            find_children(child.id)

    find_children(task_id)

    # Delete all children
    for child_id in deleted_children:
        db.query(TaskModel).filter(TaskModel.id == child_id).delete()
        # Delete links for this task
        db.query(LinkModel).filter(
            (LinkModel.source == child_id) | (LinkModel.target == child_id)
        ).delete()

    # Delete the task itself
    db.delete(db_task)

    # Delete links for this task
    db.query(LinkModel).filter(
        (LinkModel.source == task_id) | (LinkModel.target == task_id)
    ).delete()

    db.commit()

    return DeleteResponse(deleted_id=task_id, deleted_children=deleted_children)


@router.post("/{task_id}/clone", response_model=Task)
def clone_task(task_id: int, db: Session = Depends(get_db)):
    """Clone a task."""
    db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_task = TaskModel(
        text=f"{db_task.text} (コピー)",
        start_date=db_task.start_date,
        end_date=db_task.end_date,
        duration=db_task.duration,
        progress=0.0,  # Reset progress
        parent=db_task.parent,
        kind_task=db_task.kind_task,
        owner_id=db_task.owner_id,
        sortorder=db_task.sortorder + 1,
        color=db_task.color,
        textColor=db_task.textColor,
        ToDo=db_task.ToDo,
        task_schedule=db_task.task_schedule,
        folder=db_task.folder,
        url_adress=db_task.url_adress,
        mail=db_task.mail,
        memo=db_task.memo,
        hyperlink=db_task.hyperlink,
        created_at=now,
        updated_at=now,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.post("/expand-all")
def expand_all():
    """Expand all tasks (handled on frontend)."""
    return {"message": "Expand all tasks"}


@router.post("/collapse-all")
def collapse_all():
    """Collapse all tasks (handled on frontend)."""
    return {"message": "Collapse all tasks"}
