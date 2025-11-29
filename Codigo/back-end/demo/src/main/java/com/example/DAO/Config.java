package com.example.DAO;

import io.github.cdimascio.dotenv.Dotenv;

public class Config {
    private static final Dotenv dotenv = Dotenv.configure()
                                               .ignoreIfMissing() // evita crash se não achar
                                               .load();

    private static final boolean PROD = System.getenv("DB_URL") != null;

    // Banco de dados
    public static final String DB_URL  = PROD ? System.getenv("DB_URL") : dotenv.get("DB_URL");
    public static final String DB_USER = PROD ? System.getenv("PGUSER") : dotenv.get("PGUSER");
    public static final String DB_PASS = PROD ? System.getenv("PGPASSWORD") : dotenv.get("PGPASSWORD");

    // Custom Vision
    public static final String ENDPOINT = PROD ? System.getenv("ENDPOINT") : dotenv.get("ENDPOINT");
    public static final String PROJECT_ID = PROD ? System.getenv("PROJECT_ID") : dotenv.get("PROJECT_ID");
    public static final String PUBLISHED_NAME = PROD ? System.getenv("PUBLISHED_NAME") : dotenv.get("PUBLISHED_NAME");
    public static final String PREDICTION_KEY = PROD ? System.getenv("PREDICTION_KEY") : dotenv.get("PREDICTION_KEY");

    // Porta do Spark
    public static final int PORT = Integer.parseInt(PROD ? System.getenv("PORT") != null ? System.getenv("PORT") : "4567" : dotenv.get("PORT", "4567"));
}
