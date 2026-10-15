# Bot de WhatsApp · Documentos BAIRES FLY ✈️

Bot de WhatsApp que gestiona la documentación de los aviones y pilotos de BAIRES FLY guardada en Google Drive.

## Estado
- [x] **Etapa 1**: responde mensajes solo al número autorizado
- [ ] Etapa 2: enviar archivos desde Drive
- [ ] Etapa 3: planilla de vencimientos, avisos a las 10 AM y consultas
- [ ] Etapa 4: actualizar documentos (archiva la versión anterior en "Históricos")

## Guías de configuración
1. [Crear la cuenta de WhatsApp Business API](docs/1-whatsapp-meta.md)
2. [Subir el bot al hosting](docs/2-hosting.md)

Cuando terminemos todas las etapas, este README va a tener el manual de uso completo y la sección "qué hacer si algo falla".

## Para desarrolladores
```bash
pip install -r requirements-dev.txt
python -m pytest
```
Las variables de entorno están documentadas en `.env.example`.
