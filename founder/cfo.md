# Nota del CFO (leer primero)

- **El margen:** cada restaurante en Profesional (ARS 46.200) deja **ARS 40.382 por mes** después de sus propios costos (87%). Con 25 restaurantes pagando, el margen es **80%**. El punto de equilibrio es **3 restaurantes pagando** (cubren los ARS 90.000 fijos).
- **Ojo con ese 80%:** es alto porque **vos no cobrás sueldo**. A plan (25 restaurantes), la ganancia mensual es 25 × 40.382 − 90.000 = **ARS 919.550**, y eso es, en la práctica, tu sueldo. El negocio "es rentable" solo si ese número te alcanza para vivir.
- **La línea a mirar: la rampa de clientes.** Hoy hay 0 pagos. La rampa supone +2 restaurantes pagando por mes (22 en el mes 12). Es una estimación: el panel dio 30% de "pruebo" en restaurantes ya interesados, y el fundador puede acompañar ~2 primeros servicios por fin de semana. Con la mitad de esa rampa (`--volume 0.5`) el año 1 deja ARS 1.585.212 en vez de 4.250.424 y la inversión se recupera en el mes 9 en vez del 6.
- **Caja: necesitás ARS 599.236 antes de que se pague solo** (ARS 648.854 si la rampa sale a la mitad). **Es más que los menos de ARS 500.000 que tenés.** O recortás el arranque (publicidad 250.000 → 150.000) o conseguís los primeros 3 pagos antes de gastar en publicidad, que es lo que pidió el directorio.
- **Tres formas de mejorar el margen** (con la herramienta):
  1. **Vender el plan Salón (ARS 64.900) al restaurante de más de 25 mesas:** margen a plan 85% y equilibrio con 2 restaurantes; año 1 sube a ARS 6.718.824 si todos fueran Salón.
  2. **No vender solo Básico:** si todos pagaran ARS 23.100, el equilibrio sube a 6 restaurantes y el año 1 baja a ARS 1.201.224. El cliente objetivo es el Profesional o el Salón; el Básico es una puerta de entrada, no el negocio.
  3. **Bajar la comisión de cobro** (estimada en 6%): cobrar con débito automático o transferencia mensual ahorraría hasta ARS 2.772 por restaurante-mes (verificar tarifas reales).
- **Inflación:** todo está en pesos nominales y el precio congelado 6 meses no está modelado. Con inflación, la escena de "precio −10%" (año 1 ARS 3.640.584) es la más realista para esos meses.
- **Condiciones del directorio sobre plata:** "costo por cliente medido" → **parcial**: está estimado (ARS 25.000 por alta entre setup y primer servicio), falta medirlo con los primeros 3. "Cuántos clientes cubren los costos" → **sí: 3**.
- Los ingresos son antes de impuestos. No es asesoramiento financiero, impositivo ni legal: un contador tiene que revisar la categoría de monotributo (o el régimen que corresponda), IVA e ingresos brutos antes de cobrar.

> Lectura del reporte: con `days_per_month = 1`, donde dice "a day" leé **"por mes"**, y "restaurante-mess a day" son **restaurantes pagando ese mes**.

# Unit economics: Comandy (suscripción mensual por restaurante). Con days_per_month = 1, cada 'día' del reporte es un MES y cada unidad es un restaurante pagando ese mes.

Every number below comes from the input file. Nothing is looked up or guessed.

## One restaurante-mes

| line | per restaurante-mes |
| --- | ---: |
| Price | $46,200.00 |
| Comisión de cobro de la suscripción (estimado 6% del precio; verificar tarifa de Mercado Pago) | -$2,772.00 |
| Viaje y tiempo de setup/capacitación prorrateado (estimado ARS 15.000 por alta / 12 meses de vida) | -$1,250.00 |
| Primer servicio acompañado por el fundador (estimado ARS 10.000 de movilidad por alta / 12 meses) | -$833.00 |
| Garantía de devolución del primer mes pago (estimado: 25% la pide; 0,25 x 46.200 / 12) | -$963.00 |
| Soporte por WhatsApp en horario nocturno y fines de semana (fundador sin sueldo) | -$0.00 |
| **Contribution** (what each restaurante-mes leaves to pay the fixed costs) | **$40,382.00** (87%) |

## The margin that matters

Fixed costs: $90,000 a month (Infraestructura: servidores, base de datos, dominio, herramientas (tope informado por el fundador) $50,000, Monotributo e impuestos fijos (estimado; confirmar categoría con un contador) $40,000).

- **Break-even: 3 restaurante-mess a day.** Below that you lose money every month.
- **Profit margin at your plan** (25 a day): **80%** of every sale, after every cost.
- Capacity: 40 a day.

## Year 1, month by month

| month | restaurante-mess a day | revenue | profit | cumulative (after $500,000 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$90,000 | -$590,000 |
| 2 | 2 | $92,400 | -$9,236 | -$599,236 |
| 3 | 4 | $184,800 | $71,528 | -$527,708 |
| 4 | 6 | $277,200 | $152,292 | -$375,416 |
| 5 | 8 | $369,600 | $233,056 | -$142,360 |
| 6 | 10 | $462,000 | $313,820 | $171,460 |
| 7 | 12 | $554,400 | $394,584 | $566,044 |
| 8 | 14 | $646,800 | $475,348 | $1,041,392 |
| 9 | 16 | $739,200 | $556,112 | $1,597,504 |
| 10 | 18 | $831,600 | $636,876 | $2,234,380 |
| 11 | 20 | $924,000 | $717,640 | $2,952,020 |
| 12 | 22 | $1,016,400 | $798,404 | $3,750,424 |

- **Year 1 operating profit: $4,250,424** on $6,098,400 of revenue.
- After the $500,000 startup spend: $3,750,424.
- Startup money earned back: month 6.
- Cash you need before it pays for itself: **$599,236**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 80% | 3 | $4,250,424 |
| Price -10% | 77% | 3 | $3,640,584 |
| Volume -20% | 78% | 3 | $3,184,339 |
| Unit costs +15% | 78% | 3 | $4,135,228 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
