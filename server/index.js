const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago");

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

//confuguracion de mercadoPago con ACCESS_TOKEN
mercadopago.configure({
  access_token: "",
});

//ruta principal del servidor
app.get("/", function (req, res) {
  res.send("server runing");
});

app.post("/create_preference", (req, res) => {
  // Obtener datos del cuerpo de la solicitud
  const customerName = req.body.customerName;
  const address = req.body.address;
  let optional = req.body.optional.trim();
  const items = req.body.items;
  const total = req.body.price;

  // Verificar si optional está vacío y asignar el mensaje predeterminado
  if (!optional) {
    optional = "Ninguna";
  }

  // Construir el mensaje para WhatsApp
  let successMessage = `Hola, me llamo *${customerName}*, y he realizado la siguiente orden de compra:\n\n`;

  // Agregar detalles de la orden al mensaje
  items.forEach((item) => {
    successMessage += `*${item.product}* (x${item.quantity}) - $*${item.price * item.quantity}*\n\n`;
  });

  successMessage += `*Total: $${total}*\n\n`;
  successMessage += `Requisito/Aclaraciones: *${optional}*\n\n`;
  successMessage += `Dirección de entrega: *${address}*`;

  // Reemplazar espacios en blanco con %20 y saltos de línea con %0A para formatear correctamente el mensaje
  const formattedMessage = encodeURIComponent(successMessage).replace(/%20/g, " ").replace(/%0A/g, "%0A");

  // Configurar la preferencia de Mercado Pago
  let preference = {
    items: [
      {
        title: req.body.description,
        unit_price: Number(req.body.price),
        quantity: Number(req.body.quantity),
      },
    ],
    back_urls: {
      success: `https://wa.me/541128703125?text=${formattedMessage}`,
      failure: "",
      pending: "",
    },
    auto_return: "approved",
  };

  // Crea la preferencia en Mercado Pago
  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      res.json({
        id: response.body.id,
      });
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).send("Error al crear la preferencia de Mercado Pago");
    });
});

//iniciando el servidor
app.listen(port, () => {
  console.log(`port runing in http://localhost:${port}`);
});
