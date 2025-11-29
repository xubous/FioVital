// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel

package com.example.MAIN;

import static spark.Spark.*;
import com.example.DAO.CuidadorDao;
import com.example.DAO.PacienteDAO;
import com.example.CUIDADOR.Cuidador;
import com.example.PACIENTE.Paciente;
import com.example.NOTIFICACAO.Notificacao;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;
import io.github.cdimascio.dotenv.Dotenv;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;

public class Main {

    private static final Dotenv dotenv = Dotenv.configure()
                                                .filename(".env" )
                                               .ignoreIfMissing() // evita crash se não achar (opcional)
                                               .load();           // carrega do classpath

    // Configurações do Custom Vision
    public static final String ENDPOINT = dotenv.get("ENDPOINT");
    public static final String PROJECT_ID = dotenv.get("PROJECT_ID");
    public static final String PUBLISHED_NAME = dotenv.get("PUBLISHED_NAME");
    public static final String PREDICTION_KEY = dotenv.get("PREDICTION_KEY");

    public static void main(String[] args) {

        int porta = Integer.parseInt(dotenv.get("PORT", "4567"));

        // DAOs
        CuidadorDao cuidadorDao = new CuidadorDao();
        PacienteDAO pacienteDao = new PacienteDAO();

        Gson gson = new Gson();

        port(porta);

        System.out.println("  FIOVITAL API + CUSTOM VISION");

        before((req, res) -> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        });

        options("/*", (req, res) -> "OK");

        // CUSTOM VISION ENDPOINTS

        // monitoramento
        get("/health", (req, res) -> {
            res.type("application/json");
            JsonObject health = new JsonObject();
            health.addProperty("status", "online");
            health.addProperty("message", "FioVital funcionando");
            return gson.toJson(health);
        });

        // Endpoint para analisar sequencia de BPM com IA
        post("/analisar-bpm", (req, res) -> {
            res.type("application/json");

            try {
                System.out.println("\nNova requisicao de analise BPM recebida");

                JsonObject requestBody = JsonParser.parseString(req.body()).getAsJsonObject();
                JsonArray sequenciaJson = requestBody.getAsJsonArray("sequencia");

                if (sequenciaJson == null || sequenciaJson.size() == 0) {
                    res.status(400);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("sucesso", false);
                    erro.addProperty("erro", "Sequencia de BPM nao fornecida ou vazia");
                    return gson.toJson(erro);
                }

                // Converter JsonArray para array
                int[] sequenciaBPM = new int[sequenciaJson.size()];
                for (int i = 0; i < sequenciaJson.size(); i++) {
                    sequenciaBPM[i] = sequenciaJson.get(i).getAsInt();
                }

                // Analisar sequencia com Custom Vision
                JsonObject resultado = analisarSequenciaBPM(sequenciaBPM);

                System.out.println("Analise concluida e enviada ao cliente\n");
                return gson.toJson(resultado);

            } catch (Exception e) {
                System.out.println("Erro ao processar analise: " + e.getMessage());
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("sucesso", false);
                erro.addProperty("erro", "Erro ao processar requisicao: " + e.getMessage());
                return gson.toJson(erro);
            }
        });

        // endpoints do paciente

        // atualizar paciente
        put("/paciente/:id", (req, res) -> {
            res.type("application/json");
            try {
                int id = Integer.parseInt(req.params(":id"));
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                boolean sucesso = pacienteDao.atualizarPaciente(
                        id,
                        data.get("nome"),
                        data.get("email"),
                        data.get("telefone"),
                        data.get("dataNascimento"),
                        data.get("endereco"),
                        data.get("historicoMedico"));

                if (sucesso) {
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.addProperty("mensagem", "Paciente atualizado com sucesso");
                    return gson.toJson(resposta);
                } else {
                    res.status(404);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Paciente nao encontrado");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // buscar paciente por ID
        get("/paciente/:id", (req, res) -> {
            res.type("application/json");
            try {
                int id = Integer.parseInt(req.params(":id"));
                Paciente paciente = pacienteDao.getPacientePorId(id);

                if (paciente != null) {
                    paciente.setSenha(null);
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.add("paciente", gson.toJsonTree(paciente));
                    return gson.toJson(resposta);
                } else {
                    res.status(404);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Paciente nao encontrado");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // buscar paciente por e-mail
        get("/paciente/email/:email", (req, res) -> {
            res.type("application/json");
            try {
                String email = req.params(":email");
                Paciente paciente = pacienteDao.getPacientePorEmail(email);

                if (paciente != null) {
                    paciente.setSenha(null);
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.add("paciente", gson.toJsonTree(paciente));
                    return gson.toJson(resposta);
                } else {
                    res.status(404);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Paciente nao encontrado");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // criar novo paciente
        post("/paciente", (req, res) -> {
            res.type("application/json");
            try {
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                int id = pacienteDao.cadastrarPaciente(
                        data.get("nome"),
                        data.get("email"),
                        data.get("telefone"),
                        data.get("dataNascimento"),
                        data.get("endereco"),
                        data.get("historicoMedico"),
                        data.get("senha"));

                JsonObject resposta = new JsonObject();
                resposta.addProperty("pacienteId", id);
                return gson.toJson(resposta);

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // login do paciente
        post("/login/paciente", (req, res) -> {
            res.type("application/json");

            try {
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                Paciente paciente = pacienteDao.loginPaciente(
                        data.get("email"),
                        data.get("senha"));

                if (paciente != null) {
                    paciente.setSenha(null);
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.add("paciente", gson.toJsonTree(paciente));
                    return gson.toJson(resposta);
                } else {
                    res.status(401);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Email ou senha incorretos");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // endpoints de cuidadores
        // cadastra um novo cuidador
        post("/cuidador", (req, res) -> {
            res.type("application/json");

            try {
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                int id = cuidadorDao.cadastrarCuidador(
                        data.get("nome"),
                        data.get("email"),
                        data.get("telefone"),
                        data.get("dataNascimento"),
                        data.get("especialidade"),
                        data.get("senha"));

                JsonObject resposta = new JsonObject();
                resposta.addProperty("cuidadorId", id);
                return gson.toJson(resposta);

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // retorna um cuidador pelo ID
        get("/cuidador/:id", (req, res) -> {
            res.type("application/json");

            try {
                int id = Integer.parseInt(req.params(":id"));
                Cuidador cuidador = cuidadorDao.getCuidadorPorId(id);

                if (cuidador != null) {
                    cuidador.setSenha(null);
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.add("cuidador", gson.toJsonTree(cuidador));
                    return gson.toJson(resposta);
                } else {
                    res.status(404);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Cuidador nao encontrado");
                    return gson.toJson(erro);
                }

            } catch (NumberFormatException nfe) {
                res.status(400);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", "ID invalido");
                return gson.toJson(erro);
            }
        });

        // retornando o cuidador procurado na area de login
        post("/login/cuidador", (req, res) -> {
            res.type("application/json");

            try {
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                Cuidador cuidador = cuidadorDao.loginCuidador(
                        data.get("email"),
                        data.get("senha"));

                if (cuidador != null) {
                    cuidador.setSenha(null);
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.add("cuidador", gson.toJsonTree(cuidador));
                    return gson.toJson(resposta);
                } else {
                    res.status(401);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Email ou senha incorretos");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // endpoint notificacao

        // endpoint para enviar notificacao
        post("/notificacao/enviar", (req, res) -> {
            res.type("application/json");

            try {
                Type mapType = new TypeToken<Map<String, String>>() {
                }.getType();
                Map<String, String> data = gson.fromJson(req.body(), mapType);

                String pacienteEmail = data.get("pacienteEmail");
                String cuidadorEmail = data.get("cuidadorEmail");
                String mensagem = data.get("mensagem");
                String tipo = data.get("tipo") != null ? data.get("tipo") : "push";

                if (pacienteEmail == null || cuidadorEmail == null || mensagem == null) {
                    res.status(400);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Dados incompletos");
                    return gson.toJson(erro);
                }

                int notificacaoId = pacienteDao.salvarNotificacao(pacienteEmail, cuidadorEmail, mensagem, tipo);

                if (notificacaoId > 0) {
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.addProperty("mensagem", "Notificacao enviada com sucesso");
                    resposta.addProperty("notificacaoId", notificacaoId);
                    return gson.toJson(resposta);
                } else {
                    res.status(500);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Erro ao salvar notificacao");
                    return gson.toJson(erro);
                }

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // Endpoint para listar notificacoes de um paciente
        get("/notificacoes/paciente/:email", (req, res) -> {
            res.type("application/json");

            try {
                String email = req.params(":email");
                List<Notificacao> notificacoes = pacienteDao.getNotificacoesPaciente(email);

                JsonObject resposta = new JsonObject();
                resposta.addProperty("status", "ok");
                resposta.add("notificacoes", gson.toJsonTree(notificacoes));
                return gson.toJson(resposta);

            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // Endpoint para marcar notificacao como lida
        put("/notificacao/:id/marcar-lida", (req, res) -> {
            res.type("application/json");

            try {
                int notificacaoId = Integer.parseInt(req.params(":id"));

                boolean sucesso = pacienteDao.marcarNotificacaoComoLida(notificacaoId);

                if (sucesso) {
                    JsonObject resposta = new JsonObject();
                    resposta.addProperty("status", "ok");
                    resposta.addProperty("mensagem", "Notificacao marcada como lida");
                    return gson.toJson(resposta);
                } else {
                    res.status(404);
                    JsonObject erro = new JsonObject();
                    erro.addProperty("erro", "Notificacao nao encontrada");
                    return gson.toJson(erro);
                }

            } catch (NumberFormatException e) {
                res.status(400);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", "ID invalido");
                return gson.toJson(erro);
            } catch (Exception e) {
                res.status(500);
                JsonObject erro = new JsonObject();
                erro.addProperty("erro", e.getMessage());
                return gson.toJson(erro);
            }
        });

        // Inicializacao
        awaitInitialization();

        System.out.println(" SERVIDOR FIOVITAL INICIADO ");
        System.out.println("---------------------------------");
        System.out.println("Aguardando requisicoes\n");
    }

    // metodos do custom vision

    private static String criarImagemPNG(int[] numeros, String nomeArquivo) {
        BufferedImage imagem = new BufferedImage(500, 120, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = imagem.createGraphics();

        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, 500, 120);

        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("Arial", Font.BOLD, 32));

        int x = 20;
        for (int n : numeros) {
            g2d.drawString(String.valueOf(n), x, 120 / 2 + 10);
            x += 65;
        }

        g2d.dispose();

        try {
            ImageIO.write(imagem, "png", new File(nomeArquivo));
            System.out.println("PNG criado: " + nomeArquivo);
            return nomeArquivo;
        } catch (IOException e) {
            System.out.println("Erro ao criar imagem: " + e.getMessage());
            return null;
        }
    }

    private static JsonObject preverImagemLocal(String caminhoImagem) {
        try {
            File file = new File(caminhoImagem);
            if (!file.exists()) {
                System.out.println("Arquivo nao encontrado: " + caminhoImagem);
                return criarRespostaErro("Arquivo nao encontrado");
            }

            byte[] imageData = Files.readAllBytes(file.toPath());
            String urlString = ENDPOINT + PROJECT_ID + "/classify/iterations/" + PUBLISHED_NAME + "/image";

            URI uri = new URI(urlString);
            HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();

            connection.setRequestMethod("POST");
            connection.setRequestProperty("Prediction-Key", PREDICTION_KEY);
            connection.setRequestProperty("Content-Type", "application/octet-stream");
            connection.setDoOutput(true);

            try (OutputStream os = connection.getOutputStream()) {
                os.write(imageData);
            }

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        response.append(line);
                    }

                    JsonObject json = JsonParser.parseString(response.toString()).getAsJsonObject();
                    JsonArray predictions = json.getAsJsonArray("predictions");

                    String melhorTag = "";
                    double melhorProb = 0.0;

                    for (JsonElement elem : predictions) {
                        JsonObject obj = elem.getAsJsonObject();
                        String tag = obj.get("tagName").getAsString();
                        double prob = obj.get("probability").getAsDouble();
                        if (prob > melhorProb) {
                            melhorProb = prob;
                            melhorTag = tag;
                        }
                    }

                    System.out.printf("MELHOR PREVISAO: %s (%.2f%%)\n", melhorTag, melhorProb * 100);

                    JsonObject resultado = new JsonObject();
                    resultado.addProperty("sucesso", true);
                    resultado.addProperty("previsao", melhorTag);
                    resultado.addProperty("probabilidade", melhorProb);
                    resultado.addProperty("probabilidadePercentual", melhorProb * 100);

                    return resultado;
                }

            } else {
                System.out.println("ERRO HTTP: " + responseCode);
                return criarRespostaErro("Erro HTTP: " + responseCode);
            }

        } catch (Exception e) {
            System.out.println("ERRO: " + e.getMessage());
            return criarRespostaErro(e.getMessage());
        }
    }

    private static JsonObject analisarSequenciaBPM(int[] sequenciaBPM) {
        try {
            System.out.println("Analisando sequencia de BPM");
            System.out.print("Sequencia: ");
            for (int bpm : sequenciaBPM) {
                System.out.print(bpm + " ");
            }
            System.out.println();

            String timestamp = String.valueOf(System.currentTimeMillis());
            String nomeArquivo = "bpm_sequence_" + timestamp + ".png";

            String caminhoImagem = criarImagemPNG(sequenciaBPM, nomeArquivo);

            if (caminhoImagem == null) {
                return criarRespostaErro("Erro ao criar imagem da sequencia");
            }

            JsonObject resultado = preverImagemLocal(caminhoImagem);

            JsonArray arrayBPM = new JsonArray();
            for (int bpm : sequenciaBPM) {
                arrayBPM.add(bpm);
            }
            resultado.add("sequencia", arrayBPM);

            try {
                new File(caminhoImagem).delete();
                System.out.println("Arquivo temporario removido");
            } catch (Exception e) {
                System.out.println("Nao foi possivel remover arquivo temporario");
            }

            return resultado;

        } catch (Exception e) {
            System.out.println("Erro ao analisar sequencia: " + e.getMessage());
            return criarRespostaErro("Erro ao analisar sequencia: " + e.getMessage());
        }
    }

    private static JsonObject criarRespostaErro(String mensagem) {
        JsonObject erro = new JsonObject();
        erro.addProperty("sucesso", false);
        erro.addProperty("erro", mensagem);
        return erro;
    }
}