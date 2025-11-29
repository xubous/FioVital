// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

// Cadastro + Painel do Paciente com Custom Vision - VERSAO COM SIMULACAO (sem dependencia do Arduino)
(function () {
  const API_BASE = 'http://localhost:4567';
  const CUSTOM_VISION_API = 'http://localhost:4567/analisar-bpm';

  let currentBPM = 0;
  let historicoBPM = [];
  let ultimoStatusAnormal = false;
  let notificationContainer = null;
  let ultimaPrevisaoIA = null;
  let statusAtualIA = "Aguardando analise";

  // FUNCAO DE SIMULACAO DE BPM
  function simularBPM() {
    const chance = Math.random();
    
    if (chance < 0.80) {
      // 80% chance: BPM normal (60-100)
      return 60 + Math.floor(Math.random() * 41);
    } else if (chance < 0.95) {
      // 15% chance: BPM elevado (100-140)
      return 100 + Math.floor(Math.random() * 41);
    } else {
      // 5% chance: BPM baixo (40-60)
      return 40 + Math.floor(Math.random() * 21);
    }
  }

  // notificacoes
  function inicializarNotificacoes() {
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
  }

  // mostrando a notificacao na tela
  function mostrarNotificacao(tipo, titulo, mensagem) {
    inicializarNotificacoes();

    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;

    notification.innerHTML = `
      <div class="notification-content">
        <h4 class="notification-title">${titulo}</h4>
        <p class="notification-message">${mensagem}</p>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">X</button>
      <div class="notification-progress"></div>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('removing');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 5000);
  }

  // sessao
  function salvarSessao(paciente) {
    localStorage.setItem("paciente", JSON.stringify(paciente));
    localStorage.setItem("pacienteId", paciente.id);
    localStorage.setItem("pacienteEmail", paciente.email);
  }

  function obterSessao() {
    const p = localStorage.getItem("paciente");
    return p ? JSON.parse(p) : null;
  }

  function handleFatal(msg) {
    alert("Sessao expirada ou erro: " + msg);
    window.location.href = "../views/login.html";
  }

  // cadastro do paciente
  const form = document.getElementById('form-paciente');
  if (form) {
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const enderecoInput = document.getElementById('endereco');
    const historicoMedicoInput = document.getElementById('historicoMedico');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (senhaInput.value !== confirmarSenhaInput.value) {
        alert('As senhas nao conferem');
        return;
      }

      const paciente = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        telefone: telefoneInput.value.trim(),
        dataNascimento: dataNascimentoInput?.value.trim() || '',
        endereco: enderecoInput?.value.trim() || '',
        historicoMedico: historicoMedicoInput.value.trim(),
        senha: senhaInput.value.trim()
      };

      try {
        const res = await fetch(`${API_BASE}/paciente`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paciente)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || "Erro no cadastro");

        const id = data.pacienteId || data.id;
        if (!id) throw new Error("Backend nao retornou ID");

        salvarSessao({ ...paciente, id });

        alert("Cadastro realizado com sucesso");
        window.location.href = "../views/paciente.html";

      } catch (err) {
        alert("Erro: " + err.message);
      }
    });
  }

  // header do paciente
  document.addEventListener('DOMContentLoaded', async () => {
    const nomeContainer = document.querySelector('.user-details h3');
    const emailContainer = document.querySelector('.user-details p');
    const btnLogout = document.querySelector('.logout-btn');

    if (btnLogout) btnLogout.addEventListener('click', logout);
    if (!nomeContainer && !emailContainer) return;

    const sessao = obterSessao();
    if (!sessao) return handleFatal("Sessao expirada.");

    try {
      const res = await fetch(`${API_BASE}/paciente/${sessao.id}`);
      const data = await res.json();

      const pacienteAtual = (res.ok && data.paciente) ? data.paciente : sessao;
      atualizarHeader(pacienteAtual);
      salvarSessao(pacienteAtual);

    } catch (err) {
      atualizarHeader(sessao);
    }

    function atualizarHeader(paciente) {
      nomeContainer.textContent = paciente.nome || "Paciente";
      emailContainer.textContent = paciente.email || "";
    }

    inicializarMonitoramentoCardiaco();
  });

  // botao para sair da conta e voltar para pagina de login
  function logout() {
    localStorage.removeItem("paciente");
    localStorage.removeItem("pacienteId");
    localStorage.removeItem("pacienteEmail");
    window.location.href = "../views/login.html";
  }

  // Analise com Custom Vision
  async function analisarComIA() {
    if (historicoBPM.length < 7) {
      statusAtualIA = "Coletando dados";
      atualizarStatusIA();
      return;
    }

    try {
      const response = await fetch(CUSTOM_VISION_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sequencia: historicoBPM
        })
      });

      const resultado = await response.json();

      if (resultado.sucesso) {
        ultimaPrevisaoIA = resultado;
        const previsao = resultado.previsao;
        const probabilidade = resultado.probabilidadePercentual.toFixed(1);

        statusAtualIA = interpretarPrevisao(previsao, probabilidade);
        atualizarStatusIA();

        if (previsao.toLowerCase().includes('anormal') ||
            previsao.toLowerCase().includes('bradicardia') ||
            previsao.toLowerCase().includes('taquicardia')) {

          mostrarNotificacao(
            'warning',
            'IA detectou anomalia',
            `Padrao identificado: ${previsao} (${probabilidade}% de confianca)`
          );
        }

      } else {
        statusAtualIA = "Erro na analise";
        atualizarStatusIA();
      }

    } catch (err) {
      statusAtualIA = "Erro de conexao com IA";
      atualizarStatusIA();
    }
  }

  function interpretarPrevisao(previsao, probabilidade) {
    const prev = previsao.toLowerCase();

    if (prev.includes('normal')) {
      return `Normal (IA: ${probabilidade}%)`;
    } else if (prev.includes('bradicardia')) {
      return `Bradicardia detectada (IA: ${probabilidade}%)`;
    } else if (prev.includes('taquicardia')) {
      return `Taquicardia detectada (IA: ${probabilidade}%)`;
    } else if (prev.includes('anormal')) {
      return `Padrao anormal (IA: ${probabilidade}%)`;
    } else {
      return `${previsao} (${probabilidade}%)`;
    }
  }

  function atualizarStatusIA() {
    const statusIAElement = document.getElementById("statusIA");
    if (statusIAElement) {
      statusIAElement.textContent = statusAtualIA;

      if (statusAtualIA.includes('Normal')) {
        statusIAElement.style.color = "#10b981";
      } else if (statusAtualIA.includes('Bradicardia') || statusAtualIA.includes('Taquicardia')) {
        statusIAElement.style.color = "#ef4444";
      } else if (statusAtualIA.includes('anormal')) {
        statusIAElement.style.color = "#f59e0b";
      } else {
        statusIAElement.style.color = "#6b7280";
      }
    }
  }

  // monitoramento com SIMULACAO
  async function atualizar() {
    try {
      // SIMULACAO: Gerar BPM ao inves de buscar do ESP32
      const bpmGerado = simularBPM();

      historicoBPM.push(bpmGerado);

      if (historicoBPM.length > 7) {
        historicoBPM.shift();
      }

      const soma = historicoBPM.reduce((acc, val) => acc + val, 0);
      const media = Math.round(soma / historicoBPM.length);

      currentBPM = media;

      const bpmElement = document.getElementById("bpm") || document.getElementById("currentBPM");
      if (bpmElement) {
        bpmElement.textContent = currentBPM;
      }

      let status = (currentBPM >= 60 && currentBPM <= 120) ? "Normal" : "Anormal";

      const statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.textContent = status;
        statusEl.style.color = (status === "Normal") ? "#10b981" : "#ef4444";
      }

      if (historicoBPM.length === 7) {
        await analisarComIA();
      }

      if (status === "Anormal") {
        if (!ultimoStatusAnormal) {
          if (currentBPM < 60) {
            mostrarNotificacao(
              'danger',
              'Batimento Abaixo',
              `Seus batimentos estao abaixo do normal: ${currentBPM} BPM`
            );
          } else if (currentBPM > 120) {
            mostrarNotificacao(
              'warning',
              'Batimento acima',
              `Seus batimentos estao acima do normal: ${currentBPM} BPM`
            );
          }
        }

        ultimoStatusAnormal = true;

        const paciente = obterSessao();
        if (paciente) {
          const cuidadorId = localStorage.getItem("cuidadorResponsavelId") || 1;

          let tipoAlerta = currentBPM > 120 ? "TAQUICARDIA" : "BRADICARDIA";
          let mensagemAlerta = currentBPM > 120
            ? "Batimentos acima do normal"
            : "Batimentos abaixo do normal";

          if (ultimaPrevisaoIA) {
            mensagemAlerta += ` (IA: ${ultimaPrevisaoIA.previsao} - ${ultimaPrevisaoIA.probabilidadePercentual.toFixed(1)}%)`;
          }

          const alerta = {
            pacienteId: paciente.id,
            cuidadorId: parseInt(cuidadorId),
            bpm: currentBPM,
            tipo: tipoAlerta,
            mensagem: mensagemAlerta
          };

          fetch(`${API_BASE}/alerta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alerta)
          }).catch(() => {});
        }
      } else {
        if (ultimoStatusAnormal) {
          mostrarNotificacao(
            'success',
            'Batimentos Normalizados',
            `Seus batimentos voltaram ao normal: ${currentBPM} BPM`
          );
        }
        ultimoStatusAnormal = false;
      }

    } catch (err) {
      console.error("Erro na simulacao:", err);
    }
  }

  // carregar notificacoes
  async function carregarNotificacoes() {
    const paciente = obterSessao();
    if (!paciente || !paciente.email) return;

    const container = document.getElementById("alertas-recentes");
    if (!container) return;

    try {
      const url = `${API_BASE}/notificacoes/paciente/${encodeURIComponent(paciente.email)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.erro || "Erro ao carregar notificacoes");
      }

      const notificacoes = data.notificacoes || [];

      container.innerHTML = `<h3 class="sidebar-title">Notificacoes</h3>`;

      if (notificacoes.length === 0) {
        container.innerHTML += `
          <p style="color: #666; font-size: 14px; text-align: center; padding: 20px;">
            Nenhuma notificacao recente
          </p>
        `;
        return;
      }

      notificacoes.forEach((notif) => {
        const item = document.createElement("div");
        item.classList.add("alert-item");
        item.classList.add(!notif.lida ? "warning" : "info");

        const dataFormatada = new Date(notif.dataEnvio).toLocaleString("pt-BR", {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        item.innerHTML = `
          <div class="alert-content">
            <h4>${notif.tipo || 'Notificacao'}</h4>
            <p>${notif.mensagem}</p>
            <div class="alert-time">${dataFormatada}</div>
            ${!notif.lida ? '<span style="font-size: 12px; color: #f59e0b; font-weight: bold;">Nova</span>' : ''}
          </div>
        `;

        if (!notif.lida) {
          item.style.cursor = 'pointer';
          item.addEventListener('click', async () => {
            await marcarComoLida(notif.id);
            item.classList.remove('warning');
            item.classList.add('info');
            const novaSpan = item.querySelector('span');
            if (novaSpan) novaSpan.remove();
          });
        }

        container.appendChild(item);
      });

    } catch (err) {
      container.innerHTML = `
        <h3 class="sidebar-title">Notificacoes</h3>
        <p style="color: #ef4444; font-size: 14px; text-align: center; padding: 20px;">
          Erro ao carregar notificacoes: ${err.message}
        </p>
      `;
    }
  }

  async function marcarComoLida(notificacaoId) {
    try {
      await fetch(`${API_BASE}/notificacao/${notificacaoId}/marcar-lida`, {
        method: "PUT"
      });
    } catch (err) {}
  }

  // inicializar monitoramento
  function inicializarMonitoramentoCardiaco() {
    console.log("Iniciando monitoramento cardiaco (MODO SIMULACAO)");
    inicializarNotificacoes();
    atualizar();
    setInterval(atualizar, 2000);
    setTimeout(() => {
      carregarNotificacoes();
    }, 1000);
    setInterval(carregarNotificacoes, 10000);
    setInterval(analisarComIA, 14000);
  }

})();