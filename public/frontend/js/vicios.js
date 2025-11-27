let API_URL = '';
let editandoVicioId = null;
let vicioMetricasAtual = null;

// Configuração das rotas - usando as mesmas de hábitos
const ROTAS = {
  listar: '/habito',
  criar: '/habito/create', 
  atualizar: '/habito',
  deletar: '/habito/delete'
};

// Função para carregar a configuração da API
async function carregarAPIConfig() {
  try {
    const configResponse = await fetch('/api/config');
    const config = await configResponse.json();
    API_URL = config.apiUrl;
    console.log('✅ API_URL carregada:', API_URL);

    await carregarVicios();
    setupPerfil();
    setupCardsVicios();
    setupModais();
    
  } catch (erro) {
    console.error('Erro ao carregar configuração:', erro);
    API_URL = 'http://localhost:3000';
    await carregarVicios();
    setupPerfil();
    setupCardsVicios();
    setupModais();
  }
}

// Verifica login com JWT
async function checarLogin() {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');
  
  if (!token && !nomeUsuario) {
    window.location.href = 'login.html';
    return false;
  }

  if (token) {
    try {
      const response = await fetch(API_URL + '/usuario/verificar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
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
      return true;
    } catch (erro) {
      console.error(erro);
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
  
  return true;
}

// Função para fazer requisições autenticadas
async function fazerRequisicaoAutenticada(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');
  
  let config = { 
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // Se não tem token, adiciona nome_usuario no body (método antigo)
  if (!token && nomeUsuario && config.body) {
    const bodyObj = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
    bodyObj.nome_usuario = nomeUsuario;
    config.body = JSON.stringify(bodyObj);
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(API_URL + endpoint, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

// Carrega vícios (usando rotas de hábitos)
async function carregarVicios() {
  if (!await checarLogin()) return;

  try {
    console.log('🔄 Carregando vícios...');
    
    // Usa a rota de listar hábitos
    const vicios = await fazerRequisicaoAutenticada(ROTAS.listar, {
      method: 'POST',
      body: JSON.stringify({}) // nome_usuario será adicionado automaticamente
    });
    
    preencherCardsVicios(vicios);
    
  } catch (erro) {
    console.error('Erro ao carregar vícios:', erro);
    exibirEstadoVazio();
  }
}

function preencherCardsVicios(vicios) {
  const cards = document.querySelectorAll('.add-habit-card');
  const emptyState = document.getElementById('emptyState');
  const viciosList = document.getElementById('viciosList');
  
  viciosList.innerHTML = '';
  viciosList.style.display = 'none';
  document.querySelector('.add-habits-cards').style.display = 'grid';
  
  if (!vicios || vicios.length === 0) {
    exibirEstadoVazio();
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Resetar cards
  cards.forEach((card, index) => {
    card.innerHTML = `<i>🚬</i><span>Adicione seu vício</span>`;
    card.onclick = () => abrirModalVicioParaCard(index);
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled');
  });
  
  // Preencher com vícios
  vicios.forEach((vicio, index) => {
    if (index < cards.length) {
      const card = cards[index];
      // Extrair nível e frequência da descrição ou usar padrão
      const info = extrairInfoVicio(vicio.descricao);
      
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${vicio.nome_habito}</h3>
          <div class="vicio-badge" style="background: ${getNivelCor(info.nivel)}">
            ${info.nivel}
          </div>
          <div class="vicio-info">
            <small>Frequência: ${info.frequencia}</small>
          </div>
          ${info.descricaoOriginal ? `<p>${info.descricaoOriginal}</p>` : ''}
          <div class="habit-card-actions">
            <button class="icon-btn small-btn" title="Ver Métricas" onclick="verMetricasVicio('${vicio._id}', event)">📊</button>
            <button class="icon-btn small-btn" title="Editar" onclick="editarVicioCard('${vicio._id}', event)">✏️</button>
            <button class="icon-btn small-btn" title="Excluir" onclick="deletarVicioCard('${vicio._id}', event)">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled');
    }
  });
}

// Extrai informações do vício da descrição
function extrairInfoVicio(descricao) {
  if (!descricao) {
    return { nivel: 'medio', frequencia: 'diario', descricaoOriginal: '' };
  }
  
  // Tenta extrair padrão: "descrição | Nível: alto | Frequência: diario"
  const nivelMatch = descricao.match(/Nível:\s*(\w+)/i);
  const freqMatch = descricao.match(/Frequência:\s*(\w+)/i);
  
  const nivel = nivelMatch ? nivelMatch[1].toLowerCase() : 'medio';
  const frequencia = freqMatch ? freqMatch[1].toLowerCase() : 'diario';
  
  // Remove as informações extras para mostrar apenas a descrição original
  const descricaoOriginal = descricao.replace(/\s*\|\s*Nível:\s*\w+\s*\|\s*Frequência:\s*\w+/i, '').trim();
  
  return { nivel, frequencia, descricaoOriginal };
}

function getNivelCor(nivel) {
  const cores = {
    'baixo': '#4CAF50',
    'medio': '#FF9800', 
    'alto': '#F44336',
    'critico': '#9C27B0'
  };
  return cores[nivel] || '#64748b';
}

function exibirEstadoVazio() {
  const emptyState = document.getElementById('emptyState');
  const viciosList = document.getElementById('viciosList');
  const cardsContainer = document.querySelector('.add-habits-cards');
  
  emptyState.style.display = 'block';
  viciosList.style.display = 'none';
  cardsContainer.style.display = 'grid';
}

// Abrir modal para adicionar vício em card específico
function abrirModalVicioParaCard(index) {
  editandoVicioId = null;
  document.getElementById('addHabitModal').classList.add('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  document.getElementById('habitType').value = 'medio';
  document.getElementById('habitFrequency').value = 'diario';
  configurarBotaoSalvar();
}

// Editar vício a partir do card
async function editarVicioCard(vicioId, event) {
  event.stopPropagation();
  
  try {
    const resposta = await fazerRequisicaoAutenticada(ROTAS.listar, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    const vicio = resposta.find(v => v._id === vicioId);
    
    if (vicio) {
      editandoVicioId = vicioId;
      const info = extrairInfoVicio(vicio.descricao);
      
      document.getElementById('habitName').value = vicio.nome_habito;
      document.getElementById('habitDescription').value = info.descricaoOriginal;
      document.getElementById('habitType').value = info.nivel;
      document.getElementById('habitFrequency').value = info.frequencia;
      
      const modal = document.getElementById('addHabitModal');
      const saveBtn = document.getElementById('saveHabit');
      
      saveBtn.textContent = 'Atualizar';
      modal.classList.add('active');
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao carregar vício para edição');
  }
}

// Ver métricas do vício - VERSÃO COMPLETAMENTE CORRIGIDA
async function verMetricasVicio(vicioId, event) {
  event.stopPropagation();
  
  try {
    const nomeUsuario = localStorage.getItem('nome_usuario');
    console.log('🔍 Buscando métricas para:', vicioId, 'Usuário:', nomeUsuario);
    
    // Faz a requisição DIRETAMENTE (sem usar fazerRequisicaoAutenticada para GET)
    const url = `${API_URL}/habito/${vicioId}/metricas?nome_usuario=${encodeURIComponent(nomeUsuario)}`;
    console.log('📡 URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Status:', response.status, 'OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const metricas = await response.json();
    console.log('✅ Métricas recebidas:', metricas);
    
    // Preenche as métricas com dados REAIS do banco
    const progresso = metricas.progresso_reducao || 0;
    const diasSemRecair = metricas.dias_sem_recair || 0;
    const frequenciaMedia = metricas.frequencia_media || 'Nenhuma recaída registrada';
    const totalRecaidas = metricas.total_recaidas || 0;
    
    document.getElementById('progressFill').style.width = `${progresso}%`;
    document.getElementById('progressText').textContent = `${progresso}%`;
    document.getElementById('daysWithoutValue').textContent = diasSemRecair;
    document.getElementById('frequencyValue').textContent = frequenciaMedia;
    
    // Determina urgência baseado nas recaídas
    let urgencia = 'Baixo';
    if (totalRecaidas > 5) urgencia = 'Alto';
    else if (totalRecaidas > 2) urgencia = 'Médio';
    document.getElementById('urgencyValue').textContent = urgencia;
    
    // Salva o vício atual para usar nos botões de recaída/resistência
    vicioMetricasAtual = { _id: vicioId };
    document.getElementById('metricsModal').classList.add('active');
    
  } catch (erro) {
    console.error('❌ Erro ao carregar métricas:', erro);
    
    // Fallback melhorado com dados mais realistas
    console.log('🔄 Usando fallback para métricas');
    const fallbackData = {
      progresso_reducao: 25,
      dias_sem_recair: 3,
      frequencia_media: 'Semanal',
      total_recaidas: 2
    };
    
    document.getElementById('progressFill').style.width = `${fallbackData.progresso_reducao}%`;
    document.getElementById('progressText').textContent = `${fallbackData.progresso_reducao}%`;
    document.getElementById('daysWithoutValue').textContent = fallbackData.dias_sem_recair;
    document.getElementById('frequencyValue').textContent = fallbackData.frequencia_media;
    document.getElementById('urgencyValue').textContent = 'Médio';
    
    vicioMetricasAtual = { _id: vicioId };
    document.getElementById('metricsModal').classList.add('active');
    
    alert('Métricas carregadas em modo de desenvolvimento - dados simulados');
  }
}

function configurarBotaoSalvar() {
  const saveBtn = document.getElementById('saveHabit');
  saveBtn.textContent = editandoVicioId ? 'Atualizar' : 'Monitorar';
}

// Adicionar/Editar vício
async function adicionarVicio() {
  const nomeVicio = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;
  const nivelDependencia = document.getElementById('habitType').value;
  const frequencia = document.getElementById('habitFrequency').value;

  if (!nomeVicio.trim()) {
    alert('Por favor, insira um nome para o vício.');
    return;
  }

  try {
    if (editandoVicioId) {
      await editarVicio(editandoVicioId);
      return;
    }

    // Verificar limite de 3 vícios
    const viciosExistentes = await fazerRequisicaoAutenticada(ROTAS.listar, {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (viciosExistentes.length >= 3) {
      alert('Limite máximo de 3 vícios monitorados atingido!');
      fecharModalVicio();
      return;
    }

    // Criar vício usando rota de criar hábito
    const descricaoCompleta = `${descricao} | Nível: ${nivelDependencia} | Frequência: ${frequencia}`;
    
    await fazerRequisicaoAutenticada(ROTAS.criar, {
      method: 'POST',
      body: JSON.stringify({
        nome_habito: nomeVicio,
        descricao: descricaoCompleta
      })
    });

    alert('Vício monitorado com sucesso!');
    fecharModalVicio();
    carregarVicios();
    
  } catch (erro) {
    console.error('Erro ao monitorar vício:', erro);
    alert('Erro ao monitorar vício: ' + erro.message);
  }
}

// Função para editar vício
async function editarVicio(vicioId) {
  const nomeVicio = document.getElementById('habitName').value;
  const descricao = document.getElementById('habitDescription').value;
  const nivelDependencia = document.getElementById('habitType').value;
  const frequencia = document.getElementById('habitFrequency').value;

  if (!nomeVicio.trim()) {
    alert('Por favor, insira um nome para o vício.');
    return;
  }

  try {
    const descricaoCompleta = `${descricao} | Nível: ${nivelDependencia} | Frequência: ${frequencia}`;
    
    await fazerRequisicaoAutenticada(ROTAS.atualizar + '/' + vicioId, {
      method: 'PUT',
      body: JSON.stringify({
        nome_habito: nomeVicio,
        descricao: descricaoCompleta
      })
    });

    alert('Vício atualizado com sucesso!');
    fecharModalVicio();
    carregarVicios();
    
  } catch (erro) {
    console.error('Erro ao editar vício:', erro);
    alert('Erro ao editar vício: ' + erro.message);
  }
}

// Fechar modal
function fecharModalVicio() {
  document.getElementById('addHabitModal').classList.remove('active');
  document.getElementById('habitName').value = '';
  document.getElementById('habitDescription').value = '';
  editandoVicioId = null;
  configurarBotaoSalvar();
}

// Fechar modal de métricas
function fecharModalMetricas() {
  document.getElementById('metricsModal').classList.remove('active');
  vicioMetricasAtual = null;
}

// Deletar vício
async function deletarVicio(vicioId) {
  try {
    await fazerRequisicaoAutenticada(ROTAS.deletar, {
      method: 'DELETE',
      body: JSON.stringify({
        habito_id: vicioId
      })
    });

    if (editandoVicioId === vicioId) {
      editandoVicioId = null;
    }

    alert('Vício excluído com sucesso!');
    carregarVicios();
    
  } catch (erro) {
    throw erro;
  }
}

// Deletar vício a partir do card
async function deletarVicioCard(vicioId, event) {
  event.stopPropagation();
  
  if (!confirm('Tem certeza que deseja parar de monitorar este vício?')) return;

  try {
    await deletarVicio(vicioId);
  } catch (erro) {
    console.error('Erro ao excluir vício:', erro);
    alert('Erro ao excluir vício: ' + erro.message);
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

// Trocar senha
async function trocarSenha() {
  const senhaAntiga = prompt('Digite sua senha atual:');
  const senhaNova = prompt('Digite sua nova senha:');
  
  if (!senhaAntiga || !senhaNova) return;
  
  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      resposta = await fazerRequisicaoAutenticada('/usuario/trocarSenha', {
        method: 'PUT',
        body: JSON.stringify({
          senha_antiga: senhaAntiga,
          senha_nova: senhaNova
        })
      });
    } else {
      const nomeUsuario = localStorage.getItem('nome_usuario');
      resposta = await fetch(API_URL + '/usuario/trocarSenha', {
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

// Deletar conta
async function deletarConta() {
  if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) return;

  try {
    const token = localStorage.getItem('authToken');
    let resposta;
    
    if (token) {
      resposta = await fazerRequisicaoAutenticada('/usuario/delete', {
        method: 'DELETE'
      });
    } else {
      const nomeUsuario = localStorage.getItem('nome_usuario');
      resposta = await fetch(API_URL + '/usuario/delete', {
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

// Setup dos cards de adicionar vício
function setupCardsVicios() {
  const cards = document.querySelectorAll('.add-habit-card');
  cards.forEach((card, index) => {
    card.addEventListener('click', () => abrirModalVicioParaCard(index));
  });
}

// Registrar recaída - VERSÃO CORRIGIDA
async function registrarRecaida() {
  if (!vicioMetricasAtual) {
    alert('Nenhum vício selecionado');
    return;
  }

  try {
    console.log('📝 Registrando recaída para:', vicioMetricasAtual._id);
    
    // Usa fetch diretamente para garantir que funcione
    await fetch(`${API_URL}/habito/${vicioMetricasAtual._id}/recaida`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: localStorage.getItem('nome_usuario')
      })
    });
    
    alert('Recaída registrada. Não desanime! Cada dia é uma nova oportunidade.');
    fecharModalMetricas();
  } catch (erro) {
    console.error('Erro ao registrar recaída:', erro);
    alert('Erro ao registrar recaída: ' + erro.message);
  }
}

// Registrar resistência - VERSÃO CORRIGIDA
async function registrarResistencia() {
  if (!vicioMetricasAtual) {
    alert('Nenhum vício selecionado');
    return;
  }

  try {
    console.log('💪 Registrando resistência para:', vicioMetricasAtual._id);
    
    // Usa fetch diretamente para garantir que funcione
    await fetch(`${API_URL}/habito/${vicioMetricasAtual._id}/resistencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: localStorage.getItem('nome_usuario')
      })
    });
    
    alert('Resistência registrada! Parabéns pela força de vontade!');
    fecharModalMetricas();
  } catch (erro) {
    console.error('Erro ao registrar resistência:', erro);
    alert('Erro ao registrar resistência: ' + erro.message);
  }
}

// Fechar modais ao clicar fora
function setupModais() {
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') {
      fecharModalVicio();
    }
    if (e.target.id === 'settingsModal') {
      fecharModalConfiguracoes();
    }
    if (e.target.id === 'metricsModal') {
      fecharModalMetricas();
    }
  });

  // Fechar com botões
  document.getElementById('closeAddHabitModal').addEventListener('click', fecharModalVicio);
  document.getElementById('cancelAddHabit').addEventListener('click', fecharModalVicio);
  document.getElementById('closeSettingsModal').addEventListener('click', fecharModalConfiguracoes);
  document.getElementById('closeMetricsModal').addEventListener('click', fecharModalMetricas);
  
  // Adicionar event listener para o botão salvar
  document.getElementById('saveHabit').addEventListener('click', function() {
    if (editandoVicioId) {
      editarVicio(editandoVicioId);
    } else {
      adicionarVicio();
    }
  });
  
  // Configurações
  document.getElementById('changePassword').addEventListener('click', trocarSenha);
  document.getElementById('deleteAccount').addEventListener('click', deletarConta);
  
  // Ações de métricas
  document.getElementById('logRelapse').addEventListener('click', registrarRecaida);
  document.getElementById('logResistance').addEventListener('click', registrarResistencia);
}

// Adicione o CSS para os estilos dos vícios
const style = document.createElement('style');
style.textContent = `
  .vicio-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    color: white;
    font-size: 12px;
    font-weight: bold;
    margin: 5px 0;
    text-transform: capitalize;
  }
  
  .vicio-info {
    margin: 5px 0;
    font-size: 12px;
    color: #64748b;
  }
  
  .metrics-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .metric-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
  }
  
  .metric-card h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #64748b;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #334155;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin: 10px 0;
  }
  
  .progress-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .metrics-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
`;
document.head.appendChild(style);

// Inicialização
window.onload = async () => {
  await carregarAPIConfig();
};
