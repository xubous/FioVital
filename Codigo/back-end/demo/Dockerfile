 # --------------------------------------------------------------------------------
# ESTÁGIO 1: BUILD (Compilação com Maven e JDK)
# --------------------------------------------------------------------------------
# Usamos uma imagem que já tem o Maven e o JDK (Java Development Kit) instalados
FROM maven:3.9.5-eclipse-temurin-21 AS build

# Define o diretório de trabalho interno do container.
# Este é o local onde o Render irá compilar seu projeto.
WORKDIR /app/backend

# Copia o código-fonte do seu backend para o container.
# O caminho 'Codigo/back-end' é a pasta onde está seu pom.xml e o código Java.
COPY Codigo/back-end/demo

# Comando para limpar, instalar dependências e compilar o projeto, 
# gerando o "fat JAR" na pasta 'target'.
RUN mvn clean install


# --------------------------------------------------------------------------------
# ESTÁGIO 2: RUNTIME (Execução com JRE)
# --------------------------------------------------------------------------------
# Usamos uma imagem JRE (Java Runtime Environment) menor para a execução.
FROM eclipse-temurin:21-jre-alpine

# Define a porta que o SparkJava usa (será mapeada pelo Render).
EXPOSE 4567

# Define o diretório de trabalho final.
WORKDIR /app

# Copia o arquivo JAR compilado (FioVital-1.0.jar) do estágio 'build' para o estágio 'runtime'.
# Substitua 'FioVital-1.0.jar' pelo nome exato do arquivo JAR gerado pelo seu Maven.
COPY --from=build /app/backend/target/FioVital-1.0.jar app.jar

# Comando principal de execução que o Render irá usar para iniciar sua API.
ENTRYPOINT ["java", "-jar", "app.jar"]