// Trabalho Interdisciplinar Back-End. Desenvolvido por: Gabriel Ferreira, Gabriel Carvalho e Kayky Gabriel 

let perfilSelecionado = null;

// Funcao para selecionar o perfil
function selecionarPerfil(perfil) {
  document.querySelectorAll('.perfil').forEach(p => {
    p.classList.remove('ativo');
  });

  document.getElementById(perfil).classList.add('ativo');
  perfilSelecionado = perfil;

  document.getElementById('botao-continuar').disabled = false;
}

// Funcao para ir ao cadastro conforme o perfil escolhido
function continuarParaCadastro() {
  if (perfilSelecionado === 'paciente') {
    window.location.href = 'cadastro_paciente.html';
  } else if (perfilSelecionado === 'medico') {
    window.location.href = 'cadastro_cuidador.html';
  }
}