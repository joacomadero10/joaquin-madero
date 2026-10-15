# Bot de WhatsApp · Documentos BAIRES FLY ✈️

Bot de WhatsApp que gestiona la documentación de los aviones y pilotos de BAIRES FLY guardada en
Google Drive: te manda los archivos que le pedís, lleva el control de vencimientos, te avisa antes
de que venza algo y guarda las versiones nuevas cuando renovás un documento.

**Solo responde a los números autorizados.** A cualquier otro número no le contesta nada.

---

## 🚀 Puesta en marcha (una sola vez)

Seguí las guías en este orden:

| # | Guía | Tiempo |
|---|---|---|
| 1 | [Crear la cuenta de WhatsApp Business API](docs/1-whatsapp-meta.md), pasos 1 a 7 | 30 min |
| 2 | [Subir el bot al hosting](docs/2-hosting.md) (Railway o Render) | 15 min |
| 1 | Volver a la guía 1, pasos 8 y 9: conectar el webhook y mandar "hola" | 5 min |
| 3 | [Conectar Google Drive](docs/3-google.md) | 20 min |
| 4 | [Clave de la API de Claude](docs/4-claude.md) | 5 min |
| 5 | [Avisos automáticos y planilla](docs/5-avisos.md) | 10 min |

Al terminar, en tu Drive vas a tener:

```
BAIRES FLY/
├── LVCCO/  LVCPL/  LVIYQ/  LVFUF/  LVFVZ/  LVKMA/  LVKAX/  LVJQW/
├── PILOTOS/
│   └── Juan Perez/ ...              (una carpeta por piloto)
├── Históricos/
│   └── LVCCO/  Juan Perez/ ...      (versiones anteriores)
└── BAIRES FLY - Vencimientos        (planilla de Google Sheets)
```

---

## 💬 Cómo usarlo

Escribile al bot como le escribirías a una persona. Algunos ejemplos:

### Pedir documentos
- *"mandame el seguro del CCO"*
- *"pasame la licencia y el CMA de Juan Pérez"*
- *"mandame todo lo del LV-KMA"*
- *"¿qué documentos tiene el FUF?"*

### Cargar o renovar un documento
Mandale el archivo (PDF o foto) **con un mensaje** que diga qué es y cuándo vence:
> 📎 *"este es el nuevo seguro del CCO, vence el 15/10/2027"*

El bot:
1. Lo guarda en la carpeta correcta, con un nombre claro: `LVCCO - Seguro.pdf`.
2. Si había una versión anterior, la mueve a `Históricos/LVCCO/` como
   `LVCCO - Seguro (venció 20-10-2026).pdf`.
3. Anota la nueva fecha en la planilla.

Si mandás el archivo sin mensaje, el bot te pregunta qué es. Tenés una hora para contestarle.

### Vencimientos
- *"el CMA de Juan vence el 3/5/2027"* → anota la fecha
- *"la matrícula del CCO no vence"* → la marca como permanente
- *"¿qué tengo vencido?"*
- *"¿qué vence este mes?"* · *"¿qué vence en diciembre?"*
- *"¿qué está por vencer?"* (próximos 30 días)
- *"¿a qué documentos les falta la fecha?"*
- *"pasame la planilla"*

### Avisos automáticos
Todos los días a las **10 AM** el bot revisa la planilla y te avisa por WhatsApp:
- **30 días antes** de cada vencimiento.
- **El día que vence.**

### Pilotos
- *"agregá al piloto Juan Pérez"* → crea su carpeta en `PILOTOS`.

---

## 🧰 Tareas comunes

| Quiero… | Cómo |
|---|---|
| Autorizar otro número | En el hosting, variable `NUMEROS_AUTORIZADOS`: agregalo separado por coma (`5491144367063,5491155555555`). Con el número de prueba de Meta, también tenés que sumarlo a la lista de destinatarios (guía 1, paso 4). Los avisos les llegan a todos los autorizados. |
| Agregar o sacar un avión | Variable `MATRICULAS` (por defecto `LVCCO,LVCPL,LVIYQ,LVFUF,LVFVZ,LVKMA,LVKAX,LVJQW`). El bot crea la carpeta nueva solo. |
| Subir archivos sin WhatsApp | Arrastralos a la carpeta correcta en Drive. Aparecen en la planilla con "Falta fecha" y les cargás la fecha por WhatsApp o en la planilla. |
| Cambiar la hora de los avisos | Variable `HORA_AVISOS` (ej. `9`). |
| Gastar menos en Claude | Variable `CLAUDE_MODELO=claude-haiku-5-5` (ver guía 4). |
| Recuperar una versión vieja | Está en `BAIRES FLY/Históricos/<matrícula o piloto>/`. |
| Pasar a un número de WhatsApp real | Agregá un número en Meta (WhatsApp → Configuración de la API → "Agregar número de teléfono"), verificalo y cambiá `WHATSAPP_PHONE_NUMBER_ID`. La plantilla de avisos hay que crearla en esa cuenta también. |

---

## 🆘 Qué hacer si algo falla

**Primero, dos chequeos rápidos:**
1. Abrí la URL del bot en el navegador. Tiene que decir `{"estado":"ok","google_conectado":true}`.
   - Si no carga, el bot está caído: revisá el hosting (sección "Deployments" o "Events").
   - Si dice `google_conectado: false`, falta `GOOGLE_REFRESH_TOKEN` (guía 3).
2. Mirá los **logs** del hosting:
   - Railway: servicio → Deployments → View Logs.
   - Render: servicio → Logs.

   Los errores aparecen como `ERROR` con una explicación.

| Síntoma | Causa probable | Solución |
|---|---|---|
| El bot no contesta nada | Webhook desconectado o token de WhatsApp vencido | Guía 1, pasos 6 y 8. En los logs: error `190` = token inválido. |
| Contesta "Uy, algo falló de mi lado" | Error con Google o con Claude | Buscá `ERROR` en los logs. `invalid_grant` = repetí la guía 3, pasos 6 y 7. `authentication_error` o `credit balance` = guía 4. |
| Contesta "Todavía no estoy conectado a Google Drive" | Falta `GOOGLE_REFRESH_TOKEN` | Guía 3, pasos 6 y 7. |
| Dejó de funcionar a los 7 días | La app de Google quedó "En prueba" | Guía 3, paso 3.4, y después pasos 6 y 7. |
| No llegan los avisos de las 10 | Plantilla no aprobada o mal configurada | Guía 5. Buscá "Revisión de vencimientos" en los logs. |
| Me manda un documento equivocado | Nombre de archivo confuso | Renombralo en Drive con el formato `MATRÍCULA - Documento`. |
| Guardó un archivo con un nombre o carpeta equivocados | Claude entendió mal | Movelo o renombralo a mano en Drive: la planilla se actualiza sola. |
| Desapareció un documento de la planilla | Se borró o se movió de su carpeta en Drive | Buscalo en Históricos o en la papelera de Drive. |
| En los logs: `131030` | Número no registrado como destinatario de prueba | Guía 1, paso 4. |
| En los logs: "firma inválida" | `WHATSAPP_APP_SECRET` mal copiada | Guía 1, paso 5. |
| Render: el bot tarda 1 minuto en contestar | El bot estaba "dormido" | Revisá el despertador de cron-job.org (guía 2, B2). |

Si nada de esto lo resuelve, copiá las últimas líneas de los logs con `ERROR` y pedí ayuda.
**Antes de compartirlas, revisá que no aparezca ninguna clave.**

---

## 🔒 Seguridad
- Ninguna clave está en el código: todas van en variables de entorno del hosting (lista completa en `.env.example`).
- El bot verifica que cada mensaje venga realmente de Meta (firma `X-Hub-Signature-256`).
- Ignora en silencio cualquier número que no esté en `NUMEROS_AUTORIZADOS`.
- Las páginas de administración (`/google/conectar`, `/tareas/avisos`) piden `CLAVE_ADMIN`.
- Los documentos no se guardan en el servidor: pasan directo entre Drive y WhatsApp.

## 💰 Costos mensuales aproximados
| Servicio | Costo |
|---|---|
| Hosting | Railway ~USD 5 · Render USD 0 |
| WhatsApp (número de prueba) | USD 0 |
| Claude | ~USD 6 con Opus 5.5 · menos de USD 0,50 con Haiku 5.5 (300 mensajes/mes) |
| Google Drive / Sheets | USD 0 |

---

## Para desarrolladores
```bash
pip install -r requirements-dev.txt
python -m pytest
```

| Archivo | Qué hace |
|---|---|
| `bot/main.py` | Servidor web (FastAPI), webhook de WhatsApp y flujo de cada mensaje |
| `bot/interprete.py` | Prompt y llamada a Claude (salida JSON estructurada) |
| `bot/google_drive.py` | Carpetas, listado, descarga, subida y archivo en Históricos |
| `bot/planilla.py` | Lectura y escritura de la Google Sheet |
| `bot/vencimientos.py` | Reglas de estados, avisos y consultas (sin dependencias externas) |
| `bot/avisos.py` | Revisión diaria de las 10 AM y envío de avisos |
| `bot/whatsapp.py` | Envío y descarga de mensajes y archivos con la WhatsApp Cloud API |
| `bot/google_auth.py` | Conexión OAuth con Google desde el navegador |
