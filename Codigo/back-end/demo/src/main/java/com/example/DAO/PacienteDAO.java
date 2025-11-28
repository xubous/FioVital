// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel

package com.example.DAO;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.example.PACIENTE.Paciente;
import com.example.NOTIFICACAO.Notificacao;

public class PacienteDAO {
    public static Dao dao = new Dao();

    // metodo paciente

    public boolean atualizarPaciente(int id, String nome, String email, String telefone,
            String dataNascimento, String endereco, String historicoMedico) throws SQLException {
        String sql = "UPDATE paciente SET nome = ?, email = ?, telefone = ?, data_nascimento = ?, endereco = ?, historico_medico = ? WHERE id = ?";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, endereco);
            ps.setString(6, historicoMedico);
            ps.setInt(7, id);

            int rowsAffected = ps.executeUpdate();
            return rowsAffected > 0;
        }
    }

    public int cadastrarPaciente(String nome, String email, String telefone,
            String dataNascimento, String endereco,
            String historicoMedico, String senha) throws SQLException {
        String sql = "INSERT INTO paciente (nome, email, telefone, data_nascimento, endereco, historico_medico, senha) "
                +
                "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, endereco);
            ps.setString(6, historicoMedico);
            ps.setString(7, senha);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("id");
            } else {
                return -1;
            }
        }
    }

    public Paciente getPacientePorId(int id) throws SQLException {
        String sql = "SELECT * FROM paciente WHERE id = ?";
        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return new Paciente(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("endereco"),
                        rs.getString("historico_medico"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    public Paciente getPacientePorEmail(String email) throws SQLException {
        String sql = "SELECT * FROM paciente WHERE email = ?";
        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return new Paciente(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("endereco"),
                        rs.getString("historico_medico"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    public List<Paciente> getTodosPacientes() throws SQLException {
        List<Paciente> lista = new ArrayList<>();
        String sql = "SELECT * FROM paciente ORDER BY id";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Paciente p = new Paciente(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("endereco"),
                        rs.getString("historico_medico"),
                        rs.getString("senha"));
                lista.add(p);
            }
        }
        return lista;
    }

    public Paciente loginPaciente(String email, String senha) throws SQLException {
        String sql = "SELECT * FROM paciente WHERE email = ? AND senha = ?";
        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ps.setString(2, senha);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return new Paciente(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("endereco"),
                        rs.getString("historico_medico"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    // metodo notificacao

    public int salvarNotificacao(String pacienteEmail, String cuidadorEmail,
            String mensagem, String tipo) throws SQLException {
        String sql = "INSERT INTO notificacoes (paciente_email, cuidador_email, mensagem, tipo) " +
                "VALUES (?, ?, ?, ?) RETURNING id";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, pacienteEmail);
            ps.setString(2, cuidadorEmail);
            ps.setString(3, mensagem);
            ps.setString(4, tipo);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("id");
            } else {
                return -1;
            }
        }
    }

    public List<Notificacao> getNotificacoesPaciente(String pacienteEmail) throws SQLException {
        List<Notificacao> lista = new ArrayList<>();
        String sql = "SELECT * FROM notificacoes WHERE paciente_email = ? ORDER BY data_envio DESC";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, pacienteEmail);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Notificacao notif = new Notificacao();
                notif.setId(rs.getInt("id"));
                notif.setMensagem(rs.getString("mensagem"));
                notif.setDataEnvio(rs.getTimestamp("data_envio").toString());
                notif.setCuidadorEmail(rs.getString("cuidador_email"));
                notif.setPacienteEmail(rs.getString("paciente_email"));
                notif.setTipo(rs.getString("tipo"));
                notif.setLida(rs.getBoolean("lida"));
                lista.add(notif);
            }
        }
        return lista;
    }

    // marcar como lido
    public boolean marcarNotificacaoComoLida(int notificacaoId) throws SQLException {
        String sql = "UPDATE notificacoes SET lida = TRUE WHERE id = ?";

        try (Connection conn = dao.connect();
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, notificacaoId);
            int rowsAffected = ps.executeUpdate();

            return rowsAffected > 0;
        }
    }
}