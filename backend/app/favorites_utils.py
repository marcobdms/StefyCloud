from sqlalchemy.orm import Session

from . import models


def remove_favorites_for_item(db: Session, item_type: str, item_id: str) -> None:
    db.query(models.FavoriteItem).filter(
        models.FavoriteItem.item_type == item_type,
        models.FavoriteItem.item_id == item_id,
    ).delete(synchronize_session=False)
