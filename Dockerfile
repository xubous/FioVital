# --------------------------------------------------------------------------------
# ESTÁGIO 1: BUILD (Compilação com Maven e JDK)
# --------------------------------------------------------------------------------
FROM maven:3.9.5-eclipse-temurin-21 AS build

# 1. Define o diretório de trabalho principal
WORKDIR /app

# 2. Copia a subpasta Codigo/back-end para dentro do /app
COPY Codigo/back-end/ Codigo/back-end/

# 3. Muda o diretório de trabalho para onde o pom.xml está
# C:\git\fiovital\FioVital\Codigo\back-end\demo\pom.xml
WORKDIR Codigo/back-end/demo 

# 4. Roda o Maven. Agora o pom.xml será encontrado!
# O plugin assembly está configurado para empacotar o JAR aqui.
RUN mvn clean install


# --------------------------------------------------------------------------------
# ESTÁGIO 2: RUNTIME (Execução com JRE)
# --------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

# A porta do SparkJava
EXPOSE 4567

# Define o diretório de trabalho final
WORKDIR /app

# *** AQUI ESTÁ A CORREÇÃO: USANDO O NOME EXATO DO ARQUIVO GERADO ***
# O nome do arquivo gerado pelo Maven Assembly Plugin é: demo-1.0-SNAPSHOT-jar-with-dependencies.jar
COPY --from=build /app/Codigo/back-end/demo/target/demo-1.0-SNAPSHOT-jar-with-dependencies.jar app.jar

# Comando principal de execução
ENTRYPOINT ["java", "-jar", "app.jar"]