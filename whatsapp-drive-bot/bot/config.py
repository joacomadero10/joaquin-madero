"""Configuración del bot. Todo sale de variables de entorno: nada de claves en el código."""
import os


def _obligatoria(nombre: str) -> str:
    valor = os.environ.get(nombre, "").strip()
    if not valor:
        raise RuntimeError(
            f"Falta la variable de entorno {nombre}. "
            "Cargala en el panel del hosting (ver docs/2-hosting.md)."
        )
    return valor


def solo_digitos(numero: str) -> str:
    return "".join(c for c in numero if c.isdigit())


def normalizar_numero(numero: str) -> str:
    """Deja el número en el formato que usa WhatsApp.

    En Argentina WhatsApp usa 549 + área + número (sin el 15). Si alguien
    carga el número sin el 9 (54 11 ...) lo completamos para que coincida.
    """
    digitos = solo_digitos(numero)
    if digitos.startswith("54") and not digitos.startswith("549") and len(digitos) == 12:
        digitos = "549" + digitos[2:]
    return digitos


MATRICULAS_POR_DEFECTO = "LVCCO,LVCPL,LVIYQ,LVFUF,LVFVZ,LVKMA,LVKAX,LVJQW"


class Config:
    def __init__(self) -> None:
        self.whatsapp_token = _obligatoria("WHATSAPP_TOKEN")
        self.phone_number_id = _obligatoria("WHATSAPP_PHONE_NUMBER_ID")
        self.verify_token = _obligatoria("WHATSAPP_VERIFY_TOKEN")
        self.app_secret = _obligatoria("WHATSAPP_APP_SECRET")
        self.numeros_autorizados = {
            normalizar_numero(n)
            for n in _obligatoria("NUMEROS_AUTORIZADOS").split(",")
            if solo_digitos(n)
        }
        self.graph_version = os.environ.get("GRAPH_API_VERSION", "v23.0")

        # --- Google (Drive) ---
        self.google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
        self.google_client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
        # Se obtiene una sola vez entrando a /google/conectar (ver docs/3-google.md)
        self.google_refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN", "").strip()
        # Clave que inventás vos para que nadie más pueda usar /google/conectar
        self.clave_admin = os.environ.get("CLAVE_ADMIN", "").strip()
        # Dirección pública del bot, ej: https://bot-bairesfly.up.railway.app
        self.url_publica = os.environ.get("URL_PUBLICA", "").strip().rstrip("/")

        # --- Estructura de carpetas ---
        self.carpeta_raiz = os.environ.get("CARPETA_RAIZ", "BAIRES FLY").strip()
        self.matriculas = [
            m.strip().upper()
            for m in os.environ.get("MATRICULAS", MATRICULAS_POR_DEFECTO).split(",")
            if m.strip()
        ]

        # --- Claude ---
        # La clave ANTHROPIC_API_KEY la lee directamente la librería de Anthropic.
        self.claude_modelo = os.environ.get("CLAUDE_MODELO", "claude-opus-5-5")

    @property
    def google_listo(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret and self.google_refresh_token)

    def esta_autorizado(self, numero: str) -> bool:
        return normalizar_numero(numero) in self.numeros_autorizados
