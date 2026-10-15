import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from bot import main
from bot.google_drive import Documento, _escapar
from bot.interprete import Decision, Interprete, tabla_documentos

AUTORIZADO = "5491144367063"
SEGURO = Documento("id-seguro", "LVCCO - Seguro.pdf", "application/pdf", "LVCCO", "Avión")
CMA = Documento("id-cma", "Juan Perez - CMA.jpg", "image/jpeg", "Juan Perez", "Piloto")


class DriveFalso:
    def __init__(self):
        self.pilotos_creados = []

    def listar_documentos(self):
        return [SEGURO, CMA]

    def pilotos(self):
        return ["Juan Perez"]

    def descargar(self, doc):
        return b"contenido", doc.nombre, doc.mime

    def crear_piloto(self, nombre):
        self.pilotos_creados.append(nombre)
        return True


@pytest.fixture
def entorno(monkeypatch):
    salida = {"textos": [], "archivos": []}
    monkeypatch.setattr(main.whatsapp, "enviar_texto", lambda d, t: salida["textos"].append(t))
    monkeypatch.setattr(main.whatsapp, "enviar_documento",
                        lambda d, c, n, m: salida["archivos"].append(n))
    drive = DriveFalso()
    monkeypatch.setattr(main, "drive", drive)
    salida["drive"] = drive
    return salida


def _texto(cuerpo: str) -> dict:
    return {"type": "text", "id": "x", "text": {"body": cuerpo}}


def test_envia_los_documentos_elegidos(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar",
                        lambda *a: Decision("enviar_documentos", "Ahí va 📄", [SEGURO]))
    main.atender(AUTORIZADO, _texto("mandame el seguro del cco"))
    assert entorno["textos"] == ["Ahí va 📄"]
    assert entorno["archivos"] == ["LVCCO - Seguro.pdf"]


def test_crea_piloto(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar",
                        lambda *a: Decision("crear_piloto", "", nombre_piloto="ana gomez"))
    main.atender(AUTORIZADO, _texto("agregá a la piloto Ana Gomez"))
    assert entorno["drive"].pilotos_creados == ["ana gomez"]
    assert "Ana Gomez" in entorno["textos"][0]


def test_responde_texto(entorno, monkeypatch):
    monkeypatch.setattr(main.interprete, "interpretar", lambda *a: Decision("responder", "¿De qué avión?"))
    main.atender(AUTORIZADO, _texto("mandame el seguro"))
    assert entorno["textos"] == ["¿De qué avión?"] and entorno["archivos"] == []


def test_error_avisa_al_usuario(entorno, monkeypatch):
    def explota(*a):
        raise RuntimeError("se cayó Claude")
    monkeypatch.setattr(main.interprete, "interpretar", explota)
    main.atender(AUTORIZADO, _texto("hola"))
    assert entorno["textos"] == [main.ERROR]


def test_sin_google_avisa(entorno, monkeypatch):
    monkeypatch.setattr(main, "drive", None)
    main.atender(AUTORIZADO, _texto("hola"))
    assert entorno["textos"] == [main.FALTA_GOOGLE]


def test_archivo_entrante_todavia_no_soportado(entorno):
    main.atender(AUTORIZADO, {"type": "document", "id": "y"})
    assert entorno["textos"] == [main.SOLO_TEXTO]


def _respuesta_claude(datos: dict, stop="end_turn"):
    return SimpleNamespace(stop_reason=stop, stop_details=None,
                           content=[SimpleNamespace(type="text", text=json.dumps(datos))])


def test_interprete_descarta_ids_inventados(monkeypatch):
    it = Interprete("claude-opus-5-5", ["LVCCO"])
    pedido = {}

    def falso_create(**kw):
        pedido.update(kw)
        return _respuesta_claude({"accion": "enviar_documentos", "documentos": ["id-seguro", "inventado"],
                                  "nombre_piloto": "", "respuesta": "ok"})
    monkeypatch.setattr(it._cliente.beta.messages, "create", falso_create)
    d = it.interpretar("el seguro del cco", [SEGURO, CMA], ["Juan Perez"])
    assert [x.id for x in d.documentos] == ["id-seguro"]
    assert "LVCCO - Seguro.pdf" in pedido["messages"][0]["content"]
    assert pedido["output_config"]["format"]["type"] == "json_schema"


def test_interprete_maneja_rechazo(monkeypatch):
    it = Interprete("claude-opus-5-5", ["LVCCO"])
    monkeypatch.setattr(it._cliente.beta.messages, "create",
                        lambda **kw: _respuesta_claude({}, stop="refusal"))
    assert it.interpretar("x", [], []).accion == "responder"


def test_tabla_documentos():
    assert "id-cma | Piloto | Juan Perez" in tabla_documentos([CMA])
    assert "todavía no hay" in tabla_documentos([])


def test_escapar_comillas_para_drive():
    assert _escapar("O'Brien") == "O\\'Brien"


cliente = TestClient(main.app)


def test_google_conectar_pide_clave():
    assert cliente.get("/google/conectar", params={"clave": "mala"}).status_code == 403


def test_google_conectar_redirige_a_google():
    r = cliente.get("/google/conectar", params={"clave": "admin123"}, follow_redirects=False)
    assert r.status_code == 307
    assert r.headers["location"].startswith("https://accounts.google.com/")
    assert "access_type=offline" in r.headers["location"]


def test_google_callback_rechaza_state_falso():
    assert cliente.get("/google/callback", params={"code": "c", "state": "trucho"}).status_code == 403
