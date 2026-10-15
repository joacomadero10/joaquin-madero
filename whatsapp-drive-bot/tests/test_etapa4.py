from datetime import date

import pytest

from bot import main
from bot.google_drive import Documento
from bot.interprete import Decision
from tests.test_etapa2 import AUTORIZADO, PlanillaFalsa, _texto

HOY = date(2026, 10, 15)
SEGURO_VIEJO = Documento("viejo", "LVCCO - Seguro.pdf", "application/pdf", "LVCCO", "Avión")


class DriveGuardador:
    """Drive en memoria con lo necesario para guardar y archivar."""

    def __init__(self):
        self.docs = {SEGURO_VIEJO.id: SEGURO_VIEJO}
        self.archivados = {}
        self.subidos = []

    def listar_documentos(self):
        return [Documento(d.id, d.nombre, d.mime, d.titular, d.tipo) for d in self.docs.values()]

    def pilotos(self):
        return ["Juan Perez"]

    def carpeta_de(self, titular):
        t = titular.replace("-", "").replace(" ", "").upper()
        if t == "LVCCO":
            return "carpeta-cco", "LVCCO", "Avión"
        if t == "JUANPEREZ":
            return "carpeta-juan", "Juan Perez", "Piloto"
        return None

    def buscar_en_carpeta(self, nombre, carpeta_id):
        return [d.id for d in self.docs.values() if d.nombre == nombre]

    def subir(self, contenido, nombre, mime, carpeta_id):
        nuevo = f"nuevo{len(self.subidos)}"
        self.subidos.append((nombre, mime, carpeta_id, contenido))
        titular = "LVCCO" if carpeta_id == "carpeta-cco" else "Juan Perez"
        self.docs[nuevo] = Documento(nuevo, nombre, mime, titular, "Avión")
        return nuevo

    def archivar(self, archivo_id, titular, nuevo_nombre):
        self.archivados[archivo_id] = (titular, nuevo_nombre)
        del self.docs[archivo_id]


@pytest.fixture
def entorno(monkeypatch):
    salida = {"textos": []}
    monkeypatch.setattr(main.whatsapp, "enviar_texto", lambda d, t: salida["textos"].append(t))
    monkeypatch.setattr(main.whatsapp, "descargar_media", lambda mid: (b"PDF!", "application/pdf"))
    drive = DriveGuardador()
    planilla = PlanillaFalsa()
    planilla.actualizar(drive.listar_documentos())
    planilla.filas[0].vencimiento = "20/10/2026"
    monkeypatch.setattr(main, "drive", drive)
    monkeypatch.setattr(main, "planilla", planilla)
    monkeypatch.setattr(main, "hoy", lambda: HOY)
    main._pendientes.clear()
    salida.update(drive=drive, planilla=planilla)
    return salida


def _pdf(caption=""):
    return {"type": "document", "id": "m1", "document": {
        "id": "media-1", "mime_type": "application/pdf", "filename": "poliza 2027.pdf", "caption": caption}}


def _renovacion(*a):
    return Decision("guardar_documento", "", titular="LV-CCO", nombre_documento="Seguro",
                    reemplaza=SEGURO_VIEJO, fecha=date(2027, 10, 15))


def test_renovar_con_texto_en_el_archivo(entorno, monkeypatch):
    vistos = {}

    def interpretar(texto, docs, pilotos, dia, archivo=""):
        vistos["texto"], vistos["archivo"] = texto, archivo
        return _renovacion()
    monkeypatch.setattr(main.interprete, "interpretar", interpretar)

    main.atender(AUTORIZADO, _pdf("este es el nuevo seguro del CCO, vence el 15/10/2027"))

    assert "poliza 2027.pdf" in vistos["archivo"]
    drive = entorno["drive"]
    assert drive.subidos[0][:3] == ("LVCCO - Seguro.pdf", "application/pdf", "carpeta-cco")
    assert drive.archivados["viejo"] == ("LVCCO", "LVCCO - Seguro (venció 20-10-2026).pdf")
    filas = {f.archivo_id: f for f in entorno["planilla"].filas}
    assert "viejo" not in filas
    assert filas["nuevo0"].vencimiento == "15/10/2027"
    respuesta = entorno["textos"][-1]
    assert "Listo" in respuesta and "15/10/2027" in respuesta and "Históricos/LVCCO" in respuesta
    assert main._pendientes == {}


def test_archivo_sin_texto_pregunta_y_despues_guarda(entorno, monkeypatch):
    llamado = []
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: llamado.append(a) or _renovacion())

    main.atender(AUTORIZADO, _pdf())
    assert entorno["textos"] == [main.PEDIR_DATOS_ARCHIVO]
    assert llamado == []  # todavía no se consultó a Claude

    main.atender(AUTORIZADO, _texto("es el seguro nuevo del cco, vence 15/10/2027"))
    assert llamado[0][4]  # Claude recibió la descripción del archivo
    assert entorno["drive"].subidos and "Listo" in entorno["textos"][-1]


def test_documento_nuevo_sin_fecha_avisa_que_falta(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision(
        "guardar_documento", "", titular="Juan Perez", nombre_documento="Pasaporte"))
    foto = {"type": "image", "id": "m2", "image": {"id": "media-2", "mime_type": "image/jpeg",
                                                   "caption": "pasaporte de juan"}}
    main.atender(AUTORIZADO, foto)
    assert entorno["drive"].subidos[0][0] == "Juan Perez - Pasaporte.jpg"
    assert entorno["drive"].archivados == {}
    assert "No me dijiste cuándo vence" in entorno["textos"][-1]


def test_titular_inexistente_no_sube_nada(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision(
        "guardar_documento", "", titular="LVZZZ", nombre_documento="Seguro"))
    main.atender(AUTORIZADO, _pdf("seguro del zzz"))
    assert entorno["drive"].subidos == []
    assert "No encontré la carpeta" in entorno["textos"][-1]


def test_archivo_pendiente_vence_a_la_hora(entorno, monkeypatch):
    vistos = []
    monkeypatch.setattr(main.interprete, "interpretar",
                        lambda *a: vistos.append(a[4]) or Decision("responder", "hola"))
    main.atender(AUTORIZADO, _pdf())
    main._pendientes[AUTORIZADO].recibido -= main.VIDA_PENDIENTE + 1
    main.atender(AUTORIZADO, _texto("hola"))
    assert vistos == [""]


def test_nombre_archivado_sin_fecha():
    doc = Documento("x", "LVCCO - Manual", "application/pdf", "LVCCO", "Avión")
    assert main._nombre_archivado(doc).startswith("LVCCO - Manual (archivado ")


def test_guardar_sin_archivo_pide_el_archivo(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", _renovacion)
    main.atender(AUTORIZADO, _texto("te mando el seguro"))
    assert "Mandame primero el archivo" in entorno["textos"][-1]
    assert entorno["drive"].subidos == []


def test_respuesta_vacia_no_manda_mensaje_vacio(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision("responder", ""))
    main.atender(AUTORIZADO, _texto("???"))
    assert entorno["textos"] == [main.NO_ENTENDI]
