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

//creacion de preferencia (orden de compra)
app.post("/create_preference", (req, res) => {
  let preference = {
    items: [
      {
        title: req.body.description,
        unit_price: Number(req.body.price),
        quantity: Number(req.body.quantity),
      },
    ],
    back_urls: {
      success: `https://wa.me/541128703125?text=Hola, he realizado la siguiente ${req.body.description}`,
      failure: "",
      pending: "",
    },
    auto_return: "approved",
  };

  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      res.json({
        id: response.body.id,
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

//iniciando el servidor
app.listen(port, () => {
  console.log(`port runing in http://localhost:${port}`);
});
