# Guía 5 · Activar los avisos automáticos de vencimientos

El bot revisa la planilla **todos los días a las 10 AM** (hora de Argentina) y te avisa por WhatsApp:
- **30 días antes** de que venza un documento.
- **El día que vence.**

Si el bot estuvo apagado ese día, o cargaste una fecha cuando ya faltaban menos de 30 días,
te avisa en la siguiente revisión. Cada aviso se manda **una sola vez**.

## ¿Por qué hace falta una "plantilla"?
WhatsApp no deja que un bot te escriba por su cuenta, salvo que le hayas escrito vos en las
últimas 24 horas. Para los avisos automáticos hay que usar un mensaje modelo (**plantilla**)
aprobado por Meta. Se hace una sola vez y la aprobación suele tardar minutos.

> Sin plantilla el bot igual intenta avisarte, pero el aviso solo llega si le escribiste algo
> en las últimas 24 horas.

---

## Paso 1 · Crear la plantilla
1. Entrá a **https://business.facebook.com/wa/manage/message-templates/**
   o, desde la app de Meta Developers: **WhatsApp → Configuración de la API → "Administrar plantillas"**.
   Fijate que arriba esté elegida la cuenta de WhatsApp de prueba.
2. **Crear plantilla**:
   - Categoría: **Utilidad** (Utility)
   - Tipo: **Predeterminado** (Default)
   - Nombre: `aviso_vencimiento`
   - Idioma: **Español (ARG)**
3. En **Cuerpo** (Body), copiá exactamente esto:
   ```
   Aviso de BAIRES FLY ✈️

   El documento {{1}} de {{2}} {{3}}.

   Escribime si querés que te lo mande.
   ```
4. Te va a pedir **ejemplos** para cada variable. Poné:
   - `{{1}}` → `Seguro`
   - `{{2}}` → `LVCCO`
   - `{{3}}` → `vence el 14/11/2026 (en 30 días)`
5. **Enviar para revisión**. Esperá a que el estado diga **Activa / Aprobada**.

## Paso 2 · Avisarle al bot que use la plantilla
En el hosting agregá estas variables y guardá:

| Variable | Valor |
|---|---|
| `PLANTILLA_AVISO` | `aviso_vencimiento` |
| `PLANTILLA_IDIOMA` | `es_AR` |

## Paso 3 (solo si usás Render gratis) · Despertador de las 10 AM
En Railway no hace falta: el bot está siempre prendido y se encarga solo.

En Render, por las dudas de que el bot esté "dormido" justo a las 10, sumá un segundo
cronjob en **cron-job.org**:
- Title: `Avisos vencimientos`
- URL: `https://LA-URL-DEL-BOT/tareas/avisos?clave=TU_CLAVE_ADMIN`
- Schedule: **todos los días a las 10:00**. En "Time zone" elegí `America/Argentina/Buenos_Aires`.

No hay problema si se ejecuta dos veces: cada aviso se manda una sola vez.

---

## La planilla de vencimientos
El bot crea sola la planilla **"BAIRES FLY - Vencimientos"** dentro de la carpeta BAIRES FLY.
Cada documento que subas a Drive aparece ahí automáticamente.

| Columna | Qué es |
|---|---|
| Tipo | Avión o Piloto |
| Titular | Matrícula o nombre del piloto |
| Documento | Nombre del archivo |
| **Vencimiento** | La fecha (`15/10/2027`), `No vence`, o vacío si falta cargarla |
| Estado | Vigente · Por vencer · Vence hoy · Vencido · No vence · Falta fecha |
| Días restantes | Se actualiza todos los días |
| Link | Para abrir el archivo |
| ID archivo, Aviso 30 días, Aviso vencimiento | Uso interno del bot: **no las toques** |

**Cargar fechas.** Lo más fácil es por WhatsApp:
- *"el seguro del CCO vence el 15/10/2027"*
- *"la licencia de Juan Pérez no vence"*

También podés escribir la fecha a mano en la columna **Vencimiento** de la planilla. El bot
toma el cambio la próxima vez que la lea, y como mucho al día siguiente a las 10.

## Consultas por WhatsApp
- *"¿qué tengo vencido?"*
- *"¿qué vence este mes?"* · *"¿qué vence en diciembre?"*
- *"¿qué está por vencer?"* (próximos 30 días)
- *"¿cuándo vence lo del KMA?"*
- *"¿a qué documentos les falta la fecha?"*
- *"pasame la planilla"*

## Problemas comunes
| Síntoma | Qué hacer |
|---|---|
| No llegan los avisos | 1) ¿La plantilla está **Aprobada**? 2) ¿`PLANTILLA_AVISO` está bien escrita? 3) Buscá "Revisión de vencimientos" en los logs, a las 10. |
| En los logs: error `132001` | El nombre o el idioma de la plantilla no coinciden. Revisá `PLANTILLA_AVISO` y `PLANTILLA_IDIOMA`. |
| En los logs: error `131047` | No hay plantilla configurada y pasaron más de 24 horas desde tu último mensaje. Hacé el paso 2. |
| Un documento dice "Falta fecha" | Cargale la fecha por WhatsApp o en la planilla. |
| Quiero que me vuelva a avisar | Borrá las celdas "Aviso 30 días" / "Aviso vencimiento" de esa fila. |
