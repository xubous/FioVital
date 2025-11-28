// #include <Arduino.h>
// #include <WiFi.h>
// #include <WebServer.h>
// #include <Wire.h>
// #include <MAX30105.h>
// #include <spo2_algorithm.h>

// // CONFIGURACOES DO SENSOR 
// MAX30105 particleSensor;
// #define SDA_PIN 8
// #define SCL_PIN 9

// uint32_t irBuffer[100];
// uint32_t redBuffer[100];
// int32_t spo2 = 0, heartRate = 0;
// int8_t validSPO2 = 0, validHeartRate = 0;

// // CONFIGURACOES DE REDE 
// const char* ssid = "";      
// const char* password = "";

// WebServer server(80);

// // CORS 
// void sendCORS() {
//   server.sendHeader("Access-Control-Allow-Origin", "*");
//   server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
// }

// // Resposta para requisicoes
// void handleOptions() {
//   sendCORS();
//   server.send(204); 
// }

// // SENSOR 
// void coletarDados() {
//   const int bufferLength = 100;

//   for (int i = 0; i < bufferLength; i++) {
//     while (!particleSensor.available()) particleSensor.check();

//     redBuffer[i] = particleSensor.getRed();
//     irBuffer[i]  = particleSensor.getIR();

//     particleSensor.nextSample();
//   }

//   maxim_heart_rate_and_oxygen_saturation(
//     irBuffer, bufferLength, redBuffer,
//     &spo2, &validSPO2, &heartRate, &validHeartRate
//   );
// }

// void handleDados() {
//   sendCORS();
//   coletarDados();

//   String json = "{";
//   json += "\"bpm\":" + String(heartRate) + ",";
//   json += "\"spo2\":" + String(spo2) + ",";
//   json += "\"valid_bpm\":" + String(validHeartRate) + ",";
//   json += "\"valid_spo2\":" + String(validSPO2);
//   json += "}";

//   server.send(200, "application/json", json);
// }

// // SETUP 
// void setup() {
//   Serial.begin(115200);
//   delay(1000);
//   Serial.println("\n=== Iniciando Franzininho WiFi ===");

//   Wire.begin(SDA_PIN, SCL_PIN);

//   if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
//     Serial.println("MAX30102 nao encontrado");
//     while (true) delay(1000);
//   }

//   particleSensor.setup(60, 4, 2, 400, 411, 4096);
//   particleSensor.setPulseAmplitudeRed(0x1F);
//   particleSensor.setPulseAmplitudeIR(0x1F);

//   // Conexao WiFi 
//   WiFi.begin(ssid, password);
//   Serial.print("Conectando ao Wi-Fi");

//   while (WiFi.status() != WL_CONNECTED) {
//     delay(500);
//     Serial.print(".");
//   }

//   Serial.println("\nConectado!");
//   Serial.print("Acesse: http://");
//   Serial.println(WiFi.localIP());
  
//   // Endpoint
//   server.on("/", HTTP_GET, []() {
//     sendCORS();
//     server.send(200, "text/plain", "Servidor do sensor ativo");
//   });

//   // Endpoint
//   server.on("/", HTTP_OPTIONS, handleOptions);

//   // Endpoint de dados
//   server.on("/dados", HTTP_GET, handleDados);

//   // Endpoint OPTIONS CORS
//   server.on("/dados", HTTP_OPTIONS, handleOptions);

//   server.begin();
//   Serial.println("Servidor HTTP iniciado!");
// }

// // LOOP 
// void loop() {
//   server.handleClient();
// }
