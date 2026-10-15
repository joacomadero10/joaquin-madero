"""Comunicación con la API de WhatsApp Cloud (Meta)."""
import hashlib
import hmac
import logging

import httpx

log = logging.getLogger(__name__)


def firma_valida(cuerpo: bytes, firma_header: str | None, app_secret: str) -> bool:
    """Verifica que el mensaje venga realmente de Meta (header X-Hub-Signature-256)."""
    if not firma_header or not firma_header.startswith("sha256="):
        return False
    esperada = hmac.new(app_secret.encode(), cuerpo, hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperada, firma_header.removeprefix("sha256="))


def extraer_mensajes(payload: dict) -> list[dict]:
    """Saca los mensajes entrantes del JSON que manda Meta (ignora avisos de 'leído', etc.)."""
    mensajes = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            mensajes.extend(change.get("value", {}).get("messages", []))
    return mensajes


class WhatsApp:
    def __init__(self, token: str, phone_number_id: str, graph_version: str) -> None:
        self._url = f"https://graph.facebook.com/{graph_version}/{phone_number_id}/messages"
        self._headers = {"Authorization": f"Bearer {token}"}

    def enviar_texto(self, destino: str, texto: str) -> None:
        self._enviar({
            "messaging_product": "whatsapp",
            "to": destino,
            "type": "text",
            "text": {"body": texto},
        })

    def enviar_documento(self, destino: str, contenido: bytes, nombre: str, mime: str) -> None:
        """Sube el archivo a WhatsApp y lo manda como documento (conserva el nombre)."""
        r = httpx.post(
            self._url.removesuffix("/messages") + "/media",
            headers=self._headers,
            data={"messaging_product": "whatsapp", "type": mime},
            files={"file": (nombre, contenido, mime)},
            timeout=120,
        )
        self._revisar(r)
        self._enviar({
            "messaging_product": "whatsapp",
            "to": destino,
            "type": "document",
            "document": {"id": r.json()["id"], "filename": nombre},
        })

    def _enviar(self, cuerpo: dict) -> None:
        self._revisar(httpx.post(self._url, headers=self._headers, json=cuerpo, timeout=30))

    @staticmethod
    def _revisar(r: httpx.Response) -> None:
        if r.status_code >= 400:
            log.error("WhatsApp rechazó el pedido (%s): %s", r.status_code, r.text)
            r.raise_for_status()
