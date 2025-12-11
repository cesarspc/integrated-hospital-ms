from app.database import get_db
from app.models import Departamento, Sede

def check_db():
    print("Checking Node 1")
    try:
        db = next(get_db(1))
        sedes = db.query(Sede).all()
        print("Sedes:", [(s.id_sede, s.nombre_sede) for s in sedes])
        
        depts = db.query(Departamento).all()
        print("Departments:", [(d.id_dept, d.nom_dept, d.id_sede) for d in depts])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_db()
