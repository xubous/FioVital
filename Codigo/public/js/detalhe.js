// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

// detalhe.js - VERSAO COM SIMULACAO (sem dependencia do Arduino)
const API_URL = 'https://fiovital-1.onrender.com/';
const CUSTOM_VISION_API = 'https://fiovital-1.onrender.com/analisar-bpm';

// Historico local de BPM
let historicoBPM = [];
let chartData = [];
let bpmUpdateInterval;
let ultimoStatusAnormal = false;
let notificationContainer = null;

// Variaveis Custom Vision
let ultimaPrevisaoIA = null;
let statusAtualIA = "Aguardando analise";

// Variaveis globais
let pacienteData = null;
let editMode = false;
let pacienteId = null;
let currentBPM = 72;

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

// Notificacoes

function inicializarNotificacoes() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-width: 420px;
        `;
        document.body.appendChild(notificationContainer);
    }
}

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

function obterSessao() {
    const c = localStorage.getItem("cuidador");
    return c ? JSON.parse(c) : null;
}

function carregarDadosCuidador() {
    try {
        const sessao = obterSessao();
        
        if (sessao) {
            document.getElementById('cuidador-nome').textContent = sessao.nome || 'Cuidador';
            document.getElementById('cuidador-especialidade').textContent = sessao.especialidade || 'Cuidador';
            console.log('Cuidador carregado da sessao:', sessao.nome);
            return;
        }
        
        console.warn('Nenhum cuidador logado encontrado');
        document.getElementById('cuidador-nome').textContent = 'Cuidador';
        document.getElementById('cuidador-especialidade').textContent = 'Cuidador';
        
    } catch (error) {
        console.error('Erro ao carregar dados do cuidador:', error);
        document.getElementById('cuidador-nome').textContent = 'Cuidador';
        document.getElementById('cuidador-especialidade').textContent = 'Cuidador';
    }
}

function getPacienteFromStorage() {
    const pacienteStorage = localStorage.getItem('pacienteSelecionado');
    if (pacienteStorage) {
        return JSON.parse(pacienteStorage);
    }
    return null;
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '-';
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade + ' anos';
}

function formatarTelefone(telefone) {
    if (!telefone) return '-';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    return telefone;
}

function formatarDataParaInput(data) {
    if (!data) return '';
    return data.split('T')[0];
}

async function carregarDadosPaciente() {
    try {
        console.log('Iniciando carregamento de dados do paciente');
        
        let pacienteEmail = null;
        
        try {
            const pacientesResponse = await fetch(`${API_URL}/pacientes`);
            console.log('Status da resposta /pacientes:', pacientesResponse.status);
            
            if (pacientesResponse.ok) {
                const data = await pacientesResponse.json();
                console.log('Dados recebidos:', data);
                
                if (data.pacientes && data.pacientes.length > 0) {
                    pacienteEmail = data.pacientes[0].email;
                    console.log('Email do paciente encontrado:', pacienteEmail);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar lista de pacientes:', error);
        }

        if (!pacienteEmail) {
            const pacienteStorage = getPacienteFromStorage();
            if (pacienteStorage && pacienteStorage.email) {
                pacienteEmail = pacienteStorage.email;
                console.log('Email do paciente do localStorage:', pacienteEmail);
            }
        }

        if (!pacienteEmail) {
            console.warn('Nenhum email de paciente encontrado, usando dados de exemplo');
            carregarDadosExemplo();
            return;
        }

        console.log('Buscando dados do paciente com email:', pacienteEmail);
        const response = await fetch(`${API_URL}/paciente/email/${encodeURIComponent(pacienteEmail)}`);
        console.log('Status da resposta /paciente/email:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Paciente nao encontrado. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados do paciente recebidos:', data);
        
        pacienteData = data.paciente;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        updateElement('paciente-nome-display', pacienteData.nome || 'Nome nao disponivel');
        updateElement('paciente-id', `ID: #${pacienteData.id || 'N/A'}`);
        updateElement('paciente-idade', calcularIdade(pacienteData.dataNascimento));
        updateElement('paciente-telefone-display', formatarTelefone(pacienteData.telefone));
        updateElement('paciente-data-nascimento-display', 
            pacienteData.dataNascimento ? new Date(pacienteData.dataNascimento).toLocaleDateString('pt-BR') : '-');
        updateElement('paciente-endereco-display', pacienteData.endereco || 'Endereco nao cadastrado');
        updateElement('paciente-email-display', pacienteData.email || 'Email nao cadastrado');
        updateElement('paciente-historico-display', pacienteData.historicoMedico || 'Historico medico nao cadastrado');

        const telefone = pacienteData.telefone ? pacienteData.telefone.replace(/\D/g, '') : '';
        updateElement('telefone-paciente', formatarTelefone(pacienteData.telefone));
        
        if (telefone) {
            const btnLigar = document.getElementById('btn-ligar-paciente');
            const btnWhatsapp = document.getElementById('btn-whatsapp-paciente');
            if (btnLigar) btnLigar.href = `tel:${telefone}`;
            if (btnWhatsapp) btnWhatsapp.href = `https://wa.me/55${telefone}`;
        }

        inicializarSimulacaoCardiaca();

    } catch (error) {
        console.error('Erro ao carregar dados do paciente:', error);
        alert('Erro ao carregar informacoes do paciente. Usando dados de exemplo.');
        carregarDadosExemplo();
    }
}

// CUSTOM VISION

async function analisarComIA() {
    if (historicoBPM.length < 7) {
        console.log("Aguardando coletar 7 leituras para analise IA");
        statusAtualIA = "Coletando dados";
        atualizarStatusIA();
        return;
    }

    try {
        console.log("Enviando sequencia para Custom Vision:", historicoBPM);
        
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

            console.log(`Previsao IA: ${previsao} (${probabilidade}%)`);

            statusAtualIA = interpretarPrevisao(previsao, probabilidade);
            atualizarStatusIA();

            atualizarStatusVisualIA(previsao, probabilidade);

            if (previsao.toLowerCase().includes('anormal') || 
                previsao.toLowerCase().includes('bradicardia') || 
                previsao.toLowerCase().includes('taquicardia')) {
                
                mostrarNotificacao(
                    'warning',
                    'IA detectou anomalia',
                    `Padrao identificado: ${previsao} (${probabilidade}% de confianca) - Paciente ${pacienteData?.nome || 'N/A'}`
                );
            }

        } else {
            console.error("Erro na analise IA:", resultado.erro);
            statusAtualIA = "Erro na analise";
            atualizarStatusIA();
        }

    } catch (err) {
        console.error("Erro ao conectar com Custom Vision:", err);
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
    const statusIAElement = document.getElementById("status-ia-text");
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

function atualizarStatusVisualIA(previsao, probabilidade) {
    const statusTextElement = document.getElementById("status-text");
    const nivelRiscoElement = document.getElementById("nivel-risco");
    const tendenciaElement = document.getElementById("tendencia-bpm");
    
    const prev = previsao.toLowerCase();
    
    if (prev.includes('normal')) {
        if (statusTextElement) statusTextElement.textContent = `Normal (IA: ${probabilidade}%)`;
        if (nivelRiscoElement) nivelRiscoElement.textContent = "Baixo";
        if (tendenciaElement) tendenciaElement.textContent = "Estavel";
    } else if (prev.includes('bradicardia')) {
        if (statusTextElement) statusTextElement.textContent = `Bradicardia (IA: ${probabilidade}%)`;
        if (nivelRiscoElement) nivelRiscoElement.textContent = "Alto";
        if (tendenciaElement) tendenciaElement.textContent = "Baixo";
    } else if (prev.includes('taquicardia')) {
        if (statusTextElement) statusTextElement.textContent = `Taquicardia (IA: ${probabilidade}%)`;
        if (nivelRiscoElement) nivelRiscoElement.textContent = "Alto";
        if (tendenciaElement) tendenciaElement.textContent = "Elevado";
    } else if (prev.includes('anormal')) {
        if (statusTextElement) statusTextElement.textContent = `Anormal (IA: ${probabilidade}%)`;
        if (nivelRiscoElement) nivelRiscoElement.textContent = "Moderado";
        if (tendenciaElement) tendenciaElement.textContent = "Irregular";
    }
}

// Funcoes de Simulacao Cardiaca 
function inicializarSimulacaoCardiaca() {
    console.log("Iniciando monitoramento cardiaco com IA (MODO SIMULACAO)");
    atualizarBPM_Simulado(); 
    drawChart();
    bpmUpdateInterval = setInterval(atualizarBPM_Simulado, 2000);
    
    setInterval(analisarComIA, 14000);
    
    window.addEventListener("resize", () => {
        setTimeout(drawChart, 100);
    });
}

// Funcao que simula o ESP32
async function atualizarBPM_Simulado() {
    try {
        // SIMULACAO: Gerar BPM aleatorio
        const bpmGerado = simularBPM();

        historicoBPM.push(bpmGerado);

        if (historicoBPM.length > 10) historicoBPM.shift();

        const soma = historicoBPM.reduce((acc, v) => acc + v, 0);
        const media = Math.round(soma / historicoBPM.length);

        document.getElementById("bpm-atual").textContent = media;

        let statusAnormal = false;
        let tendencia = "Estavel";
        let nivelRisco = "Baixo";
        let statusText = "Monitoramento Normal";

        if (media > 100) {
            statusAnormal = true;
            tendencia = "Elevado";
            nivelRisco = "Alto";
            statusText = "Batimento Elevado";

            if (!ultimoStatusAnormal) {
                let mensagem = `ALERTA: Paciente ${pacienteData?.nome || 'N/A'} com batimento alto BPM: ${media}. Verificacao necessaria`;
                
                if (ultimaPrevisaoIA) {
                    mensagem += ` (IA: ${ultimaPrevisaoIA.previsao} - ${ultimaPrevisaoIA.probabilidadePercentual.toFixed(1)}%)`;
                }
                
                mostrarNotificacao('warning', 'Batimento Elevado', mensagem);
            }
        } else if (media > 90) {
            tendencia = "Elevado";
            nivelRisco = "Moderado";
            statusText = "BPM Elevado";
        } else if (media < 60) {
            statusAnormal = true;
            tendencia = "Baixo";
            nivelRisco = "Alto";
            statusText = "Batimento abaixo do normal";

            if (!ultimoStatusAnormal) {
                let mensagem = `ALERTA: Paciente ${pacienteData?.nome || 'N/A'} com batimento baixo BPM: ${media}. Verificacao necessaria`;
                
                if (ultimaPrevisaoIA) {
                    mensagem += ` (IA: ${ultimaPrevisaoIA.previsao} - ${ultimaPrevisaoIA.probabilidadePercentual.toFixed(1)}%)`;
                }
                
                mostrarNotificacao('danger', 'Batimento abaixo do normal Detectada', mensagem);
            }
        } else if (media < 70) {
            tendencia = "Baixo";
            nivelRisco = "Moderado";
            statusText = "BPM Baixo";
        }

        if (!statusAnormal && ultimoStatusAnormal) {
            let mensagem = `Paciente ${pacienteData?.nome || 'N/A'} voltou ao normal: ${media} BPM. Continue o monitoramento.`;
            
            if (ultimaPrevisaoIA && ultimaPrevisaoIA.previsao.toLowerCase().includes('normal')) {
                mensagem += ` (IA confirma: ${ultimaPrevisaoIA.probabilidadePercentual.toFixed(1)}%)`;
            }
            
            mostrarNotificacao('success', 'Batimentos Normalizados', mensagem);
        }

        ultimoStatusAnormal = statusAnormal;

        if (!ultimaPrevisaoIA || historicoBPM.length < 7) {
            document.getElementById("tendencia-bpm").textContent = tendencia;
            document.getElementById("nivel-risco").textContent = nivelRisco;
            document.getElementById("status-text").textContent = statusText;
        }

        document.getElementById("ultima-medicao").textContent =
            new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        chartData.push({
            time: new Date(),
            bpm: media
        });

        if (chartData.length > 24) chartData.shift();

        drawChart();
        verificarAlertasBPM(media);

        if (historicoBPM.length === 7) {
            await analisarComIA();
        }

    } catch (e) {
        console.warn("Erro na simulacao de BPM:", e);
    }
}

function verificarAlertasBPM(media) {
    const statusSummary = document.getElementById('status-summary');
    const listaStatusCritico = document.getElementById('lista-status-critico');

    const alertas = [];

    if (alertas.length > 0) {
        listaStatusCritico.innerHTML = alertas.map(a => `<li>${a}</li>`).join("");
        statusSummary.style.display = "block";
    } else {
        statusSummary.style.display = "none";
    }
}

function drawChart() {
    const canvas = document.getElementById('heartRateChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    if (chartData.length === 0) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    const bpmValues = chartData.map(d => d.bpm);
    const minBPM = Math.min(...bpmValues) - 5;
    const maxBPM = Math.max(...bpmValues) + 5;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        const value = Math.round(maxBPM - (maxBPM - minBPM) * (i / 5));
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(value + ' BPM', padding - 10, y + 4);
    }
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    chartData.forEach((point, index) => {
        const x = padding + (chartWidth / (chartData.length - 1)) * index;
        const y = padding + chartHeight - ((point.bpm - minBPM) / (maxBPM - minBPM)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    ctx.fillStyle = '#667eea';
    chartData.forEach((point, index) => {
        const x = padding + (chartWidth / (chartData.length - 1)) * index;
        const y = padding + chartHeight - ((point.bpm - minBPM) / (maxBPM - minBPM)) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function carregarDadosExemplo() {
    pacienteData = {
        id: 1,
        nome: 'Rogerio',
        email: 'rogerio@exemplo.com',
        telefone: '11999999999',
        dataNascimento: '1980-01-15',
        endereco: 'Rua Exemplo, 123 - Sao Paulo, SP',
        historicoMedico: 'Paciente com historico de hipertensao controlada.'
    };

    document.getElementById('paciente-nome-display').textContent = pacienteData.nome;
    document.getElementById('paciente-id').textContent = `ID: #${pacienteData.id}`;
    document.getElementById('paciente-idade').textContent = calcularIdade(pacienteData.dataNascimento);
    document.getElementById('paciente-telefone-display').textContent = formatarTelefone(pacienteData.telefone);
    document.getElementById('paciente-data-nascimento-display').textContent = new Date(pacienteData.dataNascimento).toLocaleDateString('pt-BR');
    document.getElementById('paciente-endereco-display').textContent = pacienteData.endereco;
    document.getElementById('paciente-email-display').textContent = pacienteData.email;
    document.getElementById('paciente-historico-display').textContent = pacienteData.historicoMedico;

    const telefone = pacienteData.telefone.replace(/\D/g, '');
    document.getElementById('telefone-paciente').textContent = formatarTelefone(pacienteData.telefone);
    document.getElementById('btn-ligar-paciente').href = `tel:${telefone}`;
    document.getElementById('btn-whatsapp-paciente').href = `https://wa.me/55${telefone}`;

    inicializarSimulacaoCardiaca();
}

// Funcoes para acoes
function sendNotification() {
    document.getElementById('popupOverlay').style.display = 'block';
    document.getElementById('notificationPopup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
    document.getElementById('notificationPopup').style.display = 'none';
}

async function confirmSendNotification() {
    const message = document.getElementById('notificationMessage').value;
    
    if (!message.trim()) {
        alert('Por favor, digite uma mensagem.');
        return;
    }

    if (!pacienteData || !pacienteData.email) {
        alert('Erro');
        return;
    }

    const sessao = obterSessao();
    if (!sessao || !sessao.email) {
        alert('Erro');
        return;
    }

    const checkboxes = document.querySelectorAll('.popup-form input[type="checkbox"]:checked');
    const tipos = Array.from(checkboxes).map(cb => cb.parentElement.textContent.trim()).join(', ');

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        const response = await fetch(`${API_URL}/notificacao/enviar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pacienteEmail: pacienteData.email,
                cuidadorEmail: sessao.email,
                mensagem: message,
                tipo: tipos || 'push'
            })
        });

        const resultado = await response.json();

        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        if (response.ok && resultado.status === 'ok') {
            closePopup();
            
            document.getElementById('notificationMessage').value = '';
            
            mostrarNotificacao(
                'success',
                'Notificacao Enviada',
                `Mensagem enviada com sucesso para ${pacienteData.nome}`
            );
            
            console.log('Notificacao salva com ID:', resultado.notificacaoId);
        } else {
            throw new Error(resultado.erro || 'Erro ao enviar notificacao');
        }

    } catch (error) {
        console.error('Erro ao enviar notificacao:', error);
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        alert('Erro ao enviar notificacao: ' + error.message);
    }
}

function callEmergency() {
    if (confirm('Deseja realmente acionar o SAMU (192)?')) {
        window.location.href = 'tel:192';
    }
}

function addNote() {
    const nota = prompt('Digite sua nota sobre o paciente:');
    if (nota) {
        alert('Nota adicionada com sucesso');
    }
}

function scheduleVisit() {
    alert('Funcionalidade de agendamento em desenvolvimento');
}

function prescribeMed() {
    alert('Funcionalidade de receita em desenvolvimento');
}

function shareData() {
    alert('Funcionalidade de compartilhamento em desenvolvimento');
}

window.addEventListener('DOMContentLoaded', () => {
    inicializarNotificacoes();
    carregarDadosCuidador();
    carregarDadosPaciente();
});

window.addEventListener('beforeunload', () => {
    if (bpmUpdateInterval) {
        clearInterval(bpmUpdateInterval);
    }
});