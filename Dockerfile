# --------------------------------------------------------------------------------
# ESTÁGIO 1: BUILD (Compilação com Maven e JDK)
# --------------------------------------------------------------------------------
FROM maven:3.9.5-eclipse-temurin-21 AS build

# Define o diretório de trabalho principal
WORKDIR /app

# Copia todo o conteúdo da pasta 'Codigo/back-end' (incluindo a subpasta 'demo') 
# para o diretório de trabalho do container.
COPY Codigo/back-end/ Codigo/back-end/

# *** PONTO DE CORREÇÃO CRÍTICO ***
# Muda o diretório de trabalho para onde o pom.xml está (dentro da pasta demo)
WORKDIR Codigo/back-end/demo 

# Roda o Maven. O comando agora encontra o pom.xml nesta pasta!
RUN mvn clean install


# --------------------------------------------------------------------------------
# ESTÁGIO 2: RUNTIME (Execução com JRE)
# --------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

# A porta do SparkJava (4567)
EXPOSE 4567

# Define o diretório de trabalho final
WORKDIR /app

# *** PONTO DE CORREÇÃO CRÍTICO ***
# Copia o JAR compilado. O caminho de origem deve incluir a pasta 'demo'
# Substitua 'FioVital-1.0.jar' pelo nome exato do arquivo JAR gerado pelo seu Maven.
COPY --from=build /app/Codigo/back-end/demo/target/FioVital-1.0.jar app.jar

# Comando principal de execução
ENTRYPOINT ["java", "-jar", "app.jar"]