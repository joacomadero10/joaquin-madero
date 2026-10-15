# Bot de WhatsApp · Documentos BAIRES FLY ✈️

Bot de WhatsApp que gestiona la documentación de los aviones y pilotos de BAIRES FLY guardada en Google Drive.

## Estado
- [x] **Etapa 1**: responde mensajes solo al número autorizado
- [x] **Etapa 2**: crea las carpetas en Drive, da de alta pilotos y envía archivos pedidos en lenguaje natural
- [x] **Etapa 3**: planilla de vencimientos, avisos a las 10 AM (30 días antes y el día que vence) y consultas
- [ ] Etapa 4: actualizar documentos (archiva la versión anterior en "Históricos")

## Guías de configuración
1. [Crear la cuenta de WhatsApp Business API](docs/1-whatsapp-meta.md)
2. [Subir el bot al hosting](docs/2-hosting.md)
3. [Conectar Google Drive](docs/3-google.md)
4. [Clave de la API de Claude](docs/4-claude.md)
5. [Avisos automáticos y planilla de vencimientos](docs/5-avisos.md)

Cuando terminemos todas las etapas, este README va a tener el manual de uso completo y la sección "qué hacer si algo falla".

## Para desarrolladores
```bash
pip install -r requirements-dev.txt
python -m pytest
```
Las variables de entorno están documentadas en `.env.example`.
