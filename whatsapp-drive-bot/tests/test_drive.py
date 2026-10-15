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

    def create(self, body, fields, media_body=None):
        mime = body.get("mimeType") or media_body.mimetype()
        return _Ejecutable({"id": self.nuevo(body["name"], mime, body["parents"][0])})

    def get(self, fileId, fields):
        return _Ejecutable({"parents": self.archivos[fileId]["parents"]})

    def update(self, fileId, addParents, removeParents, body, fields):
        f = self.archivos[fileId]
        assert f["parents"] == removeParents.split(",")
        f["parents"] = [addParents]
        f["name"] = body["name"]
        return _Ejecutable({"id": fileId})

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


def test_guardar_y_archivar():
    d, files = _drive()
    ids = d.asegurar_estructura()
    d.crear_piloto("Juan Pérez")
    assert d.carpeta_de("lv-cco")[1:] == ("LVCCO", "Avión")
    assert d.carpeta_de("juan pérez")[1:] == ("Juan Pérez", "Piloto")
    assert d.carpeta_de("LVZZZ") is None

    viejo = files.nuevo("LVCCO - Seguro.pdf", "application/pdf", ids["LVCCO"])
    assert d.buscar_en_carpeta("LVCCO - Seguro.pdf", ids["LVCCO"]) == [viejo]
    nuevo = d.subir(b"pdf", "LVCCO - Seguro.pdf", "application/pdf", ids["LVCCO"])
    d.archivar(viejo, "LVCCO", "LVCCO - Seguro (venció 20-10-2026).pdf")

    assert [x.id for x in d.listar_documentos()] == [nuevo]
    archivado = files.archivos[viejo]
    carpeta_hist = files.archivos[archivado["parents"][0]]
    assert carpeta_hist["name"] == "LVCCO"
    assert carpeta_hist["parents"] == [ids["Históricos"]]
    assert archivado["name"] == "LVCCO - Seguro (venció 20-10-2026).pdf"
