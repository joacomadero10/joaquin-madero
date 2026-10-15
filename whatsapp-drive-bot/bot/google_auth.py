"""Conexión con tu cuenta de Google (se hace una sola vez, desde el navegador).

1. Entrás a  https://TU-BOT/google/conectar?clave=TU_CLAVE_ADMIN
2. Google te pide permiso para que el bot use tu Drive.
3. El bot te muestra un código (refresh token) que pegás en la variable GOOGLE_REFRESH_TOKEN.
"""
import hashlib
import hmac
import html
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from .config import Config
from .google_drive import SCOPES


def crear_router(config: Config) -> APIRouter:
    router = APIRouter()

    def _redirect_uri() -> str:
        return f"{config.url_publica}/google/callback"

    def _state() -> str:
        return hmac.new(config.clave_admin.encode(), b"google-oauth", hashlib.sha256).hexdigest()

    def _chequear_configuracion() -> None:
        faltan = [n for n, v in [
            ("GOOGLE_CLIENT_ID", config.google_client_id),
            ("GOOGLE_CLIENT_SECRET", config.google_client_secret),
            ("CLAVE_ADMIN", config.clave_admin),
            ("URL_PUBLICA", config.url_publica),
        ] if not v]
        if faltan:
            raise HTTPException(500, f"Faltan variables de entorno: {', '.join(faltan)}")

    @router.get("/google/conectar")
    def conectar(clave: str = "") -> RedirectResponse:
        _chequear_configuracion()
        if not hmac.compare_digest(clave, config.clave_admin):
            raise HTTPException(403, "Clave incorrecta")
        parametros = {
            "client_id": config.google_client_id,
            "redirect_uri": _redirect_uri(),
            "response_type": "code",
            "scope": " ".join(SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": _state(),
        }
        return RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(parametros))

    @router.get("/google/callback", response_class=HTMLResponse)
    def callback(code: str = "", state: str = "", error: str = "") -> str:
        _chequear_configuracion()
        if error:
            return _pagina("No se pudo conectar", f"Google respondió: {html.escape(error)}")
        if not hmac.compare_digest(state, _state()):
            raise HTTPException(403, "Pedido inválido")
        r = httpx.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": config.google_client_id,
            "client_secret": config.google_client_secret,
            "redirect_uri": _redirect_uri(),
            "grant_type": "authorization_code",
        }, timeout=30)
        token = r.json().get("refresh_token") if r.status_code == 200 else None
        if not token:
            return _pagina("No se pudo conectar", "Google no devolvió el código. Probá de nuevo desde el principio.")
        return _pagina(
            "✅ Google conectado",
            "Copiá este código y pegalo en la variable <b>GOOGLE_REFRESH_TOKEN</b> del hosting:"
            f"<pre>{html.escape(token)}</pre>"
            "Es como una contraseña: no lo compartas con nadie. Después de guardarlo podés cerrar esta página.",
        )

    return router


def _pagina(titulo: str, cuerpo: str) -> str:
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{titulo}</title>
<style>body{{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}}
pre{{background:#f1f1f1;padding:12px;white-space:pre-wrap;word-break:break-all;user-select:all}}</style>
</head><body><h1>{titulo}</h1><p>{cuerpo}</p></body></html>"""
