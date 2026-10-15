"""Servidor del bot: recibe los mensajes de WhatsApp y responde."""
import json
import logging
import threading
from collections import deque
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response

from .config import Config
from .google_auth import crear_router
from .google_drive import Drive
from .interprete import Interprete
from .whatsapp import WhatsApp, extraer_mensajes, firma_valida

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("bot")

config = Config()
whatsapp = WhatsApp(config.whatsapp_token, config.phone_number_id, config.graph_version)
drive: Drive | None = None
if config.google_listo:
    drive = Drive(config.google_client_id, config.google_client_secret,
                  config.google_refresh_token, config.carpeta_raiz, config.matriculas)
interprete = Interprete(config.claude_modelo, config.matriculas)

# Meta a veces manda el mismo mensaje dos veces: recordamos los últimos IDs para no responder doble.
_procesados: deque[str] = deque(maxlen=500)

FALTA_GOOGLE = (
    "Todavía no estoy conectado a Google Drive 🔌. "
    "Seguí la guía docs/3-google.md para conectarme."
)
SOLO_TEXTO = (
    "Por ahora solo entiendo mensajes de texto ✍️. "
    "Guardar archivos que me mandes llega en una próxima etapa."
)
ERROR = "Uy, algo falló de mi lado 😕. Probá de nuevo en un ratito."


def _crear_carpetas() -> None:
    try:
        drive.asegurar_estructura()
        log.info("Estructura de carpetas en Drive lista")
    except Exception:
        log.exception("No pude crear las carpetas en Drive")


@asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    if drive:
        threading.Thread(target=_crear_carpetas, daemon=True).start()
    else:
        log.warning("Google Drive no está configurado todavía (falta GOOGLE_REFRESH_TOKEN)")
    yield


app = FastAPI(title="Bot BAIRES FLY", lifespan=ciclo_de_vida)
app.include_router(crear_router(config))


def _ocultar(numero: str) -> str:
    return "***" + numero[-4:]


@app.get("/")
def salud() -> dict:
    return {"estado": "ok", "google_conectado": drive is not None}


@app.get("/webhook")
def verificar_webhook(request: Request) -> Response:
    """Meta llama acá una sola vez, cuando configurás el webhook, para comprobar que es tuyo."""
    p = request.query_params
    if p.get("hub.mode") == "subscribe" and p.get("hub.verify_token") == config.verify_token:
        return Response(content=p.get("hub.challenge", ""), media_type="text/plain")
    raise HTTPException(status_code=403, detail="Token de verificación incorrecto")


@app.post("/webhook")
async def recibir(request: Request, tareas: BackgroundTasks) -> dict:
    cuerpo = await request.body()
    if not firma_valida(cuerpo, request.headers.get("X-Hub-Signature-256"), config.app_secret):
        log.warning("Llegó un pedido con firma inválida: lo ignoro")
        raise HTTPException(status_code=403, detail="Firma inválida")

    for mensaje in extraer_mensajes(json.loads(cuerpo)):
        msg_id = mensaje.get("id", "")
        if msg_id in _procesados:
            continue
        _procesados.append(msg_id)

        remitente = mensaje.get("from", "")
        if not config.esta_autorizado(remitente):
            # Número no autorizado: no se le responde nada.
            log.info("Mensaje de número no autorizado %s: ignorado", _ocultar(remitente))
            continue
        tareas.add_task(atender, remitente, mensaje)

    # Respondemos rápido a Meta; el trabajo pesado sigue en segundo plano.
    return {"ok": True}


def atender(remitente: str, mensaje: dict) -> None:
    try:
        _atender(remitente, mensaje)
    except Exception:
        log.exception("Error atendiendo un mensaje de %s", _ocultar(remitente))
        try:
            whatsapp.enviar_texto(remitente, ERROR)
        except Exception:
            log.exception("Tampoco pude avisarle del error")


def _atender(remitente: str, mensaje: dict) -> None:
    if mensaje.get("type") != "text":
        whatsapp.enviar_texto(remitente, SOLO_TEXTO)
        return
    if drive is None:
        whatsapp.enviar_texto(remitente, FALTA_GOOGLE)
        return

    texto = mensaje["text"]["body"]
    decision = interprete.interpretar(texto, drive.listar_documentos(), drive.pilotos())
    log.info("Acción decidida: %s (%d documentos)", decision.accion, len(decision.documentos))

    if decision.accion == "enviar_documentos" and decision.documentos:
        whatsapp.enviar_texto(remitente, decision.respuesta)
        for doc in decision.documentos:
            contenido, nombre, mime = drive.descargar(doc)
            whatsapp.enviar_documento(remitente, contenido, nombre, mime)
    elif decision.accion == "crear_piloto" and decision.nombre_piloto:
        if drive.crear_piloto(decision.nombre_piloto):
            whatsapp.enviar_texto(
                remitente, f"Listo ✅ Creé la carpeta del piloto {decision.nombre_piloto.title()} en PILOTOS.")
        else:
            whatsapp.enviar_texto(remitente, f"El piloto {decision.nombre_piloto.title()} ya tenía su carpeta 👍")
    else:
        whatsapp.enviar_texto(remitente, decision.respuesta)
