// server.js
// Servidor local simples para receber dados do ESP32/ESP8266

const express    = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Permitir JSON no corpo da requisição
app.use(bodyParser.json());

// Rota para receber os dados enviados pelo ESP
app.post("/data", (req, res) => {
  const data = req.body;
  console.log("======================================");
  console.log("  Dados recebidos do ESP32S2:");
  console.log(data);
  console.log("======================================\n");
  res.send(" Dados recebidos com sucesso!");
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
});
