from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    node_id: int

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    node_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    node_id: int # 1, 2, or 3

class CitaCreate(BaseModel):
    fecha: date
    hora: time
    id_servicio: int
    id_emp: Optional[int] = None
    id_dept: int

class CitaResponse(BaseModel):
    id_cita: int
    fecha: date
    hora: time
    nom_servicio: str
    nom_estado: str
    medico_nombre: str
    
    class Config:
        from_attributes = True

class EmpleadoResponse(BaseModel):
    id_emp: int
    nombre_completo: str
    cargo: str
    sede: str
    
    class Config:
        from_attributes = True

class MedicamentoResponse(BaseModel):
    cod_med: int
    nom_med: str
    descripcion: str
    stock: int
    unidad: str

class ProveedorResponse(BaseModel):
    cod_prov: int
    nombre_prov: str

class RegisterRequest(BaseModel):
    # Persona fields
    documento: int
    nombre_completo: str
    telefono: str
    correo: str
    id_genero: int
    id_tipo_doc: int
    id_sede_origen: int # Usually same as the node we are registering on, or home base
    
    # Empleado fields
    id_cargo: int
    id_rol: int
    id_dept: int
    id_sede: int # Work location
    password: str

# Metadata schemas
class SedeResponse(BaseModel):
    id_sede: int
    nombre_sede: str

class CargoResponse(BaseModel):
    id_cargo: int
    nombre_cargo: str

class RolResponse(BaseModel):
    id_rol: int
    nombre_rol: str

class DepartamentoResponse(BaseModel):
    id_dept: int
    nom_dept: str

class DepartamentoResponse(BaseModel):
    id_dept: int
    nom_dept: str

class MedicamentoCreate(BaseModel):
    cod_med: int # Manual ID input or auto-gen? Schema says PRIMARY KEY. Let's ask user to input or auto-calc. 
    # Usually we generate ID. But specific codes might be needed. Let's Assume Auto-Gen for simplicity in logic, but standard input in schema just in case.
    # Actually, for create usually we don't pass ID if auto-generated.
    # Let's just take data.
    nom_med: str
    descripcion: str
    stock: int
    unidad: str

class ProveedorCreate(BaseModel):
    nombre_prov: str

class ReporteCreate(BaseModel):
    resumen: str
    id_tipo_reporte: int

class ReporteResponse(BaseModel):
    id_reporte: int
    fecha_generacion: date
    resumen: str
    nom_tipo_reporte: str
    
    class Config:
        from_attributes = True
