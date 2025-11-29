package com.example.DAO;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import com.example.CUIDADOR.Cuidador;
import com.example.NOTIFICACAO.Notificacao;
import com.example.PACIENTE.Paciente;
import io.github.cdimascio.dotenv.Dotenv;

public class Dao {

    private static final Dotenv dotenv = Dotenv.configure()
                                                .filename(".env")
                                                .ignoreIfMissing()
                                                .load();

    private static final String user = dotenv.get("PGUSER");
    private static final String password = dotenv.get("PGPASSWORD");
    private static final String url = dotenv.get("DB_URL"); // ex: jdbc:postgresql://<host>.neon.tech/neondb

    /** Conecta ao Neon usando Properties e SSL */
    public Connection connect() throws SQLException {
        try {
            Properties props = new Properties();
            props.setProperty("user", user);
            props.setProperty("password", password);
            props.setProperty("ssl", "true");
            props.setProperty("sslmode", "require");

            Connection conn = DriverManager.getConnection(url, props);
            System.out.println("✅ CONEXÃO ESTABELECIDA COM SUCESSO!");
            return conn;

        } catch (SQLException e) {
            System.err.println("❌ ERRO NA CONEXÃO:");
            System.err.println("Mensagem: " + e.getMessage());
            System.err.println("SQLState: " + e.getSQLState());
            System.err.println("ErrorCode: " + e.getErrorCode());
            e.printStackTrace();
            throw e;
        }
    }

    // ===================== PACIENTE =====================

    public boolean atualizarPaciente(int id, String nome, String email, String telefone,
                                     String dataNascimento, String endereco, String historicoMedico) throws SQLException {
        String sql = "UPDATE paciente SET nome = ?, email = ?, telefone = ?, data_nascimento = ?, endereco = ?, historico_medico = ? WHERE id = ?";
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, endereco);
            ps.setString(6, historicoMedico);
            ps.setInt(7, id);

            return ps.executeUpdate() > 0;
        }
    }

    public int cadastrarPaciente(String nome, String email, String telefone,
                                 String dataNascimento, String endereco,
                                 String historicoMedico, String senha) throws SQLException {
        String sql = "INSERT INTO paciente (nome, email, telefone, data_nascimento, endereco, historico_medico, senha) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id";

        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, endereco);
            ps.setString(6, historicoMedico);
            ps.setString(7, senha);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("id");
            else return -1;
        }
    }

    public Paciente getPacientePorId(int id) throws SQLException {
        String sql = "SELECT * FROM paciente WHERE id = ?";
        try (Connection conn = connect();
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
        try (Connection conn = connect();
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
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Paciente(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("endereco"),
                        rs.getString("historico_medico"),
                        rs.getString("senha")));
            }
        }
        return lista;
    }

    // ===================== CUIDADOR =====================

    public int cadastrarCuidador(String nome, String email, String telefone,
                                 String dataNascimento, String especialidade, String senha) throws SQLException {
        String sql = "INSERT INTO cuidador (nome, email, telefone, data_nascimento, especialidade, senha) " +
                     "VALUES (?, ?, ?, ?, ?, ?) RETURNING id";

        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, especialidade);
            ps.setString(6, senha);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("id");
            else return -1;
        }
    }

    public Cuidador getCuidadorPorId(int id) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE id = ?";
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return new Cuidador(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("especialidade"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    public Cuidador getCuidadorPorEmail(String email) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE email = ?";
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return new Cuidador(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("especialidade"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    public List<Cuidador> getTodosCuidadores() throws SQLException {
        List<Cuidador> lista = new ArrayList<>();
        String sql = "SELECT * FROM cuidador ORDER BY id";
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Cuidador(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("especialidade"),
                        rs.getString("senha")));
            }
        }
        return lista;
    }

    // ===================== LOGIN =====================

    public Paciente loginPaciente(String email, String senha) throws SQLException {
        String sql = "SELECT * FROM paciente WHERE email = ? AND senha = ?";
        try (Connection conn = connect();
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

    public Cuidador loginCuidador(String email, String senha) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE email = ? AND senha = ?";
        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setString(2, senha);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return new Cuidador(
                        rs.getString("nome"),
                        rs.getString("email"),
                        rs.getString("telefone"),
                        rs.getString("data_nascimento"),
                        rs.getString("especialidade"),
                        rs.getString("senha"));
            }
        }
        return null;
    }

    // ===================== NOTIFICAÇÕES =====================

    public int salvarNotificacao(String pacienteEmail, String cuidadorEmail, String mensagem, String tipo)
            throws SQLException {
        String sql = "INSERT INTO notificacoes (paciente_email, cuidador_email, mensagem, tipo) " +
                     "VALUES (?, ?, ?, ?) RETURNING id";

        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pacienteEmail);
            ps.setString(2, cuidadorEmail);
            ps.setString(3, mensagem);
            ps.setString(4, tipo);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("id");
            else return -1;
        }
    }

    public List<Notificacao> getNotificacoesPaciente(String pacienteEmail) throws SQLException {
        List<Notificacao> lista = new ArrayList<>();
        String sql = "SELECT * FROM notificacoes WHERE paciente_email = ? ORDER BY data_envio DESC";

        try (Connection conn = connect();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(new Notificacao(
                        rs.getInt("id"),
                        rs.getString("mensagem"),
                        rs.getTimestamp("data_envio").toString(),
                        rs.getString("cuidador_email"),
                        rs.getString("paciente_email"),
                        rs.getString("tipo"),
                        rs.getBoolean("lida")));
            }
        }
        return lista;
    }
}
