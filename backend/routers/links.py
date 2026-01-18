from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Link as LinkModel
from schemas import Link, LinkCreate

router = APIRouter(prefix="/api/links", tags=["links"])


@router.get("", response_model=List[Link])
def get_all_links(db: Session = Depends(get_db)):
    """Get all links."""
    return db.query(LinkModel).all()


@router.post("", response_model=Link)
def create_link(link: LinkCreate, db: Session = Depends(get_db)):
    """Create a new link."""
    db_link = LinkModel(
        source=link.source,
        target=link.target,
        type=link.type or 0,
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link


@router.delete("/{link_id}")
def delete_link(link_id: int, db: Session = Depends(get_db)):
    """Delete a link."""
    db_link = db.query(LinkModel).filter(LinkModel.id == link_id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(db_link)
    db.commit()
    return {"message": "Link deleted"}
