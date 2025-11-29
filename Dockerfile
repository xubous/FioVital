FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /app/backend
COPY Codigo/back-end/demo
RUN mvn clean install
FROM eclipse-temurin:21-jre-alpine
EXPOSE 4567
WORKDIR /app
COPY --from=build /app/backend/target/FioVital-1.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]