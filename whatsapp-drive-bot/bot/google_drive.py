"""Todo lo que el bot hace en Google Drive.

Estructura que crea y mantiene:

    BAIRES FLY/
        LVCCO/  LVCPL/  ...         (una carpeta por matrícula)
        PILOTOS/
            Juan Perez/  ...        (una carpeta por piloto)
        Históricos/                 (versiones anteriores de los documentos)
"""
import io
import logging
import threading
from dataclasses import dataclass

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

log = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]
CARPETA = "application/vnd.google-apps.folder"
PILOTOS = "PILOTOS"
HISTORICOS = "Históricos"


@dataclass
class Documento:
    id: str
    nombre: str
    mime: str
    titular: str      # matrícula (ej. LVCCO) o nombre del piloto
    tipo: str         # "Avión" o "Piloto"


def _escapar(texto: str) -> str:
    return texto.replace("\\", "\\\\").replace("'", "\\'")


class Drive:
    def __init__(self, client_id: str, client_secret: str, refresh_token: str,
                 carpeta_raiz: str, matriculas: list[str]) -> None:
        cred = Credentials(
            token=None,
            refresh_token=refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            token_uri="https://oauth2.googleapis.com/token",
            scopes=SCOPES,
        )
        self._api = build("drive", "v3", credentials=cred, cache_discovery=False)
        self._nombre_raiz = carpeta_raiz
        self._matriculas = matriculas
        # La librería de Google no es segura para usar desde varios hilos a la vez.
        self._lock = threading.RLock()
        self._ids: dict[str, str] = {}  # caché de IDs de carpetas

    # ---------- carpetas ----------

    def _buscar_carpeta(self, nombre: str, padre: str) -> str | None:
        q = (f"name = '{_escapar(nombre)}' and mimeType = '{CARPETA}' "
             f"and '{padre}' in parents and trashed = false")
        r = self._api.files().list(q=q, fields="files(id)", pageSize=1).execute()
        archivos = r.get("files", [])
        return archivos[0]["id"] if archivos else None

    def _carpeta(self, nombre: str, padre: str) -> str:
        """Devuelve el ID de la carpeta; si no existe, la crea."""
        clave = f"{padre}/{nombre}"
        if clave in self._ids:
            return self._ids[clave]
        carpeta_id = self._buscar_carpeta(nombre, padre)
        if not carpeta_id:
            carpeta_id = self._api.files().create(
                body={"name": nombre, "mimeType": CARPETA, "parents": [padre]},
                fields="id",
            ).execute()["id"]
            log.info("Creé la carpeta %s", nombre)
        self._ids[clave] = carpeta_id
        return carpeta_id

    def asegurar_estructura(self) -> dict[str, str]:
        """Crea las carpetas que falten. Se puede llamar todas las veces que haga falta."""
        with self._lock:
            raiz = self._carpeta(self._nombre_raiz, "root")
            ids = {"raiz": raiz}
            for m in self._matriculas:
                ids[m] = self._carpeta(m, raiz)
            ids[PILOTOS] = self._carpeta(PILOTOS, raiz)
            ids[HISTORICOS] = self._carpeta(HISTORICOS, raiz)
            return ids

    def _subcarpetas(self, padre: str) -> dict[str, str]:
        q = f"mimeType = '{CARPETA}' and '{padre}' in parents and trashed = false"
        r = self._api.files().list(q=q, fields="files(id,name)", pageSize=200).execute()
        return {f["name"]: f["id"] for f in r.get("files", [])}

    def pilotos(self) -> list[str]:
        with self._lock:
            ids = self.asegurar_estructura()
            return sorted(self._subcarpetas(ids[PILOTOS]))

    def crear_piloto(self, nombre: str) -> bool:
        """Crea la carpeta del piloto. Devuelve False si ya existía."""
        nombre = " ".join(nombre.split()).title()
        with self._lock:
            ids = self.asegurar_estructura()
            if self._buscar_carpeta(nombre, ids[PILOTOS]):
                return False
            self._carpeta(nombre, ids[PILOTOS])
            return True

    # ---------- documentos ----------

    def listar_documentos(self) -> list[Documento]:
        """Todos los documentos vigentes (no incluye Históricos)."""
        with self._lock:
            ids = self.asegurar_estructura()
            titulares = {ids[m]: (m, "Avión") for m in self._matriculas}
            for nombre, carpeta_id in self._subcarpetas(ids[PILOTOS]).items():
                titulares[carpeta_id] = (nombre, "Piloto")

            documentos: list[Documento] = []
            padres = list(titulares)
            # Drive limita el largo de la consulta: preguntamos de a 20 carpetas.
            for i in range(0, len(padres), 20):
                grupo = " or ".join(f"'{p}' in parents" for p in padres[i:i + 20])
                q = f"({grupo}) and mimeType != '{CARPETA}' and trashed = false"
                token = None
                while True:
                    r = self._api.files().list(
                        q=q, pageToken=token, pageSize=1000,
                        fields="nextPageToken, files(id,name,mimeType,parents)",
                    ).execute()
                    for f in r.get("files", []):
                        padre = next(p for p in f["parents"] if p in titulares)
                        titular, tipo = titulares[padre]
                        documentos.append(Documento(f["id"], f["name"], f["mimeType"], titular, tipo))
                    token = r.get("nextPageToken")
                    if not token:
                        break
            return sorted(documentos, key=lambda d: (d.tipo, d.titular, d.nombre))

    def descargar(self, doc: Documento) -> tuple[bytes, str, str]:
        """Devuelve (contenido, nombre de archivo, tipo). Los Docs de Google se bajan como PDF."""
        with self._lock:
            nombre, mime = doc.nombre, doc.mime
            if mime.startswith("application/vnd.google-apps"):
                pedido = self._api.files().export_media(fileId=doc.id, mimeType="application/pdf")
                nombre, mime = f"{nombre}.pdf", "application/pdf"
            else:
                pedido = self._api.files().get_media(fileId=doc.id)
            buffer = io.BytesIO()
            descarga = MediaIoBaseDownload(buffer, pedido)
            terminado = False
            while not terminado:
                _, terminado = descarga.next_chunk()
            return buffer.getvalue(), nombre, mime
