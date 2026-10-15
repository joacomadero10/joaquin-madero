import os

os.environ.update({
    "WHATSAPP_TOKEN": "token-falso",
    "WHATSAPP_PHONE_NUMBER_ID": "111",
    "WHATSAPP_VERIFY_TOKEN": "verificame",
    "WHATSAPP_APP_SECRET": "secreto",
    "NUMEROS_AUTORIZADOS": "5491144367063",
})
os.environ.setdefault("ANTHROPIC_API_KEY", "clave-falsa")
os.environ.update({
    "CLAVE_ADMIN": "admin123",
    "URL_PUBLICA": "https://bot.ejemplo.com",
    "GOOGLE_CLIENT_ID": "cliente",
    "GOOGLE_CLIENT_SECRET": "secreto-google",
})
