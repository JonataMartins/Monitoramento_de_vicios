// Verifica login com JWT - MODIFICADO: Adicionar fallback
async function checarLogin() {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');
  
  // Se não tem nenhum método de autenticação, redireciona
  if (!token && !nomeUsuario) {
    window.location.href = 'login.html';
    return false;
  }

  // Se tem token, verificar se é válido
  if (token) {
    try {
      const response = await fetch('http://localhost:3000/usuario/verificar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Token inválido, tentar usar apenas o nome de usuário
        if (nomeUsuario) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user_id');
          return true; // Permite continuar com autenticação básica
        } else {
          localStorage.clear();
          window.location.href = 'login.html';
          return false;
        }
      }
      return true; // Token válido
    } catch (erro) {
      console.error(erro);
      // Em caso de erro na verificação, tentar com autenticação básica
      if (nomeUsuario) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_id');
        return true;
      } else {
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
      }
    }
  }
  
  return true; // Tem apenas nome de usuário (método antigo)
}

// Função para fazer requisições autenticadas - MODIFICADO: Adicionar fallback
async function fazerRequisicaoAutenticada(url, options = {}) {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');
  
  let config;
  
  if (token) {
    // Tentar com JWT primeiro
    config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
  } else if (nomeUsuario) {
    // Fallback para método antigo (POST com nome_usuario no body)
    const body = options.body ? JSON.parse(options.body) : {};
    body.nome_usuario = nomeUsuario;
    
    config = {
      ...options,
      method: options.method || 'POST', // Método antigo usa POST
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    };
  } else {
    // Não tem autenticação
    localStorage.clear();
    window.location.href = 'login.html';
    throw new Error('Não autenticado');
  }

  const response = await fetch(url, config);
  
  if (response.status === 401 && token) {
    // Token inválido, tentar fallback
    if (nomeUsuario) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_id');
      
      // Refazer a requisição com método antigo
      const body = options.body ? JSON.parse(options.body) : {};
      body.nome_usuario = nomeUsuario;
      
      const fallbackConfig = {
        ...options,
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(body)
      };
      
      const fallbackResponse = await fetch(url, fallbackConfig);
      return fallbackResponse;
    } else {
      localStorage.clear();
      window.location.href = 'login.html';
      throw new Error('Sessão expirada');
    }
  }

  return response;
}

// Variável global para controlar o modo de edição
let editandoHabitoId = null;

// Carrega hábitos - MODIFICADO: Suporte a ambos os métodos
async function carregarHabitos() {
  if (!await checarLogin()) return;

  try {
    const resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito');
    
    if (!resposta.ok) {
      throw new Error('Erro ao buscar hábitos');
    }

    const habitos = await resposta.json();
    preencherCardsHabitos(habitos);
    
  } catch (erro) {
    console.error(erro);
    exibirEstadoVazio();
  }
}

function preencherCardsHabitos(habitos) {
  const cards = document.querySelectorAll('.add-habit-card');
  const emptyState = document.getElementById('emptyState');
  const habitosList = document.getElementById('habitosList');
  
  // Esconder a lista tradicional
  habitosList.innerHTML = '';
  habitosList.style.display = 'none';
  
  // Mostrar os cards
  document.querySelector('.add-habits-cards').style.display = 'grid';
  
  if (!habitos || habitos.length === 0) {
    exibirEstadoVazio();
    return;
  }
  
  // Esconder empty state se há hábitos
  emptyState.style.display = 'none';
  
  // Resetar todos os cards para estado de "adicionar"
  cards.forEach((card, index) => {
    card.innerHTML = `
      <i>📝</i>
      <span>Adicione seu hábito</span>
    `;
    card.onclick = () => abrirModalHabitoParaCard(index);
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled');
  });
  
  // Preencher os cards com os hábitos existentes
  habitos.forEach((habito, index) => {
    if (index < cards.length) {
      const card = cards[index];
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${habito.nome_habito}</h3>
          ${habito.descricao ? `<p>${habito.descricao}</p>` : ''}
          <div class="habit-card-actions">
            <button class="icon-btn small-btn" title="Editar" onclick="editarHabitoCard('${habito._id}', event)">✏️</button>
            <button class="icon-btn small-btn" title="Excluir" onclick="deletarHabitoCard('${habito._id}', event)">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled');
    }
  });
}

function exibirEstadoVazio() {
  const emptyState = document.getElementById('emptyState');
  const habitosList = document.getElementById('habitosList');
  const cardsContainer = document.querySelector('.add-habits-cards');
  
  emptyState.style.display = 'block';
  habitosList.style.display = 'none';
  cardsContainer.style.display = 'grid';
}

// Abrir modal para adicionar hábito em card específico
function abrirModalHabitoParaCard(index) {
  editandoHabitoId = null; // Modo de adição
  document.getElementById('addHabitModal').classList.add('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  
  // Configurar botão para modo de adição
  configurarBotaoSalvar();
}

// Editar hábito a partir do card
async function editarHabitoCard(habitoId, event) {
  event.stopPropagation(); // Impedir que clique propague para o card
  
  try {
    const resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito');
    if (resposta.ok) {
      const habitos = await resposta.json();
      const habito = habitos.find(h => h._id === habitoId);
      
      if (habito) {
        editandoHabitoId = habitoId; // Modo de edição
        
        document.getElementById('habitName').value = habito.nome_habito;
        document.getElementById('habitDescription').value = habito.descricao || '';
        
        // Configurar modal para edição
        const modal = document.getElementById('addHabitModal');
        const saveBtn = document.getElementById('saveHabit');
        
        saveBtn.textContent = 'Atualizar';
        modal.classList.add('active');
      }
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao carregar hábito para edição');
  }
}

function configurarBotaoSalvar() {
  const saveBtn = document.getElementById('saveHabit');
  
  if (editandoHabitoId) {
    saveBtn.textContent = 'Atualizar';
  } else {
    saveBtn.textContent = 'Salvar';
  }
}

// Adicionar/Editar hábito - MODIFICADO: Verificar se está editando ou adicionando
async function adicionarHabito() {
  const nomeHabito = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome para o hábito.');
    return;
  }

  try {
    // Se está editando, chama a função de edição
    if (editandoHabitoId) {
      await editarHabito(editandoHabitoId);
      return;
    }

    // Se não está editando, é uma adição normal
    // Verificar se já atingiu o limite de 3 hábitos
    const resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito');
    if (resposta.ok) {
      const habitosExistentes = await resposta.json();
      if (habitosExistentes.length >= 3) {
        alert('Limite máximo de 3 hábitos atingido!');
        fecharModalHabito();
        return;
      }
    }

    const respostaCriar = await fazerRequisicaoAutenticada('http://localhost:3000/habito/create', {
      method: 'POST',
      body: JSON.stringify({
        nome_habito: nomeHabito,
        descricao: descricao
      })
    });

    if (!respostaCriar.ok) {
      const erro = await respostaCriar.json();
      throw new Error(erro.message);
    }

    alert('Hábito criado com sucesso!');
    fecharModalHabito();
    carregarHabitos();
    
  } catch (erro) {
    console.error(erro);
    alert('Erro ao criar hábito: ' + erro.message);
  }
}


// Função para editar hábito
async function editarHabito(habitoId) {
  const nomeHabito = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;
  const nomeUsuario = localStorage.getItem('nome_usuario');

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome para o hábito.');
    return;
  }

  try {
    const resposta = await fetch(`http://localhost:3000/habito/${habitoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        nome_habito: nomeHabito,
        descricao: descricao
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    alert('Hábito atualizado com sucesso!');
    fecharModalHabito();
    carregarHabitos();
    
  } catch (erro) {
    console.error(erro);
    alert('Erro ao editar hábito: ' + erro.message);
  }
}

// Fechar modal - MODIFICADO: Limpar estado de edição
function fecharModalHabito() {
  document.getElementById('addHabitModal').classList.remove('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  
  // Limpar estado de edição
  editandoHabitoId = null;
  
  // Reconfigurar botão para modo padrão (adição)
  configurarBotaoSalvar();
}

// Deletar hábito
async function deletarHabito(habitoId) {
  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      resposta = await fazerRequisicaoAutenticada(`http://localhost:3000/habito/${habitoId}`, {
        method: 'DELETE'
      });
    } else {
      resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito/delete', {
        method: 'DELETE',
        body: JSON.stringify({
          habito_id: habitoId
        })
      });
    }

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    // Se estava editando o hábito que foi deletado, limpar estado
    if (editandoHabitoId === habitoId) {
      editandoHabitoId = null;
    }

    alert('Hábito excluído com sucesso!');
    carregarHabitos();
    
  } catch (erro) {
    throw erro;
  }
}

// Deletar hábito a partir do card
async function deletarHabitoCard(habitoId, event) {
  event.stopPropagation(); // Impedir que clique propague para o card
  
  if (!confirm('Tem certeza que deseja excluir este hábito?')) return;

  try {
    await deletarHabito(habitoId);
  } catch (erro) {
    console.error(erro);
    alert('Erro ao excluir hábito: ' + erro.message);
  }
}

// Modal de configurações
function abrirModalConfiguracoes() {
  document.getElementById('userName').value = localStorage.getItem('nome_usuario') || 'Usuário';
  document.getElementById('settingsModal').classList.add('active');
}

function fecharModalConfiguracoes() {
  document.getElementById('settingsModal').classList.remove('active');
}

// Trocar senha - MODIFICADO: Suporte a ambos os métodos
async function trocarSenha() {
  const senhaAntiga = prompt('Digite sua senha atual:');
  const senhaNova = prompt('Digite sua nova senha:');
  
  if (!senhaAntiga || !senhaNova) return;
  
  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      // Tentar com JWT (sem nome_usuario no body)
      resposta = await fazerRequisicaoAutenticada('http://localhost:3000/usuario/trocarSenha', {
        method: 'PUT',
        body: JSON.stringify({
          senha_antiga: senhaAntiga,
          senha_nova: senhaNova
        })
      });
    } else {
      // Fallback para método antigo (com nome_usuario no body)
      const nomeUsuario = localStorage.getItem('nome_usuario');
      resposta = await fetch('http://localhost:3000/usuario/trocarSenha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_usuario: nomeUsuario,
          senha_antiga: senhaAntiga,
          senha_nova: senhaNova
        })
      });
    }

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    alert('Senha alterada com sucesso!');
    
  } catch (erro) {
    console.error(erro);
    alert('Erro ao trocar senha: ' + erro.message);
  }
}

// Deletar conta - MODIFICADO: Suporte a ambos os métodos
async function deletarConta() {
  if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) return;

  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      // Tentar com JWT (sem body)
      resposta = await fazerRequisicaoAutenticada('http://localhost:3000/usuario/delete', {
        method: 'DELETE'
      });
    } else {
      // Fallback para método antigo (com nome_usuario no body)
      const nomeUsuario = localStorage.getItem('nome_usuario');
      resposta = await fetch('http://localhost:3000/usuario/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_usuario: nomeUsuario
        })
      });
    }

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    localStorage.clear();
    alert('Conta deletada com sucesso!');
    window.location.href = 'login.html';
    
  } catch (erro) {
    console.error(erro);
    alert('Erro ao deletar conta: ' + erro.message);
  }
}

// Logout - MODIFICADO: Suporte a ambos os métodos
async function logout() {
  try {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Tentar logout com JWT
      await fetch('http://localhost:3000/usuario/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (erro) {
    // Ignora erros no logout
  } finally {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

// Menu perfil
function setupPerfil() {
  const profileMenu = document.getElementById('profileMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const usernameEl = document.getElementById('username');

  usernameEl.textContent = localStorage.getItem('nome_usuario') || 'Usuário';

  profileMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
  });

  window.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) dropdownMenu.classList.remove('active');
  });

  document.getElementById('logout').addEventListener('click', logout);
  document.getElementById('settings').addEventListener('click', () => {
    dropdownMenu.classList.remove('active');
    abrirModalConfiguracoes();
  });
}

// Setup dos cards de adicionar hábito
function setupCardsHabitos() {
  const cards = document.querySelectorAll('.add-habit-card');
  cards.forEach((card, index) => {
    card.addEventListener('click', () => abrirModalHabitoParaCard(index));
  });
}

// Fechar modais ao clicar fora
function setupModais() {
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') {
      fecharModalHabito();
    }
    if (e.target.id === 'settingsModal') {
      fecharModalConfiguracoes();
    }
  });

  // Fechar com botões
  document.getElementById('closeAddHabitModal').addEventListener('click', fecharModalHabito);
  document.getElementById('cancelAddHabit').addEventListener('click', fecharModalHabito);
  document.getElementById('closeSettingsModal').addEventListener('click', fecharModalConfiguracoes);
  
  // Adicionar event listener padrão para o botão salvar
  document.getElementById('saveHabit').addEventListener('click', function() {
    if (editandoHabitoId) {
      editarHabito(editandoHabitoId);
    } else {
      adicionarHabito();
    }
  });
  
  // Configurações
  document.getElementById('changePassword').addEventListener('click', trocarSenha);
  document.getElementById('deleteAccount').addEventListener('click', deletarConta);
}


// Inicialização
window.onload = async () => {
  await checarLogin();
  setupPerfil();
  setupCardsHabitos();
  setupModais();
  carregarHabitos();
};