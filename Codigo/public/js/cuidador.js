// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

// cuidador.js
const API_BASE = 'http://localhost:4567';
let pacientesEncontrados = [];

// Variaveis globais para o mapa
let mapa = null;
let marcadores = [];
let pacienteSelecionadoMapa = null;

(function() {

  // Inicializacao e Gerenciamento do LocalStorage 
  function carregarPacientesDoLocalStorage() {
    const pacientesSalvos = localStorage.getItem('pacientesCuidador');
    if (pacientesSalvos) {
      pacientesEncontrados = JSON.parse(pacientesSalvos);
      console.log('Pacientes carregados do localStorage:', pacientesEncontrados);
    }
  }

  function salvarPacientesNoLocalStorage() {
    localStorage.setItem('pacientesCuidador', JSON.stringify(pacientesEncontrados));
    console.log('Pacientes salvos no localStorage:', pacientesEncontrados);
  }

  function removerPacienteDoLocalStorage(pacienteId) {
    pacientesEncontrados = pacientesEncontrados.filter(p => p.id !== pacienteId);
    salvarPacientesNoLocalStorage();
  }

  //  Inicializacao do Mapa 
  function inicializarMapa() {
    const coordenadasPadrao = [-14.2350, -51.9253];
    
    mapa = L.map('map').setView(coordenadasPadrao, 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);
    
    console.log("Mapa inicializado");
  }

  //  Geocodificacao (converter endereco em coordenadas) 
  async function geocodificarEndereco(endereco) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          endereco: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error("Erro na geocodificacao:", error);
      return null;
    }
  }

  //  Adicionar marcador no mapa 
  function adicionarMarcador(paciente, coordenadas) {
    removerMarcador(paciente.id);
    
    const marcador = L.marker([coordenadas.lat, coordenadas.lng])
      .addTo(mapa)
      .bindPopup(`
        <div class="gc-popup-paciente">
          <strong>${paciente.nome}</strong><br>
          <small>${paciente.endereco || 'Endereco nao informado'}</small><br>
          <small>Status: ${paciente.status || 'Ativo'}</small>
        </div>
      `);
    
    marcadores.push({
      id: paciente.id,
      marcador: marcador
    });
    
    return marcador;
  }

  //  Remover marcador 
  function removerMarcador(pacienteId) {
    const index = marcadores.findIndex(m => m.id === pacienteId);
    if (index !== -1) {
      mapa.removeLayer(marcadores[index].marcador);
      marcadores.splice(index, 1);
    }
  }

  //  Atualizar localizacao do paciente no mapa 
  async function atualizarLocalizacaoPaciente(paciente) {
    if (!paciente || !paciente.endereco) {
      console.warn("Paciente sem endereco:", paciente);
      return;
    }

    try {
      const coordenadas = await geocodificarEndereco(paciente.endereco);
      
      if (coordenadas) {
        const marcador = adicionarMarcador(paciente, coordenadas);
        
        mapa.setView([coordenadas.lat, coordenadas.lng], 13);
        
        marcador.openPopup();
        
        pacienteSelecionadoMapa = paciente.id;
        
        console.log(`Localizacao de ${paciente.nome} atualizada:`, coordenadas);
      } else {
        console.warn("Nao foi possivel geocodificar o endereco:", paciente.endereco);
        alert("Nao foi possivel localizar o endereco do paciente no mapa");
      }
    } catch (error) {
      console.error("Erro ao atualizar localizacao:", error);
    }
  }

  //  Centralizar mapa em todos os pacientes 
  function centralizarEmTodosPacientes() {
    if (marcadores.length === 0) {
      mapa.setView([-14.2350, -51.9253], 4);
      return;
    }

    // Criar grupo com todos os marcadores
    const grupo = L.featureGroup(marcadores.map(m => m.marcador));
    mapa.fitBounds(grupo.getBounds().pad(0.1));
  }

  //  Funcoes utilitarias 
  function handleFatal(msg) {
    console.error(msg);
    alert("Sessao expirada ou erro: " + msg);
    window.location.href = "../views/login.html";
  }

  //  Sessao 
  function salvarSessao(cuidador) {
    localStorage.setItem("cuidador", JSON.stringify(cuidador));
    localStorage.setItem("cuidadorId", cuidador.id);
    localStorage.setItem("cuidadorEmail", cuidador.email);
  }

  function obterSessao() {
    const c = localStorage.getItem("cuidador");
    return c ? JSON.parse(c) : null;
  }

  //  Buscar paciente por e-mail 
  async function buscarPacientePorEmail(email) {
    console.log("buscarPacientePorEmail chamado com:", email);

    if (!email) {
      alert("Digite um e-mail valido");
      return;
    }

    try {
      const url = `${API_BASE}/paciente/email/${encodeURIComponent(email)}`;
      console.log("Requisicao:", url);

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro ao buscar paciente");

      const paciente = data.paciente || data;
      if (!paciente) throw new Error("Paciente nao encontrado");

      // Comparar pelo e-mail
      const jaExiste = pacientesEncontrados.some(p => p.email === paciente.email);
      if (jaExiste) {
        alert("Paciente ja esta na sua lista");
        return;
      }

      pacientesEncontrados.push(paciente);
      salvarPacientesNoLocalStorage();
      atualizarListaPacientes();

      // Atualizar mapa
      await atualizarLocalizacaoPaciente(paciente);

      alert(`Paciente ${paciente.nome} adicionado com sucesso`);

    } catch (err) {
      console.error("Erro ao buscar paciente:", err);
      alert("Erro ao buscar paciente: " + err.message);
    }
  }

  //  Remover paciente da lista 
  function removerPaciente(pacienteId, event) {
    if (event) {
      event.stopPropagation();
    }

    const paciente = pacientesEncontrados.find(p => p.id === pacienteId);
    if (!paciente) return;

    if (confirm(`Tem certeza que deseja remover ${paciente.nome} da sua lista`)) {
      pacientesEncontrados = pacientesEncontrados.filter(p => p.id !== pacienteId);
      
      // Remover do localStorage
      salvarPacientesNoLocalStorage();
      
      // Remover marcador do mapa
      removerMarcador(pacienteId);
      
      // Atualizar lista
      atualizarListaPacientes();
      
      // Limpar detalhes se o paciente removido era o selecionado
      if (pacienteSelecionadoMapa === pacienteId) {
        limparDetalhesPaciente();
      }
      
      console.log(`Paciente ${paciente.nome} removido`);
    }
  }

  //  Limpar detalhes do paciente 
  function limparDetalhesPaciente() {
    document.getElementById('gc-nome-paciente').textContent = 'Nenhum paciente selecionado';
    document.getElementById('gc-info-paciente').textContent = 'Selecione um paciente para ver os detalhes';
    
    const detalhesDiv = document.getElementById('gc-detalhes-paciente');
    detalhesDiv.style.display = 'none';
    
    pacienteSelecionadoMapa = null;
  }

  //  Atualizar lista de pacientes 
  function atualizarListaPacientes() {
    const ul = document.getElementById('gc-lista-pacientes');
    ul.innerHTML = '';

    if (pacientesEncontrados.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum paciente adicionado';
      li.className = 'gc-paciente-vazio';
      ul.appendChild(li);
      return;
    }

    pacientesEncontrados.forEach(p => {
      const li = document.createElement('li');
      li.classList.add('gc-paciente-item');
      
      const container = document.createElement('div');
      container.className = 'gc-paciente-container';
      
      const nomeSpan = document.createElement('span');
      nomeSpan.textContent = p.nome;
      nomeSpan.className = 'gc-paciente-nome';
      
      const btnRemover = document.createElement('button');
      btnRemover.innerHTML = '🗑️';
      btnRemover.className = 'gc-btn-remover';
      btnRemover.title = 'Remover paciente';
      btnRemover.addEventListener('click', (e) => removerPaciente(p.id, e));
      
      container.appendChild(nomeSpan);
      container.appendChild(btnRemover);
      li.appendChild(container);
      
      li.addEventListener('click', () => selecionarPaciente(p));
      
      ul.appendChild(li);
    });
  }

  //  Selecionar paciente 
  async function selecionarPaciente(paciente) {
    console.log("Paciente selecionado:", paciente);
    
    document.getElementById('gc-nome-paciente').textContent = paciente.nome;
    document.getElementById('gc-info-paciente').textContent = `Paciente selecionado`;
    
    const detalhesDiv = document.getElementById('gc-detalhes-paciente');
    detalhesDiv.style.display = 'block';
    
    document.getElementById('gc-endereco-paciente').textContent = paciente.endereco || 'Endereco nao informado';
    
    document.getElementById('gc-bpm-atual').textContent = paciente.bpm || '84 BPM';
    document.getElementById('gc-ultima-medicao').textContent = paciente.ultimaMedicao || '84,39 segundos';
    document.getElementById('gc-tendencia').textContent = paciente.tendencia || 'Estavel';
    
    await atualizarLocalizacaoPaciente(paciente);
    
    localStorage.setItem('pacienteSelecionado', JSON.stringify(paciente));
  }

  //  Cadastro 
  const form = document.getElementById('form-cuidador');
  if (form) {
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const especialidadeInput = document.getElementById('especialidade');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (senhaInput.value !== confirmarSenhaInput.value) {
        alert('As senhas nao conferem');
        return;
      }

      const cuidador = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        telefone: telefoneInput.value.trim(),
        dataNascimento: dataNascimentoInput?.value.trim() || '',
        especialidade: especialidadeInput.value.trim(),
        senha: senhaInput.value.trim()
      };

      try {
        const res = await fetch(`${API_BASE}/cuidador`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuidador)
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.erro || "Erro no cadastro");

        const id = data.cuidadorId || data.id || null;
        if (!id) throw new Error("Backend nao retornou ID do cuidador");

        salvarSessao({ ...cuidador, id });
        alert("Cadastro realizado com sucesso");
        window.location.href = "../views/cuidador.html";

      } catch (err) {
        console.error("Erro ao cadastrar cuidador:", err);
        alert("Erro ao cadastrar cuidador: " + err.message);
      }
    });
  }

  //  Painel 
  document.addEventListener('DOMContentLoaded', async () => {
    const nomeSpan = document.getElementById('cuidador-nome');
    const emailSpan = document.getElementById('cuidador-email');
    const btnLogout = document.getElementById('btn-logout');
    const btnAdicionar = document.getElementById('btn-adicionar-paciente');

    carregarPacientesDoLocalStorage();

    inicializarMapa();

    if (btnLogout) btnLogout.addEventListener('click', logout);

    if (btnAdicionar) {
      btnAdicionar.addEventListener('click', () => {
        const input = document.getElementById('email-paciente');
        const email = input.value.trim();
        buscarPacientePorEmail(email);
        input.value = ''; 
      });
    }

    const inputEmail = document.getElementById('email-paciente');
    if (inputEmail) {
      inputEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          btnAdicionar.click();
        }
      });
    }

    const sessao = obterSessao();
    if (!sessao) return handleFatal("Sessao expirada.");

    try {
      const res = await fetch(`${API_BASE}/cuidador/${sessao.id}`);
      const data = await res.json();

      const cuidadorAtual = (res.ok && data.cuidador) ? data.cuidador : sessao;
      atualizarHeader(cuidadorAtual);
      salvarSessao(cuidadorAtual);

    } catch (err) {
      console.error("Falha ao buscar dados do cuidador:", err);
      atualizarHeader(sessao);
    }


    atualizarListaPacientes();

    pacientesEncontrados.forEach(paciente => {
      atualizarLocalizacaoPaciente(paciente);
    });

    function atualizarHeader(cuidador) {
      if (nomeSpan) nomeSpan.textContent = cuidador.nome || "—";
      if (emailSpan) emailSpan.textContent = cuidador.email || "—";
    }
  });

  //  Logout 
  function logout() {
    const pacientesSalvos = localStorage.getItem('pacientesCuidador');
    
    localStorage.clear();
    
    if (pacientesSalvos) {
      localStorage.setItem('pacientesCuidador', pacientesSalvos);
    }
    
    window.location.href = "../views/login.html";
  }

  window.acionarEmergencia = function() {
    alert("Acionando emergncia...");
  };

  window.ligarPaciente = function() {
    alert("Ligando para o paciente...");
  };

  window.enviarMensagem = function() {
    alert("Enviando mensagem...");
  };

  window.verHistorico = function() {
    alert("Abrindo historico...");
  };

  window.centralizarMapa = function() {
    centralizarEmTodosPacientes();
  };

  window.atualizarMapa = function() {
    pacientesEncontrados.forEach(paciente => {
      atualizarLocalizacaoPaciente(paciente);
    });
    alert("Mapa atualizado com as ultimas localizacoes");
  };

  // Funcao para limpar todos os pacientes
  window.limparTodosPacientes = function() {
    if (pacientesEncontrados.length === 0) {
      alert("Nao ha pacientes para limpar");
      return;
    }

    if (confirm(`Tem certeza que deseja remover todos os ${pacientesEncontrados.length} pacientes`)) {
      pacientesEncontrados = [];
      salvarPacientesNoLocalStorage();
      atualizarListaPacientes();
      

      marcadores.forEach(m => mapa.removeLayer(m.marcador));
      marcadores = [];
      
      limparDetalhesPaciente();
      
      alert("Todos os pacientes foram removidos");
    }
  };

})();
