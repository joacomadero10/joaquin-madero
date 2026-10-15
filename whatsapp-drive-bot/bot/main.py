"""Servidor del bot: recibe los mensajes de WhatsApp y responde."""
import json
import logging
from collections import deque

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response

from .config import Config
from .whatsapp import WhatsApp, extraer_mensajes, firma_valida

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("bot")

config = Config()
whatsapp = WhatsApp(config.whatsapp_token, config.phone_number_id, config.graph_version)
app = FastAPI(title="Bot BAIRES FLY")

# Meta a veces manda el mismo mensaje dos veces: recordamos los últimos IDs para no responder doble.
_procesados: deque[str] = deque(maxlen=500)

SALUDO = (
    "¡Hola! ✈️ Soy el bot de documentos de BAIRES FLY.\n"
    "Por ahora estoy en la etapa 1: solo sé contestar mensajes. "
    "Pronto vas a poder pedirme documentos de los aviones y de los pilotos."
)


def _ocultar(numero: str) -> str:
    return "***" + numero[-4:]


@app.get("/")
def salud() -> dict:
    return {"estado": "ok"}


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
        whatsapp.enviar_texto(remitente, SALUDO)
    except Exception:
        log.exception("No pude responderle a %s", _ocultar(remitente))
