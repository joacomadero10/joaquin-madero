"""Servidor del bot: recibe los mensajes de WhatsApp y responde."""
import hmac
import json
import logging
import mimetypes
import threading
import time
from collections import deque
from contextlib import asynccontextmanager
from dataclasses import dataclass

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response

from .avisos import Avisador
from .config import Config
from .google_auth import crear_router
from .google_drive import Documento, Drive, credenciales
from .interprete import Decision, Interprete
from .planilla import Planilla
from .vencimientos import consultar, escribir_fecha, fijar_vencimiento, hoy, leer_fecha
from .whatsapp import WhatsApp, extraer_mensajes, firma_valida

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("bot")

config = Config()
whatsapp = WhatsApp(config.whatsapp_token, config.phone_number_id, config.graph_version)
drive: Drive | None = None
planilla: Planilla | None = None
avisador: Avisador | None = None
if config.google_listo:
    _cred = credenciales(config.google_client_id, config.google_client_secret, config.google_refresh_token)
    drive = Drive(_cred, config.carpeta_raiz, config.matriculas)
    planilla = Planilla(_cred, drive, config.nombre_planilla)
    avisador = Avisador(planilla, drive, whatsapp, sorted(config.numeros_autorizados),
                        config.plantilla_aviso, config.plantilla_idioma, config.hora_avisos)
interprete = Interprete(config.claude_modelo, config.matriculas)

# Meta a veces manda el mismo mensaje dos veces: recordamos los últimos IDs para no responder doble.
_procesados: deque[str] = deque(maxlen=500)

FALTA_GOOGLE = (
    "Todavía no estoy conectado a Google Drive 🔌. "
    "Seguí la guía docs/3-google.md para conectarme."
)
SOLO_TEXTO = "Solo entiendo mensajes de texto y archivos (PDF o fotos) ✍️📎"
PEDIR_DATOS_ARCHIVO = (
    "Recibí el archivo 📎 ¿Qué documento es, de qué avión o piloto, y cuándo vence?\n"
    "Ej: \"es el nuevo seguro del CCO, vence el 15/10/2027\""
)
TIPOS_ARCHIVO = {"document", "image"}
VIDA_PENDIENTE = 60 * 60  # un archivo sin datos se olvida después de 1 hora


@dataclass
class ArchivoPendiente:
    media_id: str
    mime: str
    nombre_original: str
    recibido: float

    def describir(self) -> str:
        return f"Nombre original: {self.nombre_original or '(sin nombre, es una foto)'}. Tipo: {self.mime}."


# Archivo recibido por remitente, esperando que digas qué es.
_pendientes: dict[str, ArchivoPendiente] = {}
NO_ENTENDI = "No te entendí bien 🤔 ¿Me lo decís de otra forma?"
ERROR = "Uy, algo falló de mi lado 😕. Probá de nuevo en un ratito."


def _preparar_drive() -> None:
    try:
        drive.asegurar_estructura()
        planilla.actualizar(drive.listar_documentos())
        log.info("Carpetas y planilla de vencimientos listas: %s", planilla.link)
    except Exception:
        log.exception("No pude preparar las carpetas o la planilla en Drive")


@asynccontextmanager
async def ciclo_de_vida(_app: FastAPI):
    if drive:
        threading.Thread(target=_preparar_drive, daemon=True).start()
        avisador.iniciar_reloj()
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


@app.get("/tareas/avisos")
def tarea_avisos(tareas: BackgroundTasks, clave: str = "") -> dict:
    """Para dispararlo desde afuera (ej. cron-job.org). Es seguro llamarlo de más:
    cada aviso se manda una sola vez."""
    if not config.clave_admin or not hmac.compare_digest(clave, config.clave_admin):
        raise HTTPException(status_code=403, detail="Clave incorrecta")
    if avisador is None:
        raise HTTPException(status_code=503, detail="Google no está conectado")
    tareas.add_task(avisador.ejecutar)
    return {"ok": True}


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
    tipo = mensaje.get("type")
    if tipo != "text" and tipo not in TIPOS_ARCHIVO:
        whatsapp.enviar_texto(remitente, SOLO_TEXTO)
        return
    if drive is None:
        whatsapp.enviar_texto(remitente, FALTA_GOOGLE)
        return

    if tipo in TIPOS_ARCHIVO:
        datos = mensaje[tipo]
        _pendientes[remitente] = ArchivoPendiente(
            datos["id"], datos.get("mime_type", ""), datos.get("filename", ""), time.time())
        texto = datos.get("caption", "").strip()
        if not texto:
            whatsapp.enviar_texto(remitente, PEDIR_DATOS_ARCHIVO)
            return
    else:
        texto = mensaje["text"]["body"]

    pendiente = _pendientes.get(remitente)
    if pendiente and time.time() - pendiente.recibido > VIDA_PENDIENTE:
        _pendientes.pop(remitente, None)
        pendiente = None

    documentos = drive.listar_documentos()
    filas = planilla.actualizar(documentos)
    _completar_vencimientos(documentos, filas)
    decision = interprete.interpretar(texto, documentos, drive.pilotos(), hoy(),
                                      pendiente.describir() if pendiente else "")
    log.info("Acción decidida: %s (%d documentos)", decision.accion, len(decision.documentos))

    if decision.accion == "guardar_documento" and pendiente:
        whatsapp.enviar_texto(remitente, _guardar(pendiente, decision, documentos))
        _pendientes.pop(remitente, None)
        return

    if decision.accion == "enviar_documentos" and decision.documentos:
        if decision.respuesta:
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
    elif decision.accion == "fijar_vencimiento" and decision.documentos and (decision.fecha or decision.no_vence):
        whatsapp.enviar_texto(remitente, _fijar_vencimiento(documentos, decision))
    elif decision.accion == "consultar_vencimientos":
        respuesta = consultar(filas, hoy(), decision.filtro, decision.desde, decision.hasta, decision.titular)
        whatsapp.enviar_texto(remitente, respuesta)
    elif decision.accion == "pedir_planilla":
        whatsapp.enviar_texto(remitente, f"📊 Planilla de vencimientos:\n{planilla.link}")
    elif decision.accion == "guardar_documento":
        whatsapp.enviar_texto(remitente, "Mandame primero el archivo (PDF o foto) y después te pregunto los datos 📎")
    else:
        whatsapp.enviar_texto(remitente, decision.respuesta or NO_ENTENDI)


def _completar_vencimientos(documentos: list[Documento], filas) -> None:
    """Le agrega a cada documento su vencimiento y estado, para que Claude los vea."""
    por_id = {f.archivo_id: f for f in filas}
    dia = hoy()
    for d in documentos:
        if fila := por_id.get(d.id):
            d.vencimiento, d.estado = fila.vencimiento, fila.estado(dia)


def _fijar_vencimiento(documentos: list[Documento], decision: Decision) -> str:
    ids = {d.id for d in decision.documentos}
    fecha = None if decision.no_vence else decision.fecha

    def cambio(filas):
        return [fijar_vencimiento(f, fecha) if f.archivo_id in ids else f for f in filas]

    filas = planilla.actualizar(documentos, cambio)
    dia = hoy()
    lineas = [f"• {f.titular} – {f.documento}: {f.vencimiento} ({f.estado(dia).lower()})"
              for f in filas if f.archivo_id in ids]
    return "Anotado ✅\n" + "\n".join(lineas)


def _extension(pendiente: ArchivoPendiente) -> str:
    if "." in pendiente.nombre_original:
        return "." + pendiente.nombre_original.rsplit(".", 1)[1].lower()
    ext = mimetypes.guess_extension(pendiente.mime.split(";")[0].strip()) or ""
    return ".jpg" if ext in (".jpe", ".jpeg") else ext


def _nombre_archivado(doc: Documento) -> str:
    """'LVCCO - Seguro.pdf' → 'LVCCO - Seguro (venció 15-10-2026).pdf'"""
    base, punto, ext = doc.nombre.rpartition(".")
    if not punto:
        base, ext = doc.nombre, ""
    fecha = leer_fecha(doc.vencimiento)
    sufijo = f"venció {fecha.strftime('%d-%m-%Y')}" if fecha else f"archivado {hoy().strftime('%d-%m-%Y')}"
    return f"{base} ({sufijo})" + (f".{ext}" if ext else "")


def _guardar(pendiente: ArchivoPendiente, decision: Decision, documentos: list[Documento]) -> str:
    """Sube el archivo nuevo, archiva el anterior en Históricos y actualiza la planilla."""
    destino = drive.carpeta_de(decision.titular)
    if destino is None:
        return (f"No encontré la carpeta de \"{decision.titular}\" 🤔. "
                "Decime la matrícula o el piloto (si es un piloto nuevo, primero pedime que lo dé de alta).")
    carpeta_id, titular, _tipo = destino
    nombre_doc = decision.nombre_documento or "Documento"
    nombre_archivo = f"{titular} - {nombre_doc}{_extension(pendiente)}"

    # Qué archivos reemplaza: el que eligió Claude y cualquiera con el mismo nombre en la carpeta.
    por_id = {d.id: d for d in documentos}
    ids = []
    if decision.reemplaza and decision.reemplaza.titular == titular:
        ids.append(decision.reemplaza.id)
    ids += drive.buscar_en_carpeta(nombre_archivo, carpeta_id)
    reemplazados = [por_id[i] for i in dict.fromkeys(ids) if i in por_id]

    # Primero subimos el nuevo; recién después movemos el viejo (así nunca se pierde nada).
    contenido, mime = whatsapp.descargar_media(pendiente.media_id)
    nuevo_id = drive.subir(contenido, nombre_archivo, mime or pendiente.mime, carpeta_id)
    for viejo in reemplazados:
        drive.archivar(viejo.id, titular, _nombre_archivado(viejo))

    fecha = None if decision.no_vence else decision.fecha

    def cambio(filas):
        if not (decision.fecha or decision.no_vence):
            return filas
        return [fijar_vencimiento(f, fecha) if f.archivo_id == nuevo_id else f for f in filas]

    planilla.actualizar(drive.listar_documentos(), cambio)

    lineas = [f"Listo ✅ Guardé *{nombre_archivo}* en la carpeta {titular}."]
    if decision.no_vence:
        lineas.append("Quedó anotado que no vence.")
    elif decision.fecha:
        lineas.append(f"Vence el {escribir_fecha(decision.fecha)}.")
    else:
        lineas.append("⚠️ No me dijiste cuándo vence. Decime la fecha (ej. \"vence el 15/10/2027\") "
                      "o \"no vence\".")
    if reemplazados:
        lineas.append(f"La versión anterior quedó en Históricos/{titular} 🗂️")
    return "\n".join(lineas)
