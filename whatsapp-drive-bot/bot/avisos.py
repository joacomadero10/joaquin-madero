"""Avisos automáticos de vencimientos, todos los días a las 10 AM (hora de Argentina)."""
import logging
import threading
import time
from collections.abc import Callable
from datetime import date, datetime

from .vencimientos import ZONA, Aviso, calcular_avisos, hoy

log = logging.getLogger(__name__)


def _documento(aviso: Aviso) -> str:
    """'LVCCO - Seguro' → 'Seguro' (el titular ya se nombra aparte)."""
    f = aviso.fila
    prefijo = f"{f.titular} - "
    return f.documento[len(prefijo):] if f.documento.lower().startswith(prefijo.lower()) else f.documento


def texto_aviso(aviso: Aviso) -> str:
    f = aviso.fila
    return f"⚠️ *Aviso de vencimiento*\n{_documento(aviso)} de {f.titular} {aviso.texto_estado}.\n{f.link}"


def parametros_plantilla(aviso: Aviso) -> list[str]:
    """Los 3 valores {{1}} {{2}} {{3}} de la plantilla aprobada por Meta (ver docs/5-avisos.md)."""
    return [_documento(aviso), aviso.fila.titular, aviso.texto_estado]


class Avisador:
    def __init__(self, planilla, drive, whatsapp, destinos: list[str],
                 plantilla: str, idioma_plantilla: str, hora: int = 10) -> None:
        self._planilla = planilla
        self._drive = drive
        self._whatsapp = whatsapp
        self._destinos = destinos
        self._plantilla = plantilla
        self._idioma = idioma_plantilla
        self._hora = hora
        self._lock = threading.Lock()
        self._ultimo_dia: date | None = None

    def ejecutar(self) -> int:
        """Revisa la planilla y manda los avisos pendientes. Devuelve cuántos mandó.

        Es seguro llamarlo varias veces: cada aviso queda marcado en la planilla y no se repite.
        """
        with self._lock:
            pendientes: list[Aviso] = []

            def marcar(filas):
                avisos, nuevas = calcular_avisos(filas, hoy())
                pendientes.extend(avisos)
                return nuevas

            # Las marcas se guardan antes de mandar: si algo falla, preferimos un aviso
            # perdido (queda en el log) a mandarte el mismo aviso todos los días.
            self._planilla.actualizar(self._drive.listar_documentos(), marcar)
            for aviso in pendientes:
                for destino in self._destinos:
                    try:
                        self._mandar(destino, aviso)
                    except Exception:
                        log.exception("No pude mandar el aviso de %s", aviso.fila.documento)
            log.info("Revisión de vencimientos: %d aviso(s)", len(pendientes))
            return len(pendientes)

    def _mandar(self, destino: str, aviso: Aviso) -> None:
        if self._plantilla:
            self._whatsapp.enviar_plantilla(destino, self._plantilla, self._idioma,
                                            parametros_plantilla(aviso))
        else:
            # Sin plantilla, WhatsApp solo entrega el mensaje si le escribiste al bot
            # en las últimas 24 horas.
            self._whatsapp.enviar_texto(destino, texto_aviso(aviso))

    def toca_revisar(self, ahora: datetime) -> bool:
        return ahora.hour >= self._hora and self._ultimo_dia != ahora.date()

    def iniciar_reloj(self, dormir: Callable[[float], None] = time.sleep) -> threading.Thread:
        """Hilo que se despierta cada minuto y, a partir de las 10, corre la revisión una vez por día."""
        def bucle():
            while True:
                ahora = datetime.now(ZONA)
                if self.toca_revisar(ahora):
                    try:
                        self.ejecutar()
                        self._ultimo_dia = ahora.date()
                    except Exception:
                        log.exception("Falló la revisión de vencimientos; reintento en 15 minutos")
                        dormir(15 * 60)
                        continue
                dormir(60)

        hilo = threading.Thread(target=bucle, daemon=True, name="avisos")
        hilo.start()
        return hilo
