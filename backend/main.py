import csv
import io
from datetime import datetime
from typing import List

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from database import init_db, SessionLocal
from models import Task as TaskModel, Link as LinkModel
from routers import tasks, links
from schemas import ImportResponse

app = FastAPI(
    title="Gantt Chart API",
    description="API for Gantt Chart application",
    version="1.0.0",
)

# CORS configuration - allow all origins (個人利用のため無制限)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router)
app.include_router(links.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Gantt Chart API", "version": "1.0.0"}


@app.get("/api/export/csv")
def export_csv():
    """Export tasks and links as CSV files (zipped)."""
    db = SessionLocal()
    try:
        tasks = db.query(TaskModel).order_by(TaskModel.parent, TaskModel.sortorder).all()

        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        headers = [
            "id", "text", "start_date", "end_date", "duration", "progress",
            "parent", "kind_task", "ToDo", "task_schedule", "folder",
            "url_adress", "mail", "memo", "hyperlink", "color", "textColor",
            "owner_id", "sortorder", "edit_date"
        ]
        writer.writerow(headers)

        # Write tasks
        for task in tasks:
            writer.writerow([
                task.id,
                task.text,
                task.start_date,
                task.end_date,
                task.duration,
                task.progress,
                task.parent,
                task.kind_task,
                task.ToDo or "",
                task.task_schedule or "",
                task.folder or "",
                task.url_adress or "",
                task.mail or "",
                task.memo or "",
                task.hyperlink or "",
                task.color or "",
                task.textColor or "",
                task.owner_id,
                task.sortorder,
                task.edit_date or "",
            ])

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"gantt_tasks_{timestamp}.csv"

        # Add BOM for Excel compatibility
        content = "\ufeff" + output.getvalue()

        return StreamingResponse(
            iter([content]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    finally:
        db.close()


@app.post("/api/import/csv", response_model=ImportResponse)
async def import_csv(file: UploadFile = File(...)):
    """Import tasks from CSV file."""
    db = SessionLocal()
    try:
        content = await file.read()
        # Try to decode with BOM
        try:
            text = content.decode("utf-8-sig")
        except:
            text = content.decode("utf-8")

        reader = csv.DictReader(io.StringIO(text))

        imported_count = 0
        skipped_count = 0
        errors: List[str] = []

        # Clear existing data
        db.query(LinkModel).delete()
        db.query(TaskModel).delete()
        db.commit()

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for row_num, row in enumerate(reader, start=2):
            try:
                task = TaskModel(
                    id=int(row.get("id", 0)),
                    text=row.get("text", ""),
                    start_date=row.get("start_date", now),
                    end_date=row.get("end_date", now),
                    duration=int(row.get("duration", 1)) if row.get("duration") else 1,
                    progress=float(row.get("progress", 0)) if row.get("progress") else 0.0,
                    parent=int(row.get("parent", 0)) if row.get("parent") else 0,
                    kind_task=int(row.get("kind_task", 1)) if row.get("kind_task") else 1,
                    owner_id=int(row.get("owner_id", 0)) if row.get("owner_id") else 0,
                    sortorder=int(row.get("sortorder", 0)) if row.get("sortorder") else 0,
                    color=row.get("color") or None,
                    textColor=row.get("textColor") or None,
                    ToDo=row.get("ToDo") or None,
                    task_schedule=row.get("task_schedule") or None,
                    folder=row.get("folder") or None,
                    url_adress=row.get("url_adress") or None,
                    mail=row.get("mail") or None,
                    memo=row.get("memo") or None,
                    hyperlink=row.get("hyperlink") or None,
                    edit_date=row.get("edit_date") or None,
                    created_at=now,
                    updated_at=now,
                )
                db.add(task)
                imported_count += 1
            except Exception as e:
                errors.append(f"行 {row_num}: {str(e)}")
                skipped_count += 1

        db.commit()

        return ImportResponse(
            imported_count=imported_count,
            skipped_count=skipped_count,
            errors=errors,
        )
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
