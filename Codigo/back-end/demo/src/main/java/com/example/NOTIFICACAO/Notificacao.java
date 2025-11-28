// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel

package com.example.NOTIFICACAO;

public class Notificacao {
    private int id;
    private String mensagem;
    private String dataEnvio;
    private String cuidadorEmail;
    private String pacienteEmail;
    private String tipo;
    private boolean lida;

    public Notificacao() {}

    // Construtor 
    public Notificacao(int id, String mensagem, String dataEnvio, String cuidadorEmail, String pacienteEmail, String tipo, boolean lida) {
        this.id = id;
        this.mensagem = mensagem;
        this.dataEnvio = dataEnvio;
        this.cuidadorEmail = cuidadorEmail;
        this.pacienteEmail = pacienteEmail;
        this.tipo = tipo;
        this.lida = lida;
    }

    // Getters e Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getDataEnvio() {
        return dataEnvio;
    }

    public void setDataEnvio(String dataEnvio) {
        this.dataEnvio = dataEnvio;
    }

    public String getCuidadorEmail() {
        return cuidadorEmail;
    }

    public void setCuidadorEmail(String cuidadorEmail) {
        this.cuidadorEmail = cuidadorEmail;
    }

    public String getPacienteEmail() {
        return pacienteEmail;
    }

    public void setPacienteEmail(String pacienteEmail) {
        this.pacienteEmail = pacienteEmail;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }
}