# Guía 4 · Conseguir la clave de la API de Claude

Claude es el que "entiende" tus mensajes. Por ejemplo, de *"pasame el seguro del cco"*
saca que querés el seguro del avión LVCCO.

## Pasos
1. Entrá a **https://platform.claude.com** y creá una cuenta. Podés usar tu Gmail.
2. Andá a **Billing** (Facturación) y cargá crédito con tarjeta. El mínimo es USD 5 y te dura meses.
3. Recomendado: en **Limits** poné un **límite de gasto mensual** (ej. USD 10). Así nunca
   te llevás una sorpresa.
4. Andá a **API Keys → Create Key**. Nombre: `bot-bairesfly`.
5. Copiá la clave: empieza con `sk-ant-` y **se muestra una sola vez**.
6. En el hosting agregá la variable **`ANTHROPIC_API_KEY`** con esa clave. Guardá.

## Probar
Por WhatsApp, mandale al bot:
- *"hola"* → te explica qué puede hacer
- *"agregá al piloto Juan Pérez"* → crea la carpeta `PILOTOS/Juan Perez`
- *"qué documentos tiene el CCO?"* → te lista lo que hay en la carpeta LVCCO
- *"mandame el seguro del LV-CCO"* → te manda el archivo (primero subí alguno a Drive)

## ¿Cuánto cuesta?
Cada mensaje que le mandás al bot es una consulta a Claude. Por defecto el bot usa el
modelo más inteligente, **Claude Opus 5.5**:

| Modelo (variable `CLAUDE_MODELO`) | Costo aprox. por mensaje | 300 mensajes/mes |
|---|---|---|
| `claude-opus-5-5` (por defecto) | ~USD 0,02 | ~USD 6 |
| `claude-haiku-5-5` (más barato) | ~USD 0,001 | menos de USD 0,50 |

Para pedidos simples como los de este bot, Haiku suele andar bien. Si querés ahorrar,
agregá la variable `CLAUDE_MODELO=claude-haiku-5-5`. Si notás que entiende peor, la borrás
y vuelve a Opus.

## Problemas comunes
| Síntoma | Qué hacer |
|---|---|
| El bot contesta "Uy, algo falló de mi lado" | Mirá los logs del hosting. `authentication_error` → la clave está mal copiada. `credit balance is too low` → cargá crédito. |
| Te manda un documento que no es | Revisá que el nombre del archivo en Drive diga claramente qué es (ver "Cómo nombrar los archivos" en la guía 3). |
