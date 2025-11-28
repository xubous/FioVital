// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel

package com.example.DAO;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.example.CUIDADOR.Cuidador;

public class CuidadorDao 
{

    public static Dao dao = new Dao( );

    // cadastro Cuidador

    public int cadastrarCuidador(String nome, String email, String telefone, String dataNascimento, String especialidade, String senha) throws SQLException {
        String sql = "INSERT INTO cuidador (nome, email, telefone, data_nascimento, especialidade, senha) " +
                     "VALUES (?, ?, ?, ?, ?, ?) RETURNING id";

        try (Connection conn = dao.connect();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, nome);
            ps.setString(2, email);
            ps.setString(3, telefone);
            ps.setString(4, dataNascimento);
            ps.setString(5, especialidade);
            ps.setString(6, senha);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getInt("id");
            } else {
                return -1;
            }
        }
    }

    public Cuidador getCuidadorPorId(int id) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE id = ?";
        try (Connection conn = dao.connect();
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
                    rs.getString("senha")
                );
            }
        }
        return null;
    }

    public Cuidador getCuidadorPorEmail(String email) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE email = ?";
        try (Connection conn = dao.connect();
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
                    rs.getString("senha")
                );
            }
        }
        return null;
    }

    public List<Cuidador> getTodosCuidadores() throws SQLException {
        List<Cuidador> lista = new ArrayList<>();
        String sql = "SELECT * FROM cuidador ORDER BY id";

        try (Connection conn = dao.connect();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Cuidador c = new Cuidador(
                    rs.getString("nome"),
                    rs.getString("email"),
                    rs.getString("telefone"),
                    rs.getString("data_nascimento"),
                    rs.getString("especialidade"),
                    rs.getString("senha")
                );
                lista.add(c);
            }
        }
        return lista;
    }

    public Cuidador loginCuidador(String email, String senha) throws SQLException {
        String sql = "SELECT * FROM cuidador WHERE email = ? AND senha = ?";
        try (Connection conn = dao.connect();
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
                    rs.getString("senha")
                );
            }
        }
        return null;
    }

    
}