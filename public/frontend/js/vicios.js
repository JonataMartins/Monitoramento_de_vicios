let API_URL = '';
let editandoVicioId = null;
let vicioMetricasAtual = null;

const ROTAS = {
  listar: '/habito',
  criar: '/habito/create',
  atualizar: '/habito',
  deletar: '/habito/delete'
};

// --- HELPERS DE DOM (Para reduzir repetição de document.getElementById) ---
const getVal = (id) => document.getElementById(id).value;
const setVal = (id, val) => document.getElementById(id).value = val;
const setTxt = (id, txt) => document.getElementById(id).textContent = txt;

// --- CONFIGURAÇÃO E AUTENTICAÇÃO ---

async function carregarAPIConfig() {
  try {
    const configResponse = await fetch('/api/config');
    const config = await configResponse.json();
    API_URL = config.apiUrl;
    console.log('✅ API_URL carregada:', API_URL);
  } catch (erro) {
    console.error('Erro ao carregar configuração:', erro);
    API_URL = 'http://localhost:3000';
  }
  // Inicia a aplicação independente do sucesso da config
  await carregarVicios();
  setupPerfil();
  setupCardsVicios();
  setupModais();
}

async function fazerRequisicaoAutenticada(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;

  // Tratamento legado para quando não há token (adiciona nome_usuario no body)
  if (!token && nomeUsuario && body) {
    const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
    bodyObj.nome_usuario = nomeUsuario;
    body = JSON.stringify(bodyObj);
  }

  // Se endpoint for URL completa, usa ela, senão concatena API_URL
  const url = endpoint.startsWith('http') ? endpoint : API_URL + endpoint;

  const response = await fetch(url, { ...options, headers, body });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function checarLogin() {
  const token = localStorage.getItem('authToken');
  const nomeUsuario = localStorage.getItem('nome_usuario');

  if (!token && !nomeUsuario) {
    window.location.href = 'login.html';
    return false;
  }

  if (token) {
    try {
      await fazerRequisicaoAutenticada('/usuario/verificar');
      return true;
    } catch (erro) {
      console.error("Token inválido:", erro);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_id');

      // Se tiver nome_usuario, permite continuar (modo legado/sem auth estrita), senão login
      if (!nomeUsuario) {
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
      }
    }
  }
  return true;
}

// --- GERENCIAMENTO DE VÍCIOS (CRUD) ---

async function carregarVicios() {
  if (!await checarLogin()) return;

  try {
    console.log('🔄 Carregando vícios...');
    const vicios = await fazerRequisicaoAutenticada(ROTAS.listar, {
      method: 'POST',
      body: JSON.stringify({})
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

  cards.forEach((card, index) => {
    card.className = 'add-habit-card'; // Remove classes extras
    card.style.cursor = 'pointer';
    card.onclick = () => abrirModalVicioParaCard(index);
    card.innerHTML = `<i>🚬</i><span>Adicione seu vício</span>`;

    // Preencher se houver vício neste índice
    if (index < vicios.length) {
      const vicio = vicios[index];
      const info = extrairInfoVicio(vicio.descricao);

      card.classList.add('habit-card-filled');
      card.style.cursor = 'default';
      card.onclick = null;

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
    }
  });
}

// Unifica a lógica de Adicionar e Editar
async function processarSalvamentoVicio() {
  const nomeVicio = getVal('habitName');
  const descricao = getVal('habitDescription');
  const nivel = getVal('habitType');
  const frequencia = getVal('habitFrequency');

  if (!nomeVicio.trim()) return alert('Por favor, insira um nome para o vício.');

  const descricaoCompleta = `${descricao} | Nível: ${nivel} | Frequência: ${frequencia}`;
  const payload = { nome_habito: nomeVicio, descricao: descricaoCompleta };

  try {
    if (editandoVicioId) {
      // --- EDITAR ---
      await fazerRequisicaoAutenticada(`${ROTAS.atualizar}/${editandoVicioId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('Vício atualizado com sucesso!');
    } else {
      // --- CRIAR ---
      // Verifica limite antes de criar
      const viciosExistentes = await fazerRequisicaoAutenticada(ROTAS.listar, { method: 'POST', body: JSON.stringify({}) });
      if (viciosExistentes.length >= 3) {
        alert('Limite máximo de 3 vícios monitorados atingido!');
        return fecharModalVicio();
      }

      await fazerRequisicaoAutenticada(ROTAS.criar, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      alert('Vício monitorado com sucesso!');
    }

    fecharModalVicio();
    carregarVicios();
  } catch (erro) {
    console.error('Erro ao salvar vício:', erro);
    alert('Erro: ' + erro.message);
  }
}

// Prepara modal para edição
async function editarVicioCard(vicioId, event) {
  event.stopPropagation();
  try {
    // Busca lista atual para pegar os dados (evita nova req de detalhes se já temos a lista)
    const vicios = await fazerRequisicaoAutenticada(ROTAS.listar, { method: 'POST', body: JSON.stringify({}) });
    const vicio = vicios.find(v => v._id === vicioId);

    if (vicio) {
      editandoVicioId = vicioId;
      const info = extrairInfoVicio(vicio.descricao);

      setVal('habitName', vicio.nome_habito);
      setVal('habitDescription', info.descricaoOriginal);
      setVal('habitType', info.nivel);
      setVal('habitFrequency', info.frequencia);

      document.getElementById('saveHabit').textContent = 'Atualizar';
      document.getElementById('addHabitModal').classList.add('active');
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao carregar dados para edição');
  }
}

async function deletarVicioCard(vicioId, event) {
  event.stopPropagation();

  if (!confirm('Tem certeza que deseja parar de monitorar este vício?')) return;

  const cardElement = event.target.closest('.add-habit-card');

  try {
    await fazerRequisicaoAutenticada(ROTAS.deletar, {
      method: 'DELETE',
      body: JSON.stringify({ habito_id: vicioId })
    });

    if (cardElement) {
      cardElement.classList.remove('habit-card-filled');
      cardElement.style.cursor = 'pointer';
      cardElement.innerHTML = `<i>🚬</i><span>Adicione seu vício</span>`;

      const cards = Array.from(document.querySelectorAll('.add-habit-card'));
      const removedIndex = cards.indexOf(cardElement);
      cardElement.onclick = () => abrirModalVicioParaCard(removedIndex);
    }

    if (editandoVicioId === vicioId) {
      editandoVicioId = null;
    }

    alert('Vício excluído com sucesso!');

    carregarVicios();

  } catch (erro) {
    console.error('Erro ao excluir vício:', erro);
    alert('Erro ao excluir vício: ' + erro.message);
  }
}

// --- MÉTRICAS ---

async function verMetricasVicio(vicioId, event) {
  event.stopPropagation();
  const nomeUsuario = localStorage.getItem('nome_usuario');

  try {
    console.log('🔍 Buscando métricas para:', vicioId);
    // Usando o helper centralizado com query string
    const url = `/habito/${vicioId}/metricas?nome_usuario=${encodeURIComponent(nomeUsuario)}`;
    const metricas = await fazerRequisicaoAutenticada(url, { method: 'GET' });

    console.log('✅ Métricas recebidas:', metricas);
    atualizarModalMetricas(metricas, vicioId);

  } catch (erro) {
    console.error('❌ Erro API Métricas:', erro);

    atualizarModalMetricas({
      progresso_reducao: 25,
      dias_sem_recair: 3,
      frequencia_media: 'Semanal',
      total_recaidas: 2
    }, vicioId);
    alert('Métricas simuladas (Erro de conexão ou dados insuficientes).');
  }
}

function atualizarModalMetricas(dados, vicioId) {
  const progresso = dados.progresso_reducao || 0;
  const totalRecaidas = dados.total_recaidas || 0;

  document.getElementById('progressFill').style.width = `${progresso}%`;
  setTxt('progressText', `${progresso}%`);
  setTxt('daysWithoutValue', dados.dias_sem_recair || 0);
  setTxt('frequencyValue', dados.frequencia_media || 'Nenhuma recaída');

  let urgencia = 'Baixo';
  if (totalRecaidas > 5) urgencia = 'Alto';
  else if (totalRecaidas > 2) urgencia = 'Médio';
  setTxt('urgencyValue', urgencia);

  vicioMetricasAtual = { _id: vicioId };
  document.getElementById('metricsModal').classList.add('active');
}

async function registrarEventoMetrica(tipo) {
  if (!vicioMetricasAtual) return alert('Nenhum vício selecionado');

  // Tipo: 'recaida' ou 'resistencia'
  const endpoint = `/habito/${vicioMetricasAtual._id}/${tipo}`;
  const msgSucesso = tipo === 'recaida'
    ? 'Recaída registrada. Não desanime!'
    : 'Resistência registrada! Parabéns!';

  try {
    await fazerRequisicaoAutenticada(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ nome_usuario: localStorage.getItem('nome_usuario') })
    });
    alert(msgSucesso);
    fecharModalMetricas();
  } catch (erro) {
    console.error(`Erro ao registrar ${tipo}:`, erro);
    alert(`Erro: ${erro.message}`);
  }
}

// --- CONFIGURAÇÕES DE USUÁRIO ---

async function trocarSenha() {
  const senhaAntiga = prompt('Digite sua senha atual:');
  const senhaNova = prompt('Digite sua nova senha:');
  if (!senhaAntiga || !senhaNova) return;

  try {
    // fazerRequisicaoAutenticada cuida do token ou do nome_usuario no body automaticamente
    await fazerRequisicaoAutenticada('/usuario/trocarSenha', {
      method: 'PUT',
      body: JSON.stringify({ senha_antiga: senhaAntiga, senha_nova: senhaNova })
    });
    alert('Senha alterada com sucesso!');
  } catch (erro) {
    alert('Erro ao trocar senha: ' + erro.message);
  }
}

async function deletarConta() {
  if (!confirm('Tem certeza? Ação irreversível.')) return;
  try {
    await fazerRequisicaoAutenticada('/usuario/delete', {
      method: 'DELETE',
      body: JSON.stringify({ nome_usuario: localStorage.getItem('nome_usuario') })
    });
    localStorage.clear();
    alert('Conta deletada.');
    window.location.href = 'login.html';
  } catch (erro) {
    alert('Erro ao deletar conta: ' + erro.message);
  }
}

async function logout() {
  try {
    await fazerRequisicaoAutenticada('/usuario/logout', { method: 'POST' });
  } catch (e) { /* Ignora erro no logout */ }
  localStorage.clear();
  window.location.href = 'login.html';
}

// --- UTILS UI ---

function extrairInfoVicio(descricao) {
  if (!descricao) return { nivel: 'medio', frequencia: 'diario', descricaoOriginal: '' };

  const nivelMatch = descricao.match(/Nível:\s*(\w+)/i);
  const freqMatch = descricao.match(/Frequência:\s*(\w+)/i);

  return {
    nivel: nivelMatch ? nivelMatch[1].toLowerCase() : 'medio',
    frequencia: freqMatch ? freqMatch[1].toLowerCase() : 'diario',
    descricaoOriginal: descricao.replace(/\s*\|\s*Nível:\s*\w+\s*\|\s*Frequência:\s*\w+/i, '').trim()
  };
}

function getNivelCor(nivel) {
  const cores = { 'baixo': '#4CAF50', 'medio': '#FF9800', 'alto': '#F44336', 'critico': '#9C27B0' };
  return cores[nivel] || '#64748b';
}

function exibirEstadoVazio() {
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('viciosList').style.display = 'none';
  document.querySelector('.add-habits-cards').style.display = 'grid';
}

// --- MODAIS E SETUP ---

function abrirModalVicioParaCard(index) {
  editandoVicioId = null;
  setVal('habitName', '');
  setVal('habitDescription', '');
  setVal('habitType', 'medio');
  setVal('habitFrequency', 'diario');

  document.getElementById('saveHabit').textContent = 'Monitorar';
  document.getElementById('addHabitModal').classList.add('active');
}

function fecharModalVicio() {
  document.getElementById('addHabitModal').classList.remove('active');
  editandoVicioId = null;
}

function fecharModalMetricas() {
  document.getElementById('metricsModal').classList.remove('active');
  vicioMetricasAtual = null;
}

function setupPerfil() {
  const profileMenu = document.getElementById('profileMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');

  setTxt('username', localStorage.getItem('nome_usuario') || 'Usuário');

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
    setVal('userName', localStorage.getItem('nome_usuario') || 'Usuário');
    document.getElementById('settingsModal').classList.add('active');
  });
}

function setupCardsVicios() {
  document.querySelectorAll('.add-habit-card').forEach((card, index) => {
    card.addEventListener('click', () => abrirModalVicioParaCard(index));
  });
}

function setupModais() {
  // Fechamento ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') fecharModalVicio();
    if (e.target.id === 'settingsModal') document.getElementById('settingsModal').classList.remove('active');
    if (e.target.id === 'metricsModal') fecharModalMetricas();
  });

  // Botões de fechar
  document.getElementById('closeAddHabitModal').onclick = fecharModalVicio;
  document.getElementById('cancelAddHabit').onclick = fecharModalVicio;
  document.getElementById('closeSettingsModal').onclick = () => document.getElementById('settingsModal').classList.remove('active');
  document.getElementById('closeMetricsModal').onclick = fecharModalMetricas;

  // Ações Principais
  document.getElementById('saveHabit').onclick = processarSalvamentoVicio;
  document.getElementById('changePassword').onclick = trocarSenha;
  document.getElementById('deleteAccount').onclick = deletarConta;

  // Ações de Métricas (Usando função unificada)
  document.getElementById('logRelapse').onclick = () => registrarEventoMetrica('recaida');
  document.getElementById('logResistance').onclick = () => registrarEventoMetrica('resistencia');
}

// Estilos CSS injetados
const style = document.createElement('style');
style.textContent = `
  .vicio-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin: 5px 0; text-transform: capitalize; }
  .vicio-info { margin: 5px 0; font-size: 12px; color: #64748b; }
  .metrics-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
  .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
  .metric-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; }
  .metric-value { font-size: 24px; font-weight: bold; color: #334155; }
  .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 10px 0; }
  .progress-fill { height: 100%; background: #4CAF50; transition: width 0.3s ease; }
  .metrics-actions { display: flex; gap: 10px; justify-content: center; }
`;
document.head.appendChild(style);

window.onload = carregarAPIConfig;