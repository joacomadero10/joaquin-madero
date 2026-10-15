"""Prueba la planilla contra una Google Sheets simulada en memoria."""
import threading

from bot import planilla as modulo
from bot.planilla import Planilla
from bot.vencimientos import ENCABEZADOS, fijar_vencimiento
from tests.test_etapa2 import CMA, SEGURO


class _E:
    def __init__(self, v=None):
        self.v = v or {}

    def execute(self):
        return self.v


class ValoresFalsos:
    def __init__(self):
        self.tabla = []
        self.escrituras = 0

    def get(self, spreadsheetId, range, valueRenderOption):
        return _E({"values": [list(map(str, f)) for f in self.tabla[1:]]})

    def clear(self, spreadsheetId, range):
        self.tabla = self.tabla[:1]
        return _E()

    def update(self, spreadsheetId, range, valueInputOption, body):
        self.tabla = body["values"]
        self.escrituras += 1
        return _E()


def _planilla():
    valores = ValoresFalsos()
    p = Planilla.__new__(Planilla)
    p._api = type("S", (), {"spreadsheets": lambda s: type("X", (), {"values": lambda s: valores})()})()
    p._id = "planilla-id"
    p._lock = threading.RLock()
    return p, valores


def test_escribe_solo_si_cambia(monkeypatch):
    p, valores = _planilla()
    filas = p.actualizar([SEGURO, CMA])
    assert valores.tabla[0] == ENCABEZADOS
    assert len(valores.tabla) == 3 and valores.escrituras == 1
    p.actualizar([SEGURO, CMA])
    assert valores.escrituras == 1  # nada cambió: no reescribe

    p.actualizar([SEGURO, CMA], lambda fs: [fijar_vencimiento(f, None) if f.archivo_id == SEGURO.id else f
                                            for f in fs])
    assert valores.escrituras == 2
    fila_seguro = next(f for f in valores.tabla[1:] if f[7] == SEGURO.id)
    assert fila_seguro[3] == "No vence" and fila_seguro[4] == "No vence"


def test_dias_restantes_como_numero_y_estado_se_refresca(monkeypatch):
    from datetime import date
    p, valores = _planilla()
    monkeypatch.setattr(modulo, "hoy", lambda: date(2026, 10, 15))
    p.actualizar([SEGURO], lambda fs: [fijar_vencimiento(fs[0], date(2026, 11, 14))])
    assert valores.tabla[1][5] == 30 and valores.tabla[1][4] == "Por vencer"
    # Al día siguiente, aunque nada cambie en Drive, se actualizan los días.
    monkeypatch.setattr(modulo, "hoy", lambda: date(2026, 10, 16))
    p.actualizar([SEGURO])
    assert valores.tabla[1][5] == 29
