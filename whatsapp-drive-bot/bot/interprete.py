"""Usa Claude para entender qué pide el usuario en lenguaje natural."""
import json
import logging
from dataclasses import dataclass, field

import anthropic

from .google_drive import Documento

log = logging.getLogger(__name__)

ACCIONES = ["enviar_documentos", "crear_piloto", "responder"]

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
            "description": "IDs (columna id) de los documentos a enviar. Vacío si no corresponde.",
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
    "required": ["accion", "documentos", "nombre_piloto", "respuesta"],
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
- "responder": cualquier otra cosa. Escribí la respuesta en "respuesta". Por ejemplo:
  * Si pide un documento que no está en la lista, o el pedido es ambiguo (ej. "el \
seguro" sin decir de qué avión, y hay varios), no adivines: decile qué encontraste y \
preguntale cuál quiere.
  * Si pregunta qué documentos hay de un avión o piloto, listalos a partir de la lista.
  * Si saluda o pide ayuda, explicá brevemente qué podés hacer: mandar documentos de \
los aviones y pilotos, y dar de alta pilotos nuevos.

Las matrículas de la flota son: {matriculas}.
Los pilotos cargados son: {pilotos}.
"""


@dataclass
class Decision:
    accion: str
    respuesta: str
    documentos: list[Documento] = field(default_factory=list)
    nombre_piloto: str = ""


def tabla_documentos(documentos: list[Documento]) -> str:
    if not documentos:
        return "(todavía no hay documentos cargados)"
    filas = ["id | tipo | titular | nombre del archivo"]
    filas += [f"{d.id} | {d.tipo} | {d.titular} | {d.nombre}" for d in documentos]
    return "\n".join(filas)


class Interprete:
    def __init__(self, modelo: str, matriculas: list[str]) -> None:
        self._cliente = anthropic.Anthropic()  # lee ANTHROPIC_API_KEY del entorno
        self._modelo = modelo
        self._matriculas = matriculas

    def interpretar(self, mensaje: str, documentos: list[Documento], pilotos: list[str]) -> Decision:
        sistema = SISTEMA.format(
            matriculas=", ".join(self._matriculas),
            pilotos=", ".join(pilotos) or "(ninguno todavía)",
        )
        contenido = (
            f"<documentos_disponibles>\n{tabla_documentos(documentos)}\n</documentos_disponibles>\n\n"
            f"<mensaje_del_usuario>\n{mensaje}\n</mensaje_del_usuario>"
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
        return Decision(datos["accion"], datos["respuesta"], elegidos, datos["nombre_piloto"].strip())
