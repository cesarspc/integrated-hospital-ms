from app.database import get_db
from app.models import Rol

def check_roles():
    print("Checking Roles in Node 1")
    try:
        db = next(get_db(1))
        roles = db.query(Rol).all()
        print("Roles:", [(r.id_rol, r.nombre_rol) for r in roles])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_roles()
