from datetime import date, datetime

import pytest

from bot import main
from bot.avisos import Avisador, parametros_plantilla
from bot.google_drive import Documento
from bot.interprete import Decision
from bot.vencimientos import (FALTA_FECHA, NO_VENCE, POR_VENCER, VENCE_HOY, VENCIDO, VIGENTE, ZONA,
                              Fila, calcular_avisos, consultar, fijar_vencimiento, leer_fecha,
                              sincronizar)
from tests.test_etapa2 import AUTORIZADO, CMA, SEGURO, DriveFalso, PlanillaFalsa, _texto

HOY = date(2026, 10, 15)


def fila(venc="", titular="LVCCO", doc="Seguro", aviso_30="", aviso_dia="", fid="id"):
    return Fila("Avión", titular, doc, venc, "link", fid, aviso_30, aviso_dia)


# ---------- fechas y estados ----------

@pytest.mark.parametrize("texto,esperado", [
    ("15/10/2027", date(2027, 10, 15)),
    ("5/3/27", date(2027, 3, 5)),
    ("2027-10-15", date(2027, 10, 15)),
    ("15-10-2027", date(2027, 10, 15)),
    ("31/02/2027", None),
    ("", None),
    ("No vence", None),
])
def test_leer_fecha(texto, esperado):
    assert leer_fecha(texto) == esperado


@pytest.mark.parametrize("venc,estado", [
    ("", FALTA_FECHA),
    ("No vence", NO_VENCE),
    ("permanente", NO_VENCE),
    ("14/10/2026", VENCIDO),
    ("15/10/2026", VENCE_HOY),
    ("14/11/2026", POR_VENCER),   # 30 días
    ("15/11/2026", VIGENTE),      # 31 días
])
def test_estados(venc, estado):
    assert fila(venc).estado(HOY) == estado


# ---------- sincronización con Drive ----------

def test_sincronizar_agrega_conserva_y_quita():
    vieja = fila("15/10/2027", fid="id-seguro", doc="nombre viejo", aviso_30="01/01/2026")
    borrada = fila("01/01/2027", fid="ya-no-esta")
    filas = sincronizar([vieja, borrada], [SEGURO, CMA])
    por_id = {f.archivo_id: f for f in filas}
    assert set(por_id) == {"id-seguro", "id-cma"}
    assert por_id["id-seguro"].vencimiento == "15/10/2027"      # se conserva la fecha
    assert por_id["id-seguro"].aviso_30 == "01/01/2026"         # y la marca de aviso
    assert por_id["id-seguro"].documento == "LVCCO - Seguro"    # el nombre viene de Drive
    assert por_id["id-cma"].vencimiento == ""                   # nuevo: sin fecha
    assert filas[0].tipo == "Avión"                             # aviones primero


def test_fijar_vencimiento_reinicia_avisos():
    f = fijar_vencimiento(fila("15/10/2026", aviso_30="x", aviso_dia="y"), date(2027, 10, 15))
    assert (f.vencimiento, f.aviso_30, f.aviso_dia) == ("15/10/2027", "", "")
    assert fijar_vencimiento(fila(), None).vencimiento == NO_VENCE


# ---------- avisos ----------

def test_aviso_30_dias_una_sola_vez():
    avisos, filas = calcular_avisos([fila("14/11/2026")], HOY)
    assert len(avisos) == 1 and "en 30 días" in avisos[0].texto_estado
    assert filas[0].aviso_30 == "15/10/2026"
    avisos, _ = calcular_avisos(filas, date(2026, 10, 16))
    assert avisos == []


def test_aviso_el_dia_del_vencimiento():
    _, filas = calcular_avisos([fila("14/11/2026")], HOY)
    avisos, filas = calcular_avisos(filas, date(2026, 11, 14))
    assert len(avisos) == 1 and "HOY" in avisos[0].texto_estado
    assert calcular_avisos(filas, date(2026, 11, 15))[0] == []


def test_no_avisa_lejanos_ni_sin_fecha_ni_permanentes():
    filas = [fila("01/01/2028"), fila(""), fila("No vence")]
    assert calcular_avisos(filas, HOY)[0] == []


def test_si_el_bot_estuvo_caido_avisa_igual():
    # Faltan 20 días y nunca se avisó (ej. fecha cargada tarde): avisa.
    avisos, _ = calcular_avisos([fila("04/11/2026")], HOY)
    assert "en 20 días" in avisos[0].texto_estado
    # Venció hace 2 días y nunca se avisó: avisa que está vencido.
    avisos, filas = calcular_avisos([fila("13/10/2026")], HOY)
    assert "VENCIDO" in avisos[0].texto_estado
    assert filas[0].aviso_30 and filas[0].aviso_dia


def test_parametros_plantilla_sin_saltos_de_linea():
    avisos, _ = calcular_avisos([fila("14/11/2026")], HOY)
    assert parametros_plantilla(avisos[0]) == ["Seguro", "LVCCO", "vence el 14/11/2026 (en 30 días)"]
    avisos, _ = calcular_avisos([fila("14/11/2026", doc="LVCCO - Seguro")], HOY)
    assert parametros_plantilla(avisos[0])[0] == "Seguro"


class WhatsAppFalso:
    def __init__(self):
        self.textos, self.plantillas = [], []

    def enviar_texto(self, d, t):
        self.textos.append((d, t))

    def enviar_plantilla(self, d, nombre, idioma, params):
        self.plantillas.append((d, nombre, idioma, params))


def test_avisador_usa_plantilla_y_no_repite(monkeypatch):
    monkeypatch.setattr("bot.avisos.hoy", lambda: HOY)
    planilla = PlanillaFalsa()
    planilla.actualizar([SEGURO])
    planilla.filas = [fijar_vencimiento(planilla.filas[0], date(2026, 11, 1))]
    wa = WhatsAppFalso()
    av = Avisador(planilla, type("D", (), {"listar_documentos": lambda s: [SEGURO]})(), wa,
                  [AUTORIZADO], "aviso_vencimiento", "es_AR")
    assert av.ejecutar() == 1
    assert wa.plantillas[0][:3] == (AUTORIZADO, "aviso_vencimiento", "es_AR")
    assert av.ejecutar() == 0


def test_avisador_sin_plantilla_manda_texto(monkeypatch):
    monkeypatch.setattr("bot.avisos.hoy", lambda: HOY)
    planilla = PlanillaFalsa()
    planilla.actualizar([SEGURO])
    planilla.filas = [fijar_vencimiento(planilla.filas[0], HOY)]
    wa = WhatsAppFalso()
    av = Avisador(planilla, type("D", (), {"listar_documentos": lambda s: [SEGURO]})(), wa,
                  [AUTORIZADO], "", "es_AR")
    av.ejecutar()
    assert "vence HOY" in wa.textos[0][1]


def test_reloj_corre_desde_las_10_una_vez_por_dia():
    av = Avisador(None, None, None, [], "", "es_AR", hora=10)
    assert not av.toca_revisar(datetime(2026, 10, 15, 9, 59, tzinfo=ZONA))
    assert av.toca_revisar(datetime(2026, 10, 15, 10, 0, tzinfo=ZONA))
    av._ultimo_dia = date(2026, 10, 15)
    assert not av.toca_revisar(datetime(2026, 10, 15, 18, 0, tzinfo=ZONA))
    assert av.toca_revisar(datetime(2026, 10, 16, 10, 5, tzinfo=ZONA))


# ---------- consultas ----------

def test_consultar_vencidos_y_rango():
    filas = [fila("10/10/2026", doc="Seguro"), fila("20/10/2026", doc="VTV"),
             fila("01/01/2027", titular="Juan Perez", doc="CMA"), fila("", doc="Manual")]
    assert "Seguro" in consultar(filas, HOY, "vencidos") and "VTV" not in consultar(filas, HOY, "vencidos")
    mes = consultar(filas, HOY, "rango", date(2026, 10, 1), date(2026, 10, 31))
    assert "Seguro" in mes and "VTV" in mes and "CMA" not in mes
    assert "Manual" in consultar(filas, HOY, "falta_fecha")
    assert "CMA" in consultar(filas, HOY, "todos", titular="juan")
    assert "VTV" not in consultar(filas, HOY, "todos", titular="juan")
    assert "No hay ninguno" in consultar([], HOY, "vencidos")


# ---------- flujo completo por WhatsApp ----------

@pytest.fixture
def entorno(monkeypatch):
    salida = {"textos": []}
    monkeypatch.setattr(main.whatsapp, "enviar_texto", lambda d, t: salida["textos"].append(t))
    monkeypatch.setattr(main, "drive", DriveFalso())
    planilla = PlanillaFalsa()
    monkeypatch.setattr(main, "planilla", planilla)
    monkeypatch.setattr(main, "hoy", lambda: HOY)
    salida["planilla"] = planilla
    return salida


def test_whatsapp_fijar_vencimiento(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision(
        "fijar_vencimiento", "", [SEGURO], fecha=date(2027, 10, 15)))
    main.atender(AUTORIZADO, _texto("el seguro del cco vence el 15/10/2027"))
    f = next(f for f in entorno["planilla"].filas if f.archivo_id == SEGURO.id)
    assert f.vencimiento == "15/10/2027"
    assert "Anotado" in entorno["textos"][0] and "15/10/2027" in entorno["textos"][0]


def test_whatsapp_consulta_y_claude_ve_los_vencimientos(entorno, monkeypatch):
    vistos = {}

    def interpretar(texto, documentos, pilotos, dia):
        vistos["docs"] = {d.id: (d.vencimiento, d.estado) for d in documentos}
        return Decision("consultar_vencimientos", "", filtro="falta_fecha")
    monkeypatch.setattr(main.interprete, "interpretar", interpretar)
    main.atender(AUTORIZADO, _texto("a qué le falta la fecha?"))
    assert vistos["docs"][SEGURO.id] == ("", FALTA_FECHA)
    assert "LVCCO - Seguro" in entorno["textos"][0]


def test_whatsapp_pedir_planilla(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision("pedir_planilla", ""))
    main.atender(AUTORIZADO, _texto("pasame la planilla"))
    assert PlanillaFalsa.link in entorno["textos"][0]


def test_tarea_avisos_pide_clave():
    from fastapi.testclient import TestClient
    assert TestClient(main.app).get("/tareas/avisos", params={"clave": "mala"}).status_code == 403
