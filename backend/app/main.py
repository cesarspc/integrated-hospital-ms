from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db, engines, get_db_context
from app.models import Empleado, Persona, Cita, TipoServicio, Estado, Cargo, Sede, Medicamento, Proveedor, Rol, Departamento, ReporteMedico, TipoReporte
from app.schemas import LoginRequest, Token, CitaCreate, CitaResponse, EmpleadoResponse, MedicamentoResponse, ProveedorResponse, RegisterRequest, SedeResponse, CargoResponse, RolResponse, DepartamentoResponse, MedicamentoCreate, ProveedorCreate, ReporteCreate, ReporteResponse
from app.auth import verify_password, create_access_token, get_password_hash
from app.config import settings
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from datetime import date

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        node_id: int = payload.get("node_id")
        # Ensure older tokens without id_emp don't crash but id_emp is needed for new logic
        id_emp: int = payload.get("id_emp") 
        
        if username is None:
            raise credentials_exception
        return {"username": username, "role": role, "node_id": node_id, "id_emp": id_emp}
    except JWTError:
        raise credentials_exception

# Connection strings for dblink
def get_dblink_conn(user, password, host, port, db):
    conn = f"host={host} port={port} dbname={db} user={user} password={password}"
    if "localhost" not in host and "127.0.0.1" not in host:
        conn += " sslmode=require"
    return conn

@app.post("/auth/login", response_model=Token)
def login(request: LoginRequest):
    # Check Admin - Admin has no id_emp usually, or we assign a fake one or handle it.
    if request.username == settings.ADMIN_EMAIL:
        if request.password == settings.ADMIN_PASSWORD:
            return {
                "access_token": create_access_token(
                    data={"sub": request.username, "role": "admin", "node_id": request.node_id, "id_emp": 0}
                ),
                "token_type": "bearer",
                "role": "admin",
                "node_id": request.node_id
            }
        else:
            raise HTTPException(status_code=400, detail="Incorrect password")

    # Check Employee on specific node
    try:
        with get_db_context(request.node_id) as db:
            # Query User
            user_query = db.query(Empleado).join(Persona).filter(Persona.correo == request.username).first()
            
            if not user_query:
                raise HTTPException(status_code=400, detail="User not found")
            
            if not verify_password(request.password, user_query.hash_contra):
                 raise HTTPException(status_code=400, detail="Incorrect password")

            # Include id_emp in token
            return {
                "access_token": create_access_token(
                    data={
                        "sub": request.username, 
                        "role": "employee", 
                        "node_id": request.node_id,
                        "id_emp": user_query.id_emp
                    }
                ),
                "token_type": "bearer",
                "role": "employee",
                "node_id": request.node_id
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not connect to Node {request.node_id}")


@app.get("/appointments", response_model=List[CitaResponse])
def get_appointments(current_user: dict = Depends(get_current_user)):
    node_id = current_user["node_id"]
    with get_db_context(node_id) as db:
        citas = db.query(Cita).all()
        results = []
        for c in citas:
            results.append({
                "id_cita": c.id_cita,
                "fecha": c.fecha,
                "hora": c.hora,
                "nom_servicio": c.servicio.nom_servicio if c.servicio else "Unknown",
                "nom_estado": c.estado.nom_estado if c.estado else "Unknown",
                "medico_nombre": c.medico.persona.nombre_completo if c.medico and c.medico.persona else "Unknown"
            })
        return results

@app.post("/appointments")
def create_appointment(
    cita: CitaCreate,
    current_user: dict = Depends(get_current_user)
):
    node_id = current_user["node_id"]
    with get_db_context(node_id) as db:
        max_id = db.execute(text("SELECT COALESCE(MAX(id_cita), 0) FROM Cita")).scalar()
        new_id = max_id + 1
        
        # Override id_emp with logged user's ID if creating for self, or take input?
        # Requirement: "employed is the current empleado"
        # So we force id_emp from token.
        
        
        assigned_emp = current_user.get("id_emp")
        print(f"DEBUG: current_user={current_user}")
        print(f"DEBUG: initial assigned_emp={assigned_emp}")
        print(f"DEBUG: cita.id_emp={cita.id_emp}")
        # If admin (id_emp=0), maybe allow passing it? But typically admins don't schedule for themselves as doctors.
        # Let's assume user is employee. If admin, we might fallback to cia.id_emp or error.
        if assigned_emp == 0 and cita.id_emp:
            assigned_emp = cita.id_emp
        elif assigned_emp is None:
            # Fallback if somehow not in token and not in body?
            assigned_emp = cita.id_emp
        
        
        print(f"DEBUG: before check assigned_emp={assigned_emp}")
        if assigned_emp is None:
            print("DEBUG: RAISING 400")
            raise HTTPException(status_code=400, detail="Employee ID required (in token or body)")
        
        print(f"DEBUG: Creating Cita with id_emp={assigned_emp}")
        new_cita = Cita(
            id_cita=new_id,
            fecha=cita.fecha,
            hora=cita.hora,
            id_servicio=cita.id_servicio,
            id_estado=1, 
            id_emp=assigned_emp, 
            id_dept=cita.id_dept,
            id_sede=node_id
        )
        db.add(new_cita)
        db.commit()
    return {"message": "Appointment created successfully"}

@app.get("/employees", response_model=List[EmpleadoResponse])
def get_employees(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        try:
            with get_db_context(1) as db:
                conn_str_2 = get_dblink_conn(settings.NODE_2_USER, settings.NODE_2_PASS, settings.NODE_2_HOST, settings.NODE_2_PORT, settings.NODE_2_DB)
                conn_str_3 = get_dblink_conn(settings.NODE_3_USER, settings.NODE_3_PASS, settings.NODE_3_HOST, settings.NODE_3_PORT, settings.NODE_3_DB)

                sql = f"""
                SELECT e.id_emp, p.nombre_completo, c.nombre_cargo, s.nombre_sede
                FROM Empleado e
                JOIN Persona p ON e.documento = p.documento
                JOIN Cargo c ON e.id_cargo = c.id_cargo
                JOIN Sede s ON e.id_sede = s.id_sede
                UNION ALL
                SELECT * FROM dblink('{conn_str_2}', 'SELECT e.id_emp, p.nombre_completo, c.nombre_cargo, s.nombre_sede FROM Empleado e JOIN Persona p ON e.documento = p.documento JOIN Cargo c ON e.id_cargo = c.id_cargo JOIN Sede s ON e.id_sede = s.id_sede') AS t1(id_emp int, nombre_completo varchar, nombre_cargo varchar, nombre_sede varchar)
                UNION ALL
                SELECT * FROM dblink('{conn_str_3}', 'SELECT e.id_emp, p.nombre_completo, c.nombre_cargo, s.nombre_sede FROM Empleado e JOIN Persona p ON e.documento = p.documento JOIN Cargo c ON e.id_cargo = c.id_cargo JOIN Sede s ON e.id_sede = s.id_sede') AS t2(id_emp int, nombre_completo varchar, nombre_cargo varchar, nombre_sede varchar);
                """
                results = db.execute(text(sql)).fetchall()
                return [
                    {"id_emp": r[0], "nombre_completo": r[1], "cargo": r[2], "sede": r[3]}
                    for r in results
                ]
        except Exception:
            # Fallback
            all_emps = []
            for nid in [1, 2, 3]:
                try:
                    with get_db_context(nid) as ldb:
                        q = ldb.query(Empleado, Persona, Cargo, Sede)\
                            .join(Persona, Empleado.documento == Persona.documento)\
                            .join(Cargo, Empleado.id_cargo == Cargo.id_cargo)\
                            .join(Sede, Empleado.id_sede == Sede.id_sede)\
                            .all()
                        for emp, per, car, sed in q:
                            all_emps.append({"id_emp": emp.id_emp, "nombre_completo": per.nombre_completo, "cargo": car.nombre_cargo, "sede": sed.nombre_sede})
                except:
                    pass
            return all_emps
    else:
        with get_db_context(current_user["node_id"]) as db:
            results = db.query(Empleado, Persona, Cargo, Sede)\
                .join(Persona, Empleado.documento == Persona.documento)\
                .join(Cargo, Empleado.id_cargo == Cargo.id_cargo)\
                .join(Sede, Empleado.id_sede == Sede.id_sede)\
                .all()
            return [{"id_emp": e.id_emp, "nombre_completo": p.nombre_completo, "cargo": c.nombre_cargo, "sede": s.nombre_sede} for e, p, c, s in results]

@app.get("/medicamentos", response_model=List[MedicamentoResponse])
def get_medicamentos(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        try:
             with get_db_context(1) as db:
                conn_str_2 = get_dblink_conn(settings.NODE_2_USER, settings.NODE_2_PASS, settings.NODE_2_HOST, settings.NODE_2_PORT, settings.NODE_2_DB)
                conn_str_3 = get_dblink_conn(settings.NODE_3_USER, settings.NODE_3_PASS, settings.NODE_3_HOST, settings.NODE_3_PORT, settings.NODE_3_DB)
                sql = f"""
                SELECT * FROM Medicamento
                UNION ALL
                SELECT * FROM dblink('{conn_str_2}', 'SELECT cod_med, nom_med, descripcion, stock, unidad FROM Medicamento') AS t1(cod_med int, nom_med varchar, descripcion varchar, stock int, unidad varchar)
                UNION ALL
                SELECT * FROM dblink('{conn_str_3}', 'SELECT cod_med, nom_med, descripcion, stock, unidad FROM Medicamento') AS t2(cod_med int, nom_med varchar, descripcion varchar, stock int, unidad varchar);
                """
                results = db.execute(text(sql)).fetchall()
                return [{"cod_med": r.cod_med, "nom_med": r.nom_med, "descripcion": r.descripcion, "stock": r.stock, "unidad": r.unidad} for r in results]
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"dblink view failed: {str(e)}")
    else:
        with get_db_context(current_user["node_id"]) as db:
            return db.query(Medicamento).all()

@app.get("/proveedores", response_model=List[ProveedorResponse])
def get_proveedores(current_user: dict = Depends(get_current_user)):
     if current_user["role"] == "admin":
        try:
            with get_db_context(1) as db:
                conn_str_2 = get_dblink_conn(settings.NODE_2_USER, settings.NODE_2_PASS, settings.NODE_2_HOST, settings.NODE_2_PORT, settings.NODE_2_DB)
                conn_str_3 = get_dblink_conn(settings.NODE_3_USER, settings.NODE_3_PASS, settings.NODE_3_HOST, settings.NODE_3_PORT, settings.NODE_3_DB)
                sql = f"""
                SELECT * FROM Proveedor
                UNION ALL
                SELECT * FROM dblink('{conn_str_2}', 'SELECT * FROM Proveedor') AS t1(cod_prov int, nombre_prov varchar)
                UNION ALL
                SELECT * FROM dblink('{conn_str_3}', 'SELECT * FROM Proveedor') AS t2(cod_prov int, nombre_prov varchar)
                """
                results = db.execute(text(sql)).fetchall()
                return [{"cod_prov": r.cod_prov, "nombre_prov": r.nombre_prov} for r in results]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"dblink query failed: {str(e)}")
     else:
        with get_db_context(current_user["node_id"]) as db:
            return db.query(Proveedor).all()

@app.post("/medicamentos")
def create_medicamento(med: MedicamentoCreate, current_user: dict = Depends(get_current_user)):
    with get_db_context(current_user["node_id"]) as db:
        max_id = db.execute(text("SELECT COALESCE(MAX(cod_med), 0) FROM Medicamento")).scalar()
        new_id = max_id + 1
        new_med = Medicamento(cod_med=new_id, nom_med=med.nom_med, descripcion=med.descripcion, stock=med.stock, unidad=med.unidad)
        db.add(new_med)
        db.commit()
    return {"message": "Medicamento created", "id": new_id}

@app.post("/proveedores")
def create_proveedor(prov: ProveedorCreate, current_user: dict = Depends(get_current_user)):
    with get_db_context(current_user["node_id"]) as db:
        max_id = db.execute(text("SELECT COALESCE(MAX(cod_prov), 0) FROM Proveedor")).scalar()
        new_id = max_id + 1
        new_prov = Proveedor(cod_prov=new_id, nombre_prov=prov.nombre_prov)
        db.add(new_prov)
        db.commit()
    return {"message": "Proveedor created", "id": new_id}

@app.get("/reports", response_model=List[ReporteResponse])
def get_reports(current_user: dict = Depends(get_current_user)):
    with get_db_context(current_user["node_id"]) as db:
        reports = db.query(ReporteMedico).all()
        results = []
        for r in reports:
            results.append({
                "id_reporte": r.id_reporte,
                "fecha_generacion": r.fecha_generacion,
                "resumen": r.resumen,
                "nom_tipo_reporte": r.tipo_reporte.nombre_tipo_reporte if r.tipo_reporte else "Unknown"
            })
        return results

@app.post("/reports")
def create_report(rep: ReporteCreate, current_user: dict = Depends(get_current_user)):
    with get_db_context(current_user["node_id"]) as db:
        max_id = db.execute(text("SELECT COALESCE(MAX(id_reporte), 0) FROM ReporteMedico")).scalar()
        new_id = max_id + 1
        new_rep = ReporteMedico(
            id_reporte=new_id, fecha_generacion=date.today(), resumen=rep.resumen, id_tipo_reporte=rep.id_tipo_reporte, id_sede=current_user["node_id"]
        )
        db.add(new_rep)
        db.commit()
    return {"message": "Report created", "id": new_id}

@app.get("/metadata")
def get_metadata(node_id: int):
    try:
        with get_db_context(node_id) as db:
            depts = db.query(Departamento).filter(Departamento.id_sede == node_id).all()
            servs = db.query(TipoServicio).all()
            return {
                "departments": [{"id_dept": d.id_dept, "nom_dept": d.nom_dept} for d in depts],
                "services": [{"id_servicio": s.id_servicio, "nom_servicio": s.nom_servicio} for s in servs]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Node ID")

@app.get("/metadata/full")
def get_full_metadata(node_id: int):
    try:
        with get_db_context(node_id) as db:
            sedes = db.query(Sede).all()
            cargos = db.query(Cargo).all()
            roles = db.query(Rol).all()
            depts = db.query(Departamento).filter(Departamento.id_sede == node_id).all()
            return {
                "sedes": [{"id_sede": s.id_sede, "nombre_sede": s.nombre_sede} for s in sedes],
                "cargos": [{"id_cargo": c.id_cargo, "nombre_cargo": c.nombre_cargo} for c in cargos],
                "roles": [{"id_rol": r.id_rol, "nombre_rol": r.nombre_rol} for r in roles],
                "departments": [{"id_dept": d.id_dept, "nom_dept": d.nom_dept} for d in depts]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error fetching metadata")

@app.post("/auth/register")
def register(request: RegisterRequest):
    target_node = request.id_sede
    try:
        with get_db_context(target_node) as db:
            existing_persona = db.query(Persona).filter((Persona.documento == request.documento) | (Persona.correo == request.correo)).first()
            if existing_persona:
                raise HTTPException(status_code=400, detail="Document or Email already exists")
            new_persona = Persona(
                documento=request.documento, nombre_completo=request.nombre_completo, telefono=request.telefono, correo=request.correo,
                id_genero=request.id_genero, id_tipo_doc=request.id_tipo_doc, id_sede_origen=request.id_sede_origen
            )
            db.add(new_persona)
            db.commit() 
            
            hashed_pw = get_password_hash(request.password)
            max_id = db.execute(text("SELECT COALESCE(MAX(id_emp), 0) FROM Empleado")).scalar()
            new_emp_id = max_id + 1
            new_emp = Empleado(
                id_emp=new_emp_id, hash_contra=hashed_pw, documento=request.documento, id_cargo=request.id_cargo, id_rol=request.id_rol,
                id_dept=request.id_dept, id_sede=request.id_sede
            )
            db.add(new_emp)
            db.commit()
            return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


