FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY Codigo/back-end/demo/ .
RUN mvn -DskipTests clean package

FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
