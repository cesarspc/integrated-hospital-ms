from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Sede(Base):
    __tablename__ = "sede"
    id_sede = Column(Integer, primary_key=True, index=True)
    nombre_sede = Column(String, nullable=False)

class Cargo(Base):
    __tablename__ = "cargo"
    id_cargo = Column(Integer, primary_key=True, index=True)
    nombre_cargo = Column(String, nullable=False)

class Rol(Base):
    __tablename__ = "rol"
    id_rol = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String, nullable=False)

class Departamento(Base):
    __tablename__ = "departamento"
    id_dept = Column(Integer, primary_key=True)
    nom_dept = Column(String, nullable=False)
    id_sede = Column(Integer, primary_key=True) 

class Empleado(Base):
    __tablename__ = "empleado"
    id_emp = Column(Integer, primary_key=True, index=True)
    hash_contra = Column(String, nullable=False)
    documento = Column(Integer, ForeignKey("persona.documento"), nullable=False)
    id_cargo = Column(Integer, ForeignKey("cargo.id_cargo"), nullable=False)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    id_dept = Column(Integer, nullable=False)
    id_sede = Column(Integer, ForeignKey("sede.id_sede"), nullable=False)
    
    persona = relationship("Persona", back_populates="empleado")
    cargo_rel = relationship("Cargo")
    rol_rel = relationship("Rol")
    sede_rel = relationship("Sede")

class Persona(Base):
    __tablename__ = "persona"
    documento = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    id_genero = Column(Integer, nullable=False)
    id_tipo_doc = Column(Integer, nullable=False)
    id_sede_origen = Column(Integer, nullable=False)

    empleado = relationship("Empleado", back_populates="persona")
    paciente = relationship("Paciente", back_populates="persona")

class Paciente(Base):
    __tablename__ = "paciente"
    cod_pac = Column(Integer, primary_key=True, index=True)
    direccion = Column(String, nullable=False)
    documento = Column(Integer, ForeignKey("persona.documento"), nullable=False)
    id_sede = Column(Integer, nullable=False)

    persona = relationship("Persona", back_populates="paciente")

class TipoServicio(Base):
    __tablename__ = "tipo_servicio"
    id_servicio = Column(Integer, primary_key=True)
    nom_servicio = Column(String, nullable=False)

class Estado(Base):
    __tablename__ = "estado"
    id_estado = Column(Integer, primary_key=True)
    nom_estado = Column(String, nullable=False)

class Cita(Base):
    __tablename__ = "cita"
    id_cita = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    id_servicio = Column(Integer, ForeignKey("tipo_servicio.id_servicio"), nullable=False)
    id_estado = Column(Integer, ForeignKey("estado.id_estado"), nullable=False)
    id_emp = Column(Integer, ForeignKey("empleado.id_emp"), nullable=False)
    id_dept = Column(Integer, nullable=False)
    id_sede = Column(Integer, nullable=False)

    servicio = relationship("TipoServicio")
    estado = relationship("Estado")
    medico = relationship("Empleado")

class Medicamento(Base):
    __tablename__ = "medicamento"
    cod_med = Column(Integer, primary_key=True)
    nom_med = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    stock = Column(Integer, nullable=False)
    unidad = Column(String, nullable=False)

class Proveedor(Base):
    __tablename__ = "proveedor"
    cod_prov = Column(Integer, primary_key=True)
    nombre_prov = Column(String, nullable=False)

class TipoReporte(Base):
    __tablename__ = "tiporeporte"
    id_tipo_reporte = Column(Integer, primary_key=True)
    nombre_tipo_reporte = Column(String, nullable=False)

class ReporteMedico(Base):
    __tablename__ = "reportemedico"
    id_reporte = Column(Integer, primary_key=True)
    fecha_generacion = Column(Date, nullable=False)
    resumen = Column(String, nullable=False)
    id_tipo_reporte = Column(Integer, ForeignKey("tiporeporte.id_tipo_reporte"), nullable=False)
    id_sede = Column(Integer, ForeignKey("sede.id_sede"), nullable=False)

    tipo_reporte = relationship("TipoReporte")
    sede = relationship("Sede")
