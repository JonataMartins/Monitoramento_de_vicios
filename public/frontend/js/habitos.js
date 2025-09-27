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

// Carrega hábitos - MODIFICADO: Suporte a ambos os métodos
async function carregarHabitos() {
  if (!await checarLogin()) return;

  try {
    const resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito');
    
    if (!resposta.ok) {
      throw new Error('Erro ao buscar hábitos');
    }

    const habitos = await resposta.json();
    exibirHabitos(habitos);
    
  } catch (erro) {
    console.error(erro);
    document.getElementById('emptyState').style.display = 'block';
  }
}

// Função para exibir hábitos
function exibirHabitos(habitos) {
  const habitosList = document.getElementById('habitosList');
  const emptyState = document.getElementById('emptyState');
  
  habitosList.innerHTML = '';

  if (!habitos || habitos.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    
    habitos.forEach(h => {
      const li = document.createElement('li');
      li.className = 'habit-item';
      li.innerHTML = `
        <div>
          <h3>${h.nome_habito}</h3>
          ${h.descricao ? `<p>${h.descricao}</p>` : ''}
        </div>
        <div class="habit-actions">
          <button class="icon-btn" title="Excluir" onclick="deletarHabito('${h._id}')">🗑️</button>
        </div>
      `;
      habitosList.appendChild(li);
    });
  }
}

// Adicionar hábito - MODIFICADO: Suporte a ambos os métodos
async function adicionarHabito() {
  const nomeHabito = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome para o hábito.');
    return;
  }

  try {
    const resposta = await fazerRequisicaoAutenticada('http://localhost:3000/habito/create', {
      method: 'POST',
      body: JSON.stringify({
        nome_habito: nomeHabito,
        descricao: descricao
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
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

// Deletar hábito - MODIFICADO: Suporte a ambos os métodos
async function deletarHabito(habitoId) {
  if (!confirm('Tem certeza que deseja excluir este hábito?')) return;

  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      // Tentar com JWT (DELETE com ID na URL)
      resposta = await fazerRequisicaoAutenticada(`http://localhost:3000/habito/${habitoId}`, {
        method: 'DELETE'
      });
    } else {
      // Fallback para método antigo (DELETE com body)
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

    alert('Hábito excluído com sucesso!');
    carregarHabitos();
    
  } catch (erro) {
    console.error(erro);
    alert('Erro ao excluir hábito: ' + erro.message);
  }
}

// Modal de hábito
function abrirModalHabito() {
  document.getElementById('addHabitModal').classList.add('active');
}

function fecharModalHabito() {
  document.getElementById('addHabitModal').classList.remove('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
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
  cards.forEach(card => {
    card.addEventListener('click', abrirModalHabito);
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
  
  // Salvar hábito
  document.getElementById('saveHabit').addEventListener('click', adicionarHabito);
  
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