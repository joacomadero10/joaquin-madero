import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient

from bot import main
from bot.config import normalizar_numero

cliente = TestClient(main.app)


def _mensaje(remitente: str, msg_id: str = "wamid.1", texto: str = "hola") -> dict:
    return {"entry": [{"changes": [{"value": {"messages": [
        {"from": remitente, "id": msg_id, "type": "text", "text": {"body": texto}}
    ]}}]}]}


def _post(payload: dict, secreto: str = "secreto"):
    cuerpo = json.dumps(payload).encode()
    firma = "sha256=" + hmac.new(secreto.encode(), cuerpo, hashlib.sha256).hexdigest()
    return cliente.post("/webhook", content=cuerpo, headers={
        "X-Hub-Signature-256": firma, "Content-Type": "application/json"})


@pytest.fixture
def enviados(monkeypatch):
    lista = []
    monkeypatch.setattr(main.whatsapp, "enviar_texto", lambda d, t: lista.append((d, t)))
    monkeypatch.setattr(main, "drive", None)
    main._procesados.clear()
    return lista


def test_verificacion_webhook():
    r = cliente.get("/webhook", params={
        "hub.mode": "subscribe", "hub.verify_token": "verificame", "hub.challenge": "42"})
    assert r.status_code == 200 and r.text == "42"


def test_verificacion_webhook_token_incorrecto():
    r = cliente.get("/webhook", params={
        "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "42"})
    assert r.status_code == 403


def test_responde_al_autorizado(enviados):
    assert _post(_mensaje("5491144367063")).status_code == 200
    assert len(enviados) == 1 and enviados[0][0] == "5491144367063"


def test_ignora_no_autorizado(enviados):
    assert _post(_mensaje("5491100000000")).status_code == 200
    assert enviados == []


def test_rechaza_firma_falsa(enviados):
    assert _post(_mensaje("5491144367063"), secreto="trucho").status_code == 403
    assert enviados == []


def test_no_responde_dos_veces_el_mismo_mensaje(enviados):
    _post(_mensaje("5491144367063", "wamid.X"))
    _post(_mensaje("5491144367063", "wamid.X"))
    assert len(enviados) == 1


def test_normalizar_numero():
    assert normalizar_numero("+54 9 11 4436-7063") == "5491144367063"
    assert normalizar_numero("541144367063") == "5491144367063"
