FROM maven:3.9.5-eclipse-temurin-21 AS build

WORKDIR /app

COPY Codigo/back-end/ .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

EXPOSE 4567

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]