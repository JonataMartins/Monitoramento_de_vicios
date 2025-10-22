let API_URL = '';
let editandoHabitoId = null;
let currentTab = 'habitos';

// Função para carregar a configuração da API
async function carregarAPIConfig() {
  try {
    const configResponse = await fetch('/api/config');
    const config = await configResponse.json();
    API_URL = config.apiUrl;

    await carregarHabitos();
    setupPerfil();
    setupCardsHabitos();
    setupModais();
    
  } catch (erro) {
    console.error('Erro ao carregar a configuração da API:', erro);
    // Fallback para URL padrão
    // await carregarHabitos();
    // setupPerfil();
    // setupCardsHabitos();
    // setupModais();
  }
}

// Verifica login
async function checarLogin() {
  const nomeUsuario = localStorage.getItem('nome_usuario');
  if (!nomeUsuario) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ========== FUNÇÕES PARA ABAS ==========

function mudarTab(tab) {
  currentTab = tab;
  
  // Remove active de todas as tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
  });
  
  // Remove active de todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.remove('active');
  });
  
  // Ativa a tab clicada
  if (tab === 'habitos') {
    document.getElementById('tabHabitos').classList.add('active');
    document.getElementById('contentHabitos').classList.add('active');
  } else {
    document.getElementById('tabVicios').classList.add('active');
    document.getElementById('contentVicios').classList.add('active');
  }
  
  // Carrega os dados
  if (tab === 'habitos') {
    carregarHabitos();
  } else {
    carregarVicios();
  }
}

// ========== FUNÇÕES PARA HÁBITOS ==========

async function carregarHabitos() {
  if (!await checarLogin()) return;

  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + '/habito', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });
    
    const habitos = await resposta.json();
    preencherCardsHabitos(habitos);
    
  } catch (erro) {
    console.error('Erro ao carregar hábitos:', erro);
    exibirEstadoVazio('habitos');
  }
}

function preencherCardsHabitos(habitos) {
  const cards = document.querySelectorAll('#contentHabitos .add-habit-card');
  const emptyState = document.getElementById('emptyStateHabitos');
  
  if (!habitos || habitos.length === 0) {
    exibirEstadoVazio('habitos');
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Resetar cards
  cards.forEach((card, index) => {
    card.innerHTML = `<i>📝</i><span>Adicione seu hábito</span>`;
    card.onclick = () => abrirModalParaCard(index, 'habito');
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled');
  });
  
  // Preencher com hábitos existentes
  habitos.forEach((habito, index) => {
    if (index < cards.length) {
      const card = cards[index];
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${habito.nome_habito}</h3>
          ${habito.descricao ? `<p class="habit-description">${habito.descricao}</p>` : ''}
          <div class="habit-card-actions">
            <button class="icon-btn small-btn" title="Editar" onclick="editarItemCard('${habito._id}', 'habito', event)">✏️</button>
            <button class="icon-btn small-btn" title="Excluir" onclick="deletarItemCard('${habito._id}', 'habito', event)">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled');
    }
  });
}

// ========== FUNÇÕES PARA VÍCIOS ==========

async function carregarVicios() {
  if (!await checarLogin()) return;

  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + '/vicio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });
    
    const vicios = await resposta.json();
    preencherCardsVicios(vicios);
    
  } catch (erro) {
    console.error('Erro ao carregar vícios:', erro);
    exibirEstadoVazio('vicios');
  }
}

function preencherCardsVicios(vicios) {
  const cards = document.querySelectorAll('#contentVicios .add-habit-card');
  const emptyState = document.getElementById('emptyStateVicios');
  
  if (!vicios || vicios.length === 0) {
    exibirEstadoVazio('vicios');
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Resetar cards
  cards.forEach((card, index) => {
    card.innerHTML = `<i>🚫</i><span>Adicione seu vício</span>`;
    card.onclick = () => abrirModalParaCard(index, 'vicio');
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled', 'vicio-card-filled');
  });
  
  // Preencher com vícios existentes
  vicios.forEach((vicio, index) => {
    if (index < cards.length) {
      const card = cards[index];
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${vicio.nome_habito}</h3>
          ${vicio.descricao ? `<p class="habit-description">${vicio.descricao}</p>` : ''}
          <div class="streak-info current-streak">📅 Sequência atual: ${vicio.sequencia_atual || 0} dias</div>
          <div class="streak-info best-streak">🏆 Melhor sequência: ${vicio.melhor_sequencia || 0} dias</div>
          <div class="streak-info total-days">📊 Total controlado: ${vicio.total_dias || 0} dias</div>
          <div class="habit-card-actions">
            <button class="ceder-btn" onclick="cederAoVicio('${vicio._id}', event)">🚫 Ceder hoje</button>
            <button class="controlado-btn" onclick="controlarVicio('${vicio._id}', event)">✅ Controlado hoje</button>
            <button class="icon-btn small-btn" title="Editar" onclick="editarItemCard('${vicio._id}', 'vicio', event)">✏️</button>
            <button class="icon-btn small-btn" title="Excluir" onclick="deletarItemCard('${vicio._id}', 'vicio', event)">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled', 'vicio-card-filled');
    }
  });
}

function exibirEstadoVazio(tipo) {
  const emptyState = document.getElementById(`emptyState${tipo === 'habitos' ? 'Habitos' : 'Vicios'}`);
  emptyState.style.display = 'block';
}

// ========== FUNÇÕES COMPARTILHADAS ==========

function abrirModalParaCard(index, tipo) {
  editandoHabitoId = null;
  const modalTitle = document.getElementById('modalHabitTitle');
  
  modalTitle.textContent = tipo === 'vicio' ? 'Adicionar Novo Vício' : 'Adicionar Novo Hábito';
  document.getElementById('habitType').value = tipo;
  document.getElementById('addHabitModal').classList.add('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  
  configurarBotaoSalvar();
}

async function editarItemCard(itemId, tipo, event) {
  event.stopPropagation();
  
  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const endpoint = tipo === 'vicio' ? '/vicio' : '/habito';
    const resposta = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });
    
    if (resposta.ok) {
      const items = await resposta.json();
      const item = items.find(h => h._id === itemId);
      
      if (item) {
        editandoHabitoId = itemId;
        const modalTitle = document.getElementById('modalHabitTitle');
        
        modalTitle.textContent = tipo === 'vicio' ? 'Editar Vício' : 'Editar Hábito';
        document.getElementById('habitName').value = item.nome_habito;
        document.getElementById('habitDescription').value = item.descricao || '';
        document.getElementById('habitType').value = tipo;
        
        configurarBotaoSalvar();
        document.getElementById('addHabitModal').classList.add('active');
      }
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao carregar item para edição');
  }
}

function configurarBotaoSalvar() {
  const saveBtn = document.getElementById('saveHabit');
  saveBtn.textContent = editandoHabitoId ? 'Atualizar' : 'Salvar';
}

// Adicionar/Editar item - CORRIGIDA
async function adicionarHabito() {
  const nomeHabito = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;
  const tipo = document.getElementById('habitType').value;
  const nomeUsuario = localStorage.getItem('nome_usuario');

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome.');
    return;
  }

  try {
    // Se está editando
    if (editandoHabitoId) {
      await editarItem(editandoHabitoId, tipo);
      return;
    }

    // Verificar limite
    const endpoint = tipo === 'vicio' ? '/vicio' : '/habito';
    const resposta = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });
    
    if (resposta.ok) {
      const itemsExistentes = await resposta.json();
      if (itemsExistentes.length >= 3) {
        alert(`Limite máximo de 3 ${tipo === 'vicio' ? 'vícios' : 'hábitos'} atingido!`);
        fecharModalHabito();
        return;
      }
    }

    const createEndpoint = tipo === 'vicio' ? '/vicio/create' : '/habito/create';
    const respostaCriar = await fetch(API_URL + createEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        nome_habito: nomeHabito,
        descricao: descricao
      })
    });

    if (!respostaCriar.ok) {
      const erro = await respostaCriar.json();
      throw new Error(erro.message);
    }

    alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} criado com sucesso!`);
    fecharModalHabito();
    
    // Recarrega a tab atual
    if (currentTab === 'habitos') {
      carregarHabitos();
    } else {
      carregarVicios();
    }
    
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao criar ${tipo === 'vicio' ? 'vício' : 'hábito'}: ${erro.message}`);
  }
}

// Função para editar item - CORRIGIDA
async function editarItem(itemId, tipo) {
  const nomeHabito = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;
  const nomeUsuario = localStorage.getItem('nome_usuario');

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome.');
    return;
  }

  try {
    const endpoint = tipo === 'vicio' ? '/vicio' : '/habito';
    const resposta = await fetch(API_URL + `${endpoint}/${itemId}`, {
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

    alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} atualizado com sucesso!`);
    fecharModalHabito();
    
    // Recarrega a tab atual
    if (currentTab === 'habitos') {
      carregarHabitos();
    } else {
      carregarVicios();
    }
    
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao editar ${tipo === 'vicio' ? 'vício' : 'hábito'}: ${erro.message}`);
  }
}

// Deletar item - CORRIGIDA
async function deletarItemCard(itemId, tipo, event) {
  event.stopPropagation();
  
  if (!confirm(`Tem certeza que deseja excluir este ${tipo === 'vicio' ? 'vício' : 'hábito'}?`)) return;

  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const endpoint = tipo === 'vicio' ? '/vicio/delete' : '/habito/delete';
    const resposta = await fetch(API_URL + endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        habito_id: itemId
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} excluído com sucesso!`);
    
    if (currentTab === 'habitos') {
      carregarHabitos();
    } else {
      carregarVicios();
    }
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao excluir ${tipo === 'vicio' ? 'vício' : 'hábito'}: ${erro.message}`);
  }
}

// Ceder ao vício - CORRIGIDA
async function cederAoVicio(vicioId, event) {
  event.stopPropagation();
  
  if (!confirm('Deseja marcar que cedeu ao vício hoje? Isso reiniciará sua sequência.')) return;
  
  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + `/vicio/${vicioId}/ceder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    alert('Registrado! Amanhã é um novo dia para recomeçar! 💪');
    carregarVicios();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao registrar: ' + erro.message);
  }
}

// Controlar vício - CORRIGIDA
async function controlarVicio(vicioId, event) {
  event.stopPropagation();
  
  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + `/vicio/${vicioId}/controlado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message);
    }

    alert('Parabéns! Mais um dia sem ceder ao vício! 🎉');
    carregarVicios();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao registrar: ' + erro.message);
  }
}

function fecharModalHabito() {
  document.getElementById('addHabitModal').classList.remove('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  editandoHabitoId = null;
  configurarBotaoSalvar();
}

// ========== FUNÇÕES EXISTENTES ==========

// Modal de configurações
function abrirModalConfiguracoes() {
  document.getElementById('userName').value = localStorage.getItem('nome_usuario') || 'Usuário';
  document.getElementById('settingsModal').classList.add('active');
}

function fecharModalConfiguracoes() {
  document.getElementById('settingsModal').classList.remove('active');
}

// Trocar senha - CORRIGIDA
async function trocarSenha() {
  const senhaAntiga = prompt('Digite sua senha atual:');
  const senhaNova = prompt('Digite sua nova senha:');
  
  if (!senhaAntiga || !senhaNova) return;
  
  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + '/usuario/trocarSenha', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        senha_antiga: senhaAntiga,
        senha_nova: senhaNova
      })
    });

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

// Deletar conta - CORRIGIDA
async function deletarConta() {
  if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) return;

  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    const resposta = await fetch(API_URL + '/usuario/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: nomeUsuario
      })
    });

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

// Logout
async function logout() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch(API_URL + '/usuario/logout', {
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

// Setup dos cards
function setupCardsHabitos() {
  const habitCards = document.querySelectorAll('#contentHabitos .add-habit-card');
  const vicioCards = document.querySelectorAll('#contentVicios .add-habit-card');
  
  habitCards.forEach((card, index) => {
    card.addEventListener('click', () => abrirModalParaCard(index, 'habito'));
  });
  
  vicioCards.forEach((card, index) => {
    card.addEventListener('click', () => abrirModalParaCard(index, 'vicio'));
  });
}

// Fechar modais ao clicar fora
function setupModais() {
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') fecharModalHabito();
    if (e.target.id === 'settingsModal') fecharModalConfiguracoes();
  });

  document.getElementById('closeAddHabitModal').addEventListener('click', fecharModalHabito);
  document.getElementById('cancelAddHabit').addEventListener('click', fecharModalHabito);
  document.getElementById('closeSettingsModal').addEventListener('click', fecharModalConfiguracoes);
  
  document.getElementById('saveHabit').addEventListener('click', function() {
    adicionarHabito();
  });
  
  document.getElementById('changePassword').addEventListener('click', trocarSenha);
  document.getElementById('deleteAccount').addEventListener('click', deletarConta);
}

// Inicialização
window.onload = async () => {
  await carregarAPIConfig();
  checarLogin();
};
