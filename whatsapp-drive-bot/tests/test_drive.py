"""Prueba la lógica de carpetas con un Drive simulado en memoria."""
import re

from bot.google_drive import CARPETA, Drive


class _Ejecutable:
    def __init__(self, valor):
        self._valor = valor

    def execute(self):
        return self._valor


class FilesFalso:
    def __init__(self):
        self.archivos = {}  # id -> {name, mimeType, parents}
        self._n = 0

    def nuevo(self, nombre, mime, padre):
        self._n += 1
        fid = f"f{self._n}"
        self.archivos[fid] = {"id": fid, "name": nombre, "mimeType": mime, "parents": [padre]}
        return fid

    def create(self, body, fields):
        return _Ejecutable({"id": self.nuevo(body["name"], body["mimeType"], body["parents"][0])})

    def list(self, q, fields, pageSize, pageToken=None):
        nombre = re.search(r"name = '((?:[^'\\]|\\.)*)'", q)
        nombre = nombre.group(1).replace("\\'", "'") if nombre else None
        padres = re.findall(r"'([^']+)' in parents", q)
        solo_carpetas = f"mimeType = '{CARPETA}'" in q
        sin_carpetas = f"mimeType != '{CARPETA}'" in q
        res = [
            f for f in self.archivos.values()
            if f["parents"][0] in padres
            and (nombre is None or f["name"] == nombre)
            and (not solo_carpetas or f["mimeType"] == CARPETA)
            and (not sin_carpetas or f["mimeType"] != CARPETA)
        ]
        return _Ejecutable({"files": res})


def _drive():
    d = Drive.__new__(Drive)
    files = FilesFalso()
    d._api = type("Api", (), {"files": lambda self: files})()
    d._nombre_raiz = "BAIRES FLY"
    d._matriculas = ["LVCCO", "LVCPL"]
    import threading
    d._lock = threading.RLock()
    d._ids = {}
    return d, files


def test_crea_estructura_una_sola_vez():
    d, files = _drive()
    d.asegurar_estructura()
    nombres = sorted(f["name"] for f in files.archivos.values())
    assert nombres == ["BAIRES FLY", "Históricos", "LVCCO", "LVCPL", "PILOTOS"]
    d._ids.clear()  # simula reinicio del bot: no debe duplicar carpetas
    d.asegurar_estructura()
    assert len(files.archivos) == 5


def test_pilotos_y_documentos():
    d, files = _drive()
    ids = d.asegurar_estructura()
    assert d.crear_piloto("juan  pérez") is True
    assert d.crear_piloto("Juan Pérez") is False
    assert d.pilotos() == ["Juan Pérez"]

    files.nuevo("LVCCO - Seguro.pdf", "application/pdf", ids["LVCCO"])
    piloto_id = next(f["id"] for f in files.archivos.values() if f["name"] == "Juan Pérez")
    files.nuevo("CMA.jpg", "image/jpeg", piloto_id)
    files.nuevo("viejo.pdf", "application/pdf", ids["Históricos"])

    docs = d.listar_documentos()
    assert [(x.tipo, x.titular, x.nombre) for x in docs] == [
        ("Avión", "LVCCO", "LVCCO - Seguro.pdf"),
        ("Piloto", "Juan Pérez", "CMA.jpg"),
    ]
