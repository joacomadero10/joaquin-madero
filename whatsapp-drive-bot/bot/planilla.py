"""La planilla "BAIRES FLY - Vencimientos" en Google Sheets.

La crea el bot dentro de la carpeta BAIRES FLY. Podés editarla a mano (por ejemplo,
para cargar fechas): el bot respeta lo que escribas en la columna "Vencimiento".
"""
import logging
import threading
from collections.abc import Callable

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .google_drive import Documento, Drive
from .vencimientos import ENCABEZADOS, Fila, hoy, sincronizar

log = logging.getLogger(__name__)

HOJA = "Vencimientos"
SPREADSHEET = "application/vnd.google-apps.spreadsheet"
ULTIMA_COLUMNA = chr(ord("A") + len(ENCABEZADOS) - 1)  # J


class Planilla:
    def __init__(self, cred: Credentials, drive: Drive, nombre: str) -> None:
        self._api = build("sheets", "v4", credentials=cred, cache_discovery=False)
        self._drive = drive
        self._nombre = nombre
        self._id: str | None = None
        self._lock = threading.RLock()

    @property
    def link(self) -> str:
        return f"https://docs.google.com/spreadsheets/d/{self._asegurar()}"

    def _asegurar(self) -> str:
        if self._id:
            return self._id
        raiz = self._drive.asegurar_estructura()["raiz"]
        self._id, creada = self._drive.buscar_o_crear_archivo(self._nombre, SPREADSHEET, raiz)
        if creada:
            self._preparar()
            log.info("Creé la planilla %s", self._nombre)
        return self._id

    def _preparar(self) -> None:
        """Formato inicial: nombre de la hoja, idioma, encabezado fijo y en negrita."""
        hoja = self._api.spreadsheets().get(spreadsheetId=self._id).execute()["sheets"][0]
        hoja_id = hoja["properties"]["sheetId"]
        self._api.spreadsheets().batchUpdate(spreadsheetId=self._id, body={"requests": [
            {"updateSpreadsheetProperties": {
                "properties": {"locale": "es_AR", "timeZone": "America/Argentina/Buenos_Aires"},
                "fields": "locale,timeZone"}},
            {"updateSheetProperties": {
                "properties": {"sheetId": hoja_id, "title": HOJA,
                               "gridProperties": {"frozenRowCount": 1}},
                "fields": "title,gridProperties.frozenRowCount"}},
            {"repeatCell": {
                "range": {"sheetId": hoja_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
                "fields": "userEnteredFormat.textFormat.bold"}},
        ]}).execute()
        self._escribir_celdas([])

    def _leer(self) -> list[list[str]]:
        r = self._api.spreadsheets().values().get(
            spreadsheetId=self._asegurar(), range=f"{HOJA}!A2:{ULTIMA_COLUMNA}",
            valueRenderOption="FORMATTED_VALUE",
        ).execute()
        n = len(ENCABEZADOS)
        return [([str(c) for c in fila] + [""] * n)[:n] for fila in r.get("values", []) if any(fila)]

    def _escribir_celdas(self, filas: list[list]) -> None:
        planilla_id = self._asegurar()
        valores = self._api.spreadsheets().values()
        valores.clear(spreadsheetId=planilla_id, range=f"{HOJA}!A2:{ULTIMA_COLUMNA}").execute()
        valores.update(
            spreadsheetId=planilla_id, range=f"{HOJA}!A1",
            valueInputOption="RAW", body={"values": [ENCABEZADOS] + filas},
        ).execute()

    def _escribir(self, antes: list[list[str]], despues: list[Fila]) -> None:
        """Guarda solo si algo cambió (incluye estado y días, que cambian cada día)."""
        celdas = [f.a_celdas(hoy()) for f in despues]
        if celdas == antes:
            return
        # Los días restantes van como número para poder ordenar en la planilla.
        valores = [[int(c) if i == 5 and c else c for i, c in enumerate(fila)] for fila in celdas]
        self._escribir_celdas(valores)

    def actualizar(self, documentos: list[Documento],
                   cambio: Callable[[list[Fila]], list[Fila]] | None = None) -> list[Fila]:
        """Lee la planilla, la sincroniza con Drive, aplica un cambio opcional y la guarda."""
        with self._lock:
            antes = self._leer()
            filas = sincronizar([Fila.desde_celdas(c) for c in antes], documentos)
            if cambio:
                filas = cambio(filas)
            self._escribir(antes, filas)
            return filas
