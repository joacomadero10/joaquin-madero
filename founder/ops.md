# Operaciones: Comandy

Base: `founder/idea.md`, `founder/offer.md`, `founder/numbers.json` y el código del repo (`backend/`: Node.js + Express + Socket.io + PostgreSQL, corriendo con PM2 en **un solo VPS**). Fundador solo, sin sueldo.

## 1. El ciclo de cada día (y de cada semana)

| cuándo | paso | ¿lo ve el cliente? |
| --- | --- | --- |
| 10:00 | Revisar que el servidor esté arriba, logs de errores de la noche, backup de la base de anoche OK | no |
| 10:30 | Responder WhatsApp de dueños y mozos (dudas, cambios de carta) | **sí** |
| 11:00–14:00 | Desarrollo: arreglos y lo prometido (plan B, mejoras) | no |
| 15:00–18:00 (mar a jue) | Visitas a restaurantes de la zona y demos | **sí** |
| 18:00–19:00 | Altas nuevas: carga de carta, usuarios, QR por mesa | **sí** |
| 19:30–cierre (vie y sáb) | **Guardia de servicio**: celular a mano para soporte; primer servicio acompañado en el local que toque | **sí** |
| lunes | Revisión semanal: números de marketing, fallas de la semana, cobros | no |
| fin de mes | Cobro de suscripciones, factura a cada cliente, seguimiento de los que no pagaron | **sí** |

## 2. Proveedores

No pude abrir las páginas de precios desde esta sesión: **los precios hay que cotizarlos** y, si difieren de `founder/numbers.json`, actualizar y volver a correr el CFO.

| insumo | opciones | qué averiguar |
| --- | --- | --- |
| VPS (servidor) | el proveedor actual; alternativas: DigitalOcean, Hetzner, Hostinger VPS | precio mensual en USD, si factura en pesos, backups incluidos |
| Backups de la base | snapshots del proveedor del VPS, o copia diaria a almacenamiento externo (Backblaze B2, Amazon S3) | costo por GB y retención |
| Monitoreo de caídas | UptimeRobot o Better Stack (tienen plan gratis) | que avise por WhatsApp, Telegram o mail en menos de 5 minutos |
| Cobro de suscripciones | Mercado Pago (suscripciones / débito automático), transferencia bancaria | **comisión real** (en el CFO está estimada en 6%) y plazo de acreditación |
| Facturación a tus clientes | factura electrónica de ARCA (gratis desde su web) | categoría correcta de monotributo |
| WhatsApp | WhatsApp Business (app gratis) | el número 011 4436-7063 ya está en la web |
| Impresión del plan B y folletos | imprenta del barrio | precio de 100 folletos y 10 talonarios numerados |
| Movilidad | transporte público / auto propio | costo real por visita para validar los ARS 15.000 + 10.000 por alta |

**Abiertas:** costo real del VPS y de los backups, comisión real de cobro.

## 3. Personas

**Hoy y hasta ~25 restaurantes: vos solo.** Sin sueldo (dato tuyo). Semana tipo con 10 altas por mes:

| | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| soporte y servidor | 10–11 | 10–11 | 10–11 | 10–11 | 10–11 | 10–11 | guardia por WhatsApp |
| desarrollo | 11–18 | 11–14 | 11–14 | 11–14 | 11–14 | — | — |
| visitas y demos | — | 15–18 | 15–18 | 15–18 | — | — | — |
| altas | — | 18–19 | 18–19 | 18–19 | — | — | — |
| guardia de servicio | — | — | — | — | 19:30–cierre | 19:30–cierre | — |

Son unas 55–60 horas por semana. **El cuello de botella eres vos los viernes y sábados**: no podés acompañar más de 2 primeros servicios por fin de semana ni atender un reclamo en el local A mientras estás en el B.

**Cuándo sumar a alguien:** pasando ~20 restaurantes, o cuando el soporte de fin de semana supere 2 horas por noche. Primer rol: soporte de fin de semana (part-time, viernes y sábado). Sueldo a definir según el convenio que corresponda; las cargas sociales las tiene que calcular un contador.

## 4. Rutinas (cada una entra en una página)

**A. Alta de un restaurante (día 0)**
1. Pedir la carta (foto o PDF), cantidad de mesas, nombres de mozos y cocina.
2. Cargar categorías, platos y precios; generar los QR por mesa.
3. Crear usuarios: admin, cada mozo, cocina.
4. Mandar por WhatsApp la confirmación con fecha de capacitación y del primer servicio.
5. Imprimir los QR y el kit del plan B.

**B. Capacitación y primer servicio (día 1 y primer viernes o sábado)**
1. Capacitación de 1 hora antes del servicio: mozos 30 min (tomar, aprobar QR, cerrar), cocina 20 min (pantalla, marcar listo), dueño 10 min (panel).
2. Pegar al lado de la tablet de cocina la hoja "qué hacer si se corta internet".
3. Primer servicio: llegar 30 min antes, probar el wifi y los datos de cada celular, quedarse hasta el pico.
4. Anotar cada falla en la planilla de fallas, con hora y qué pasó.
5. Al día siguiente: mandar al dueño el resumen (pedidos, tiempos de cocina, fallas y qué se arregla).

**C. Corte de internet en un local (plan B)**
1. Tablet de cocina y mozos pasan a los datos del celular (hotspot de un celular con datos para la tablet).
2. Si tampoco hay datos: el mozo usa el talonario numerado con número de mesa y lo lleva a cocina.
3. Cuando vuelve la conexión, el mozo carga los pedidos del talonario para que cierren las cuentas.
4. El fundador llama al local en menos de 10 minutos si recibió el aviso.

**D. Caída del servidor (afecta a todos los clientes)**
1. El monitor avisa; confirmar en menos de 5 min.
2. Mandar un mensaje a todos los locales activos: "Comandy está caído, usen el talonario. Les aviso cuando vuelve."
3. Reiniciar el proceso con PM2; si no alcanza, revisar la base y el disco.
4. Avisar cuando vuelve y, al día siguiente, explicar qué pasó y qué se cambió.

**E. Reclamo**
1. Responder en menos de 15 minutos en servicio, en menos de 2 horas fuera de servicio.
2. Reconocer, dar el plan B mientras tanto y un plazo concreto.
3. Anotar en la planilla de fallas; contar el arreglo cuando esté.
4. Si piden la garantía, devolver sin discutir y preguntar qué hubiera tenido que pasar.

**F. Cierre de mes (cobro)**
1. Cobrar suscripciones; recordatorio por WhatsApp a los 3 días de atraso.
2. Emitir factura electrónica a cada cliente.
3. Revisar los 3 números de marketing y la planilla de fallas.

## 5. Herramientas

| para qué | herramienta | por qué |
| --- | --- | --- |
| Cobrar | Mercado Pago (suscripciones) o transferencia | los dueños ya lo usan; confirmar comisión |
| Facturar | servicio de factura electrónica de ARCA | gratis y obligatorio |
| Monitoreo | UptimeRobot (plan gratis) | aviso inmediato de caídas |
| Backups | snapshots diarios + copia externa | hoy todo vive en un VPS: es el riesgo técnico número uno |
| CRM mínimo | una planilla (Google Sheets): local, zona, mesas, estado, fecha de demo, prueba, pago | no hace falta nada pago con < 50 clientes |
| Planilla de fallas | Google Sheets | alimenta las mejoras y la condición del directorio |
| Soporte | WhatsApp Business con respuestas rápidas | donde están los dueños |

## 6. Habilitaciones e impuestos (checklist)

Las reglas cambian y dependen del lugar: **confirmá cada punto con el organismo o con un contador/abogado**. No es asesoramiento legal.

- [ ] **Inscripción en ARCA** (monotributo u otro régimen) para poder facturar: arca.gob.ar.
- [ ] **Ingresos brutos** en tu jurisdicción (AGIP en CABA o ARBA en provincia de Buenos Aires), o el régimen simplificado que corresponda.
- [ ] **Marca** en el INPI (clases 9, 42 y 35) antes de invertir en publicidad: ver `founder/brand.md`.
- [ ] **Datos personales:** guardás datos de clientes de tus clientes (pedidos, nombres de mozos). Revisar la Ley 25.326 y la inscripción de bases de datos ante la Agencia de Acceso a la Información Pública.
- [ ] **Términos y condiciones y política de privacidad** en comandy.tech (hoy no aparecen en la web).
- [ ] **Defensa del consumidor para servicios por internet:** revisar si te aplican el "botón de baja" y el "botón de arrepentimiento" y mostrarlos si corresponde.
- [ ] **Garantía:** escribir sus condiciones exactas (qué cuenta como "no te sirvió", plazo, cómo se pide).
- [ ] **Seguro:** consultar responsabilidad civil profesional si un corte le hace perder plata a un cliente; con los términos limitando la responsabilidad.

## 7. Registro de riesgos

| riesgo | probabilidad | impacto | plan |
| --- | --- | --- | --- |
| **Se cae el VPS un viernes a la noche** (un solo servidor para todos) | media | **muy alto**: todos los clientes sin sistema | monitoreo, rutina D, talonario en cada local, a mediano plazo un segundo servidor o proveedor gestionado |
| **Se pierde la base de datos** | baja | **muy alto** | backups diarios fuera del VPS y **probar una restauración** una vez por mes |
| Corte de internet en un local | alta | alto para ese local | rutina C, plan B ya en la oferta |
| Vos te enfermás un fin de semana | media | alto | avisar a los locales con anticipación, rutina D escrita, más adelante soporte part-time |
| Los mozos lo rechazan | media | alto | capacitación de 30 min, primer servicio acompañado, propinas visibles por mozo |
| Te piden ARCA y no lo tenés | **alta** | medio: pierde a quien ya tiene sistema | decirlo de entrada; evaluar integración con un servicio de facturación |
| Un competidor copia lo del mozo | media | medio | el diferencial es el servicio en persona, no la función |
| Morosidad / inflación sobre el precio congelado | media | medio | débito automático, precio congelado solo 6 meses y solo para 10 |
| Reclamo público o mala reseña | media | medio | rutina E; responder rápido y en público |
| Mes flojo de altas (diciembre y enero en gastronomía) | alta | medio | usar esos meses para desarrollo (ARCA, plan B) y referidos |

Sin cambios en `founder/numbers.json`: no aparecieron precios reales distintos. Cuando tengas el costo del VPS, los backups y la comisión de cobro, actualizalo y volvé a correr `/founder-cfo`.
