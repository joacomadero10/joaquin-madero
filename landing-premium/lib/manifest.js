/* lib/manifest.js — datos de marca. Unico global: window.__BRAND__.
   Editar este archivo para cambiar textos, precios o roles sin tocar el HTML. */
(function () {
  "use strict";

  window.__BRAND__ = {
    name: "Comandy",
    domain: "comandy.com.ar",
    tagline: "El sistema operativo de tu restaurante",
    email: "hola@comandy.com.ar",
    whatsapp: "https://wa.me/5490000000000",

    nav: [
      { label: "Producto", href: "producto.html" },
      { label: "Precios", href: "precios.html" },
      { label: "Contacto", href: "contacto.html" },
    ],

    // Las 4 pantallas reales del producto (screenshots genuinos, no mockups).
    roles: [
      {
        id: "cliente",
        kicker: "Para el cliente",
        name: "Cliente",
        title: "Pide desde la mesa, sin instalar nada.",
        description:
          "Escanea el código de su mesa, ve el menú actualizado y arma su pedido desde el navegador de su propio celular. Sin apps, sin esperar al mozo para pedir.",
        features: [
          "Menú siempre actualizado, sin reimprimir cartas",
          "Pedido directo a cocina, sin intermediarios",
          "Puede pedir la cuenta desde la mesa",
        ],
        screenshot: "assets/img/screen-cliente.webp",
      },
      {
        id: "cocina",
        kicker: "Para la cocina",
        name: "Cocina",
        title: "Cada pedido, visible al instante.",
        description:
          "Un tablero pensado para verse desde lejos, en una tablet o un TV en la cocina. Pendientes, en preparación y listos, siempre ordenados y con cronómetro por pedido.",
        features: [
          "Aviso sonoro cuando llega un pedido nuevo",
          "Cronómetro que avisa si algo se está demorando",
          "Cero papeles, cero pedidos perdidos",
        ],
        screenshot: "assets/img/screen-cocina.webp",
      },
      {
        id: "mozo",
        kicker: "Para el mozo",
        name: "Mozo",
        title: "Todas las mesas, de un vistazo.",
        description:
          "Una grilla que muestra qué mesa está libre, cuál está ocupada y cuál ya pidió la cuenta. Tocando una mesa se ve todo el pedido y se cierra la cuenta en segundos.",
        features: [
          "Agrega ítems a mano si el cliente lo pide de palabra",
          "Ve el estado de cada plato en tiempo real",
          "Cierra la cuenta con el total a la vista",
        ],
        screenshot: "assets/img/screen-mozo.webp",
      },
      {
        id: "admin",
        kicker: "Para el dueño",
        name: "Admin",
        title: "El negocio, en números reales.",
        description:
          "Carga el menú, genera los códigos QR de cada mesa y mira cuánto se vendió hoy y qué platos se piden más — todo desde el celular o la computadora.",
        features: [
          "Reportes de ventas del día, sin planillas",
          "QR de cada mesa, listos para imprimir",
          "Menú editable en segundos",
        ],
        screenshot: "assets/img/screen-admin-reportes.webp",
      },
    ],

    stats: [
      { value: 4, suffix: "", label: "roles conectados en un solo sistema" },
      { value: 0, suffix: "", label: "apps que el cliente tiene que instalar" },
      { value: 15, suffix: "min", label: "para tener el primer QR listo" },
    ],

    // Casos ilustrativos — reemplazar por testimonios reales una vez que existan.
    testimonials: [
      {
        quote:
          "Antes el mozo corría con la libreta de un lado a otro. Ahora el pedido ya está en cocina cuando el mozo ni se enteró.",
        role: "Dueño de un bodegón de barrio",
      },
      {
        quote:
          "Lo que más nos preocupaba era la carta: la imprimíamos cada vez que subía un precio. Ahora la cambiamos desde el celular.",
        role: "Encargada de una parrilla familiar",
      },
      {
        quote:
          "Saber qué se vendió en el día sin pedirle la planilla a nadie cambia la cabeza con la que cerrás el turno.",
        role: "Dueño de una cervecería",
      },
    ],

    pricing: {
      note: "Precios de referencia — se ajustan según cantidad de mesas y sucursales.",
      tiers: [
        {
          name: "Esencial",
          price: "Consultar",
          period: "por mes",
          description: "Para un local con pocas mesas que quiere empezar sin vueltas.",
          features: [
            "Hasta 10 mesas con QR",
            "Cliente, cocina, mozo y admin",
            "Reportes de ventas del día",
            "Soporte por WhatsApp",
          ],
          cta: "Quiero este plan",
          highlighted: false,
        },
        {
          name: "Completo",
          price: "Consultar",
          period: "por mes",
          description: "Para el local que ya tiene rotación y necesita todo funcionando fino.",
          features: [
            "Mesas ilimitadas",
            "Todo lo del plan Esencial",
            "Reportes históricos",
            "Alta prioridad de soporte",
          ],
          cta: "Quiero este plan",
          highlighted: true,
        },
        {
          name: "Multisucursal",
          price: "Consultar",
          period: "por mes",
          description: "Para cadenas y grupos gastronómicos con más de un local.",
          features: [
            "Todo lo del plan Completo",
            "Múltiples locales, un solo panel",
            "Reportes comparados entre sucursales",
            "Onboarding acompañado",
          ],
          cta: "Hablar con ventas",
          highlighted: false,
        },
      ],
    },

    faqs: [
      {
        q: "¿El cliente tiene que descargar una app?",
        a: "No. Escanea el QR de la mesa y el menú se abre directo en el navegador del celular, sin instalar nada.",
      },
      {
        q: "¿Necesito comprar hardware especial?",
        a: "No. Funciona en el celular de tus mozos, en una tablet en cocina, y en cualquier computadora para el panel de admin. Si ya tenés wifi en el local, alcanza.",
      },
      {
        q: "¿Puedo cargar mi propio menú?",
        a: "Sí, desde el panel de admin cargás categorías y platos en minutos, y los podés editar cuando quieras sin esperar a nadie.",
      },
      {
        q: "¿Qué pasa si se corta internet?",
        a: "Comandy necesita conexión para funcionar (los pedidos viajan en tiempo real a cocina). Si tu local tiene cortes frecuentes, hablemos antes de arrancar.",
      },
    ],
  };
})();
