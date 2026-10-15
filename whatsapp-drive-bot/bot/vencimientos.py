"""Reglas de vencimientos: estados, avisos y consultas. No habla con Google ni con WhatsApp."""
import re
from dataclasses import dataclass, replace
from datetime import date, datetime
from zoneinfo import ZoneInfo

ZONA = ZoneInfo("America/Argentina/Buenos_Aires")
DIAS_AVISO_PREVIO = 30
NO_VENCE = "No vence"

VIGENTE = "Vigente"
POR_VENCER = "Por vencer"
VENCE_HOY = "Vence hoy"
VENCIDO = "Vencido"
FALTA_FECHA = "Falta fecha"

ENCABEZADOS = ["Tipo", "Titular", "Documento", "Vencimiento", "Estado", "Días restantes",
               "Link", "ID archivo", "Aviso 30 días", "Aviso vencimiento"]

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]


def hoy() -> date:
    return datetime.now(ZONA).date()


def leer_fecha(texto: str) -> date | None:
    """Acepta 15/10/2027, 15-10-2027, 5/3/27 o 2027-10-15. Devuelve None si no es una fecha."""
    texto = texto.strip()
    if m := re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})", texto):
        a, me, d = map(int, m.groups())
    elif m := re.fullmatch(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})", texto):
        d, me, a = map(int, m.groups())
        if a < 100:
            a += 2000
    else:
        return None
    try:
        return date(a, me, d)
    except ValueError:
        return None


def escribir_fecha(f: date) -> str:
    return f.strftime("%d/%m/%Y")


def es_no_vence(texto: str) -> bool:
    return texto.strip().lower() in {"no vence", "permanente", "de por vida", "n/a", "-"}


@dataclass
class Fila:
    tipo: str
    titular: str
    documento: str
    vencimiento: str     # "15/10/2027", "No vence" o ""
    link: str
    archivo_id: str
    aviso_30: str = ""   # fecha en que se mandó el aviso previo
    aviso_dia: str = ""  # fecha en que se mandó el aviso de vencimiento

    @property
    def fecha(self) -> date | None:
        return leer_fecha(self.vencimiento)

    def dias_restantes(self, dia: date) -> int | None:
        f = self.fecha
        return (f - dia).days if f else None

    def estado(self, dia: date) -> str:
        if es_no_vence(self.vencimiento):
            return NO_VENCE
        dias = self.dias_restantes(dia)
        if dias is None:
            return FALTA_FECHA
        if dias < 0:
            return VENCIDO
        if dias == 0:
            return VENCE_HOY
        if dias <= DIAS_AVISO_PREVIO:
            return POR_VENCER
        return VIGENTE

    def a_celdas(self, dia: date) -> list[str]:
        dias = self.dias_restantes(dia)
        return [self.tipo, self.titular, self.documento, self.vencimiento, self.estado(dia),
                "" if dias is None else str(dias), self.link, self.archivo_id,
                self.aviso_30, self.aviso_dia]

    @classmethod
    def desde_celdas(cls, celdas: list[str]) -> "Fila":
        c = (celdas + [""] * len(ENCABEZADOS))[:len(ENCABEZADOS)]
        return cls(tipo=c[0], titular=c[1], documento=c[2], vencimiento=c[3], link=c[6],
                   archivo_id=c[7], aviso_30=c[8], aviso_dia=c[9])


def sin_extension(nombre: str) -> str:
    return re.sub(r"\.[A-Za-z0-9]{2,5}$", "", nombre)


def sincronizar(filas: list[Fila], documentos) -> list[Fila]:
    """Une la planilla con lo que hay en Drive.

    - Documentos nuevos en Drive → fila nueva (sin fecha).
    - Documentos que ya no están (borrados o pasados a Históricos) → se saca la fila.
    - Nombre/titular se actualizan desde Drive; la fecha y los avisos se conservan.
    """
    por_id = {f.archivo_id: f for f in filas if f.archivo_id}
    resultado = []
    for d in documentos:
        vieja = por_id.get(d.id)
        link = f"https://drive.google.com/file/d/{d.id}/view"
        if vieja:
            resultado.append(replace(vieja, tipo=d.tipo, titular=d.titular,
                                     documento=sin_extension(d.nombre), link=link))
        else:
            resultado.append(Fila(d.tipo, d.titular, sin_extension(d.nombre), "", link, d.id))
    return ordenar(resultado)


def ordenar(filas: list[Fila]) -> list[Fila]:
    return sorted(filas, key=lambda f: (f.tipo != "Avión", f.titular, f.documento.lower()))


def fijar_vencimiento(fila: Fila, fecha: date | None) -> Fila:
    """Cambia la fecha (None = no vence) y reinicia los avisos."""
    return replace(fila, vencimiento=escribir_fecha(fecha) if fecha else NO_VENCE,
                   aviso_30="", aviso_dia="")


# ---------- avisos ----------

@dataclass
class Aviso:
    fila: Fila
    texto_estado: str  # ej. "vence el 14/11/2026 (en 30 días)"


def calcular_avisos(filas: list[Fila], dia: date) -> tuple[list[Aviso], list[Fila]]:
    """Devuelve los avisos a mandar hoy y las filas con las marcas de aviso actualizadas.

    Se usa "¿ya se avisó?" en lugar de "¿faltan exactamente 30 días?", así si el bot
    estuvo caído un día, o cargás una fecha con menos de 30 días, igual te avisa.
    """
    avisos, nuevas = [], []
    marca = escribir_fecha(dia)
    for f in filas:
        dias = f.dias_restantes(dia)
        if dias is None or es_no_vence(f.vencimiento):
            nuevas.append(f)
            continue
        if dias <= 0 and not f.aviso_dia:
            if dias == 0:
                texto = f"vence HOY ({f.vencimiento})"
            else:
                texto = f"está VENCIDO desde el {f.vencimiento}"
            avisos.append(Aviso(f, texto))
            f = replace(f, aviso_dia=marca, aviso_30=f.aviso_30 or marca)
        elif 0 < dias <= DIAS_AVISO_PREVIO and not f.aviso_30:
            texto = f"vence el {f.vencimiento} (en {dias} día{'s' if dias != 1 else ''})"
            avisos.append(Aviso(f, texto))
            f = replace(f, aviso_30=marca)
        nuevas.append(f)
    return avisos, nuevas


# ---------- consultas ----------

def _cuando(f: Fila, dia: date) -> str:
    dias = f.dias_restantes(dia)
    if dias is None:
        return f.vencimiento or "sin fecha"
    if dias < 0:
        return f"{f.vencimiento} (vencido hace {-dias} día{'s' if dias != -1 else ''})"
    if dias == 0:
        return f"{f.vencimiento} (HOY)"
    return f"{f.vencimiento} (en {dias} día{'s' if dias != 1 else ''})"


def consultar(filas: list[Fila], dia: date, filtro: str, desde: date | None = None,
              hasta: date | None = None, titular: str = "") -> str:
    def normal(t: str) -> str:
        return re.sub(r"[^a-z0-9]", "", t.lower())

    if titular:
        filas = [f for f in filas if normal(titular) in normal(f.titular)]

    if filtro == "vencidos":
        titulo = "Documentos vencidos"
        elegidas = [f for f in filas if f.estado(dia) == VENCIDO]
    elif filtro == "por_vencer":
        titulo = f"Documentos que vencen en los próximos {DIAS_AVISO_PREVIO} días"
        elegidas = [f for f in filas if f.estado(dia) in (VENCE_HOY, POR_VENCER)]
    elif filtro == "falta_fecha":
        titulo = "Documentos sin fecha de vencimiento cargada"
        elegidas = [f for f in filas if f.estado(dia) == FALTA_FECHA]
    elif filtro == "rango" and desde and hasta:
        titulo = f"Documentos que vencen entre el {escribir_fecha(desde)} y el {escribir_fecha(hasta)}"
        elegidas = [f for f in filas if f.fecha and desde <= f.fecha <= hasta]
    else:
        titulo = "Vencimientos"
        elegidas = [f for f in filas if f.fecha]

    if titular:
        titulo += f" ({titular})"
    if not elegidas:
        return f"*{titulo}*\nNo hay ninguno 🙌"
    elegidas.sort(key=lambda f: (f.fecha or date.max, f.titular))
    lineas = [f"• {f.titular} – {f.documento}: {_cuando(f, dia)}" for f in elegidas]
    return f"*{titulo}*\n" + "\n".join(lineas)
