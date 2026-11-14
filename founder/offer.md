# Oferta: "Viernes sin comandas perdidas" (Programa Primeros 10)

Método: la lente de Ofertas (resumen propio de un marco publicado; no son palabras de su autor). Material: objeciones del panel (`founder/panel-v2/`), quejas de competidores (`founder/competitors.md`), condiciones del directorio (`founder/board.md`) y costos del CFO (`founder/numbers.json`).

## 1. Lista de problemas (en palabras del comprador)

**Antes de comprar**
1. "No conozco a nadie que lo use."
2. "Ya tengo un sistema que mi equipo sabe usar."
3. "No factura con ARCA, voy a pagar dos sistemas."
4. "¿Y si se corta internet un viernes lleno?"
5. "Tengo 12 mesas y el Básico llega a 10."
6. "Tengo más de 20 mesas y me mandan al de 92.400."
7. "El precio en pesos lo van a subir cada mes."
8. "Después aparecen comisiones por el QR o por cobrar."
9. "¿Esta app va a existir en 6 meses?"
10. "Nadie vino a mostrármelo en persona."

**Durante**
11. "No tengo tiempo de capacitar al equipo."
12. "Los mozos rotan; cada nuevo hay que enseñarle de cero."
13. "Los mozos van a sentir que les sacamos la propina o los controlamos."
14. "El celular del mozo se queda sin batería o se traba."
15. "Migrar la carta me cuesta un fin de semana."
16. "Cambiar en plena temporada frena la cocina."
17. "Mis clientes quieren que los atienda un mozo, no un QR."

**Después**
18. "¿Quién me atiende un sábado a las 22?" (queja principal del líder del mercado: soporte 2,4/5)
19. "Si el primer sábado sale mal, lo dejo."
20. "Pago y no sé si me ahorró algo."

## 2. Soluciones, puntuadas

| problema | solución | valor (1-5) | costo (1-5) | ¿entra? |
| --- | --- | ---: | ---: | --- |
| 4 | **Plan B por escrito**: datos del celular en un minuto, y si no, talonario impreso con número de mesa y protocolo de recarga | 5 | 1 | sí |
| 1, 10, 11, 19 | **El fundador se queda tu primer viernes o sábado** (CABA y GBA) | 5 | 2 | sí (solo 10 cupos) |
| 2, 15, 16 | **Usarlo en paralelo con tu sistema durante la prueba**, carta cargada por nosotros | 4 | 1 | sí |
| 7 | **Precio congelado 6 meses** | 4 | 1 | sí |
| 13, 17 | **El mozo aprueba cada pedido QR y ve sus propinas del turno** (ya existe; contarlo así) | 4 | 0 | sí |
| 8 | **"Sin comisión por pedido"** escrito bien visible | 3 | 0 | sí |
| 5, 6 | **Escalera nueva**: Básico hasta 12 mesas, Profesional hasta 25, **Salón** 64.900 hasta 40 | 4 | 1 | sí |
| 18 | **Soporte viernes y sábado hasta el cierre** en el plan Salón | 4 | 2 | sí |
| 19, 20 | **Garantía**: si tu primer mes pago no te sirvió, te devolvemos ese mes | 4 | 2 | sí |
| 3 | Integración con ARCA | 5 | 5 | **no por ahora**: se dice con honestidad ("seguís facturando con lo que usás hoy") |
| 9 | Exportar tus datos si te vas | 3 | 2 | más adelante |
| 14 | Recomendación de cargador en el salón | 1 | 0 | en la capacitación |

## 3. La oferta armada

- **Núcleo:** "Ningún pedido se pierde un viernes": el mozo toma y aprueba, la cocina lo ve al instante, el dueño ve todo en vivo.
- **Bonus 1, Primer servicio acompañado:** el fundador está con tu equipo tu primer viernes o sábado. *Mata: no conozco a nadie, no tengo tiempo de capacitar, si sale mal lo dejo.*
- **Bonus 2, Plan B incluido:** protocolo y talonario para cortes de internet. *Mata: miedo al corte.*
- **Bonus 3, Precio congelado 6 meses.** *Mata: inflación.*
- **Garantía:** devolución del primer mes pago si no sirvió.
- **Urgencia real:** 10 cupos o hasta el 31/12/2026, lo que pase primero. Sin contadores falsos.
- **Nombre:** Programa Primeros 10, "Viernes sin comandas perdidas".

### Costo (cargado en `founder/numbers.json`, estimado)

- Primer servicio acompañado: ARS 10.000 de movilidad por alta, prorrateado en 12 meses → **ARS 833 por restaurante-mes**.
- Garantía: suponiendo que 1 de cada 4 la pide (estimado conservador), 25% × 46.200 ÷ 12 → **ARS 963 por restaurante-mes**.
- Precio congelado: no cuesta caja; cuesta no poder subir el precio 6 meses con la inflación. Ver what-if de precio −10% en `founder/cfo.md`.
- El fundador puede acompañar como mucho 2 primeros servicios por fin de semana: 10 cupos son unas 5 semanas.

## 4. Ecuación de valor (antes → después)

| elemento | antes | después | qué lo movió |
| --- | ---: | ---: | --- |
| Resultado soñado | 6 | 7 | nombrarlo: "viernes sin comandas perdidas" |
| Probabilidad percibida | 3 | 6 | primer servicio acompañado, plan B, garantía |
| Tiempo al resultado | 7 | 8 | funcionando en 24 h y el primer fin de semana con el fundador |
| Esfuerzo y sacrificio | 6 | 8 | en paralelo con tu sistema, carta cargada, mozo en el centro |

El mayor salto es la **probabilidad percibida**, que era el riesgo número uno del directorio.

## 5. Re-test (mismos 20 compradores, misma semilla 130431)

| | comandy.tech hoy (`panel-v2`) | oferta nueva (`panel`) |
| --- | ---: | ---: |
| **Compran** | **4 de 20 (20%)** | **6 de 20 (30%)** |
| Restaurante mediano | 50% | 62% |
| Café o bodegón chico | 0% | 12% |
| Grupo de locales | 0% | 0% |

- **Nuevos compradores:** P002 (restaurante mediano preocupado por el personal: lo movió el primer servicio acompañado y que cada mozo vea sus propinas) y P010 (café chico: lo movieron el plan B y el fundador presente).
- **Objeciones que bajaron:** desconfianza (4 → 2), capacitación, propinas de los mozos.
- **Objeción que creció: ARCA.** Al decirlo con honestidad, pasó a ser la razón principal de los que ya tienen otro sistema (P001, P004, P009, P014, P016). **El problema ahí no es la oferta, es el producto**: sin facturación, Comandy es un segundo sistema y no un reemplazo.
- **Sin cambios:** los grupos de locales y los bodegones en papel no se mueven. No son el cliente de ahora.

Recordá: compradores simulados; el 30% es un techo y casi todos los "sí" son "pruebo el mes gratis".
