// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

// Login de paciente ou cuidador
(function() {
  const API_BASE = 'http://localhost:4567';

  // Verificacao automatica de sessao 
  document.addEventListener('DOMContentLoaded', () => {
    const cuidador = localStorage.getItem("cuidador");
    const paciente = localStorage.getItem("paciente");

    if (cuidador) {
      console.log("Sessao de cuidador detectada. Redirecionando");
      window.location.href = "../views/cuidador.html";
      return;
    }

    if (paciente) {
      console.log("Sessao de paciente detectada. Redirecionando");
      window.location.href = "../views/paciente.html";
      return;
    }
  });

  // Login 
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const senha = document.getElementById("senha").value.trim();
      const tipo = document.getElementById("tipo").value; 
      const mensagem = document.getElementById("mensagem");

      mensagem.textContent = "Verificando";

      try {
        const response = await fetch(`${API_BASE}/login/${tipo}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok && data.status === "ok") {
          const usuario = data[tipo];

          // Cuidador 
          if (tipo === "cuidador") {
            localStorage.setItem("cuidador", JSON.stringify(usuario));
            localStorage.setItem("cuidadorId", usuario.id);
            localStorage.setItem("cuidadorEmail", usuario.email);
            window.location.href = "../views/cuidador.html";
            return;
          }

          // Paciente 
          if (tipo === "paciente") {
            localStorage.setItem("paciente", JSON.stringify(usuario));
            localStorage.setItem("pacienteId", usuario.id);
            localStorage.setItem("pacienteEmail", usuario.email);
            window.location.href = "../views/paciente.html";
            return;
          }

        } else {
          mensagem.textContent = data.erro || "Email ou senha incorretos.";
        }

      } catch (err) {
        console.error("Erro no login:", err);
        mensagem.textContent = "Erro ao conectar ao servidor.";
      }
    });
  }

})();
