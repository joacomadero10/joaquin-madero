"""Usa Claude para entender qué pide el usuario en lenguaje natural."""
import json
import logging
from dataclasses import dataclass, field
from datetime import date

import anthropic

from .google_drive import Documento

log = logging.getLogger(__name__)

ACCIONES = ["enviar_documentos", "crear_piloto", "fijar_vencimiento", "guardar_documento",
            "consultar_vencimientos", "pedir_planilla", "responder"]
FILTROS = ["vencidos", "por_vencer", "rango", "falta_fecha", "todos"]

DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

ESQUEMA = {
    "type": "object",
    "properties": {
        "accion": {
            "type": "string",
            "enum": ACCIONES,
            "description": "Qué tiene que hacer el bot.",
        },
        "documentos": {
            "type": "array",
            "items": {"type": "string"},
            "description": "IDs (columna id) de los documentos a enviar o a los que se les "
                           "fija el vencimiento. Vacío si no corresponde.",
        },
        "fecha": {
            "type": "string",
            "description": "Para fijar_vencimiento: fecha de vencimiento en formato AAAA-MM-DD. "
                           "Vacío si no vence o si no corresponde.",
        },
        "no_vence": {
            "type": "boolean",
            "description": "Para fijar_vencimiento: true si el documento no vence nunca.",
        },
        "filtro": {
            "type": "string",
            "enum": FILTROS,
            "description": "Para consultar_vencimientos. Si no corresponde, usá 'todos'.",
        },
        "desde": {"type": "string", "description": "Para filtro 'rango': AAAA-MM-DD. Si no, vacío."},
        "hasta": {"type": "string", "description": "Para filtro 'rango': AAAA-MM-DD. Si no, vacío."},
        "titular": {
            "type": "string",
            "description": "Para consultar_vencimientos: matrícula (ej. LVCCO) o piloto si la "
                           "consulta es sobre uno solo (vacío = todos). Para guardar_documento: "
                           "matrícula o piloto dueño del documento, escrito igual que en las listas.",
        },
        "nombre_documento": {
            "type": "string",
            "description": "Para guardar_documento: nombre corto y claro del tipo de documento, "
                           "sin la matrícula ni el piloto (ej. 'Seguro', 'CMA', 'Licencia'). Si "
                           "reemplaza a uno existente, usá el mismo nombre que ese. Si no, vacío.",
        },
        "reemplaza": {
            "type": "string",
            "description": "Para guardar_documento: id del documento existente que este archivo "
                           "renueva o reemplaza. Vacío si es un documento nuevo.",
        },
        "nombre_piloto": {
            "type": "string",
            "description": "Nombre y apellido del piloto a crear. Vacío si no corresponde.",
        },
        "respuesta": {
            "type": "string",
            "description": "Mensaje para el usuario, en español rioplatense, corto y claro.",
        },
    },
    "required": ["accion", "documentos", "fecha", "no_vence", "filtro", "desde", "hasta",
                 "titular", "nombre_documento", "reemplaza", "nombre_piloto", "respuesta"],
    "additionalProperties": False,
}

SISTEMA = """\
Sos el asistente de WhatsApp de BAIRES FLY, una empresa de aviación de Argentina. \
Gestionás la documentación de los aviones y de los pilotos guardada en Google Drive. \
Hablás en español rioplatense (vos, tenés, mandame), con mensajes cortos, cordiales y \
sin vueltas, como en un chat de WhatsApp. Podés usar algún emoji con moderación.

Cada avión se identifica por su matrícula (ej. LVCCO). El usuario puede escribirla de \
muchas formas: "LV-CCO", "lv cco", "el CCO", "CCO". Los pilotos se identifican por \
nombre y/o apellido.

Tu tarea: leer el mensaje del usuario y la lista de documentos disponibles, y decidir \
una acción:

- "enviar_documentos": el usuario pide uno o más archivos. Poné en "documentos" los id \
exactos de la lista que correspondan (máximo 10). En "respuesta" poné un texto corto \
que acompañe el envío, ej: "Ahí te mando el seguro del LV-CCO 📄". Si pide "todo" de \
un avión o piloto, mandá todos sus documentos. Elegí solo documentos que estén en la \
lista: nunca inventes id.
- "crear_piloto": el usuario pide dar de alta un piloto nuevo (crear su carpeta). Poné \
el nombre completo en "nombre_piloto".
- "fijar_vencimiento": el usuario informa la fecha de vencimiento de un documento que ya existe (ej. "el seguro del CCO vence el 15/10/2027", "la licencia de Juan no vence"). Poné el id en "documentos" y la fecha en "fecha" (AAAA-MM-DD), o "no_vence": true. Las fechas que escribe el usuario están en formato argentino día/mes/año. Si no queda claro de qué documento se trata, usá "responder" y preguntá.
- "consultar_vencimientos": preguntas sobre vencimientos. Elegí "filtro":
  * "vencidos": ¿qué tengo vencido?
  * "por_vencer": ¿qué está por vencer? / ¿qué vence pronto?
  * "rango": un período concreto (ej. "este mes", "en noviembre", "de acá a fin de año"): calculá "desde" y "hasta" usando la fecha de hoy.
  * "falta_fecha": ¿a qué documentos les falta la fecha?
  * "todos": todos los vencimientos.
  Si pregunta por un solo avión o piloto, ponelo en "titular". El listado lo arma el bot: en "respuesta" dejá vacío.
- "guardar_documento": solo si hay un <archivo_adjunto> y el usuario dice qué es (ej. "este es el nuevo seguro del CCO, vence el 15/10/2027"). Completá "titular", "nombre_documento", la fecha ("fecha" o "no_vence"; si no la dijo, dejala vacía) y "reemplaza" si en la lista ya hay un documento del mismo tipo para ese titular (es una renovación). El titular tiene que ser una matrícula de la flota o un piloto cargado: si es un piloto que no existe, usá "responder" y sugerí darlo de alta primero. Si no queda claro qué documento es o de quién, usá "responder" y preguntá. En "respuesta" dejá vacío.
- "pedir_planilla": quiere ver la planilla de vencimientos o su link.
- "responder": cualquier otra cosa. Escribí la respuesta en "respuesta". Por ejemplo:
  * Si pide un documento que no está en la lista, o el pedido es ambiguo (ej. "el \
seguro" sin decir de qué avión, y hay varios), no adivines: decile qué encontraste y \
preguntale cuál quiere.
  * Si pregunta qué documentos hay de un avión o piloto, listalos a partir de la lista.
  * Si saluda o pide ayuda, explicá brevemente qué podés hacer: mandar documentos de \
los aviones y pilotos, dar de alta pilotos nuevos, anotar fechas de vencimiento, responder qué está vencido o por vencer, avisar automáticamente 30 días antes y el día que vence cada documento, y guardar documentos nuevos o renovados que le manden por acá (el archivo con un mensaje tipo "este es el nuevo seguro del CCO, vence el 15/10/2027").

Las matrículas de la flota son: {matriculas}.
Los pilotos cargados son: {pilotos}.
"""


@dataclass
class Decision:
    accion: str
    respuesta: str
    documentos: list[Documento] = field(default_factory=list)
    nombre_piloto: str = ""
    fecha: date | None = None
    no_vence: bool = False
    filtro: str = "todos"
    desde: date | None = None
    hasta: date | None = None
    titular: str = ""
    nombre_documento: str = ""
    reemplaza: Documento | None = None


def _fecha_iso(texto: str) -> date | None:
    try:
        return date.fromisoformat(texto.strip())
    except ValueError:
        return None


def tabla_documentos(documentos: list[Documento]) -> str:
    if not documentos:
        return "(todavía no hay documentos cargados)"
    filas = ["id | tipo | titular | nombre del archivo | vencimiento | estado"]
    filas += [f"{d.id} | {d.tipo} | {d.titular} | {d.nombre} | {d.vencimiento or '-'} | {d.estado or '-'}"
              for d in documentos]
    return "\n".join(filas)


class Interprete:
    def __init__(self, modelo: str, matriculas: list[str]) -> None:
        self._cliente = anthropic.Anthropic()  # lee ANTHROPIC_API_KEY del entorno
        self._modelo = modelo
        self._matriculas = matriculas

    def interpretar(self, mensaje: str, documentos: list[Documento], pilotos: list[str],
                    hoy: date, archivo: str = "") -> Decision:
        """archivo: descripción del archivo adjunto pendiente de guardar, si hay uno."""
        sistema = SISTEMA.format(
            matriculas=", ".join(self._matriculas),
            pilotos=", ".join(pilotos) or "(ninguno todavía)",
        )
        contenido = (
            f"Hoy es {DIAS_SEMANA[hoy.weekday()]} {hoy.strftime('%d/%m/%Y')} ({hoy.isoformat()}).\n\n"
            f"<documentos_disponibles>\n{tabla_documentos(documentos)}\n</documentos_disponibles>\n\n"
            + (f"<archivo_adjunto>\n{archivo}\n</archivo_adjunto>\n\n" if archivo else "")
            + f"<mensaje_del_usuario>\n{mensaje}\n</mensaje_del_usuario>"
        )
        r = self._cliente.beta.messages.create(
            model=self._modelo,
            max_tokens=4000,
            system=sistema,
            messages=[{"role": "user", "content": contenido}],
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}},
            # Si el modelo principal se niega por un falso positivo de seguridad, la API
            # reintenta sola con otro modelo.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
        if r.stop_reason == "refusal":
            log.warning("Claude no quiso responder: %s", r.stop_details)
            return Decision("responder", "Perdón, ese pedido no lo puedo procesar. ¿Me lo escribís de otra forma?")
        if r.stop_reason == "max_tokens":
            log.warning("La respuesta de Claude quedó cortada")
            return Decision("responder", "Uy, me enredé. ¿Me lo pedís de nuevo, más concreto?")

        texto = next(b.text for b in r.content if b.type == "text")
        datos = json.loads(texto)
        por_id = {d.id: d for d in documentos}
        elegidos = [por_id[i] for i in datos["documentos"] if i in por_id][:10]
        return Decision(
            accion=datos["accion"],
            respuesta=datos["respuesta"],
            documentos=elegidos,
            nombre_piloto=datos["nombre_piloto"].strip(),
            fecha=_fecha_iso(datos["fecha"]),
            no_vence=datos["no_vence"],
            filtro=datos["filtro"],
            desde=_fecha_iso(datos["desde"]),
            hasta=_fecha_iso(datos["hasta"]),
            titular=datos["titular"].strip(),
            nombre_documento=" ".join(datos["nombre_documento"].split()),
            reemplaza=por_id.get(datos["reemplaza"]),
        )
