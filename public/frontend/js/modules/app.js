// Importa todas as nossas "ferramentas"
import * as config from './config.js';
import * as auth from './auth.js';
import * as api from './apiService.js';
import * as ui from './ui.js';

// --- FUNÇÕES DE LÓGICA (Handlers) ---

/** Carrega os dados da aba atual e renderiza */
async function carregarDadosAtuais() {
  if (!auth.checkLogin()) return;

  const tab = config.getCurrentTab();
  try {
    if (tab === 'habitos') {
      const habitos = await api.fetchHabitos();
      // Passa os "handlers" para o renderizador
      ui.renderHabitos(habitos, handleEditItem, handleDeleteItem);
    } else {
      const vicios = await api.fetchVicios();
      // Passa os "handlers" para o renderizador
      ui.renderVicios(vicios, handleCeder, handleControlar, handleEditItem, handleDeleteItem);
    }
  } catch (erro) {
    console.error(`Erro ao carregar ${tab}:`, erro);
    ui.renderHabitos([], handleEditItem, handleDeleteItem); // Limpa em caso de erro
    ui.renderVicios([], handleCeder, handleControlar, handleEditItem, handleDeleteItem); // Limpa em caso de erro
  }
}

/** Lida com a mudança de aba */
function handleTabChange(novaTab) {
  config.setCurrentTab(novaTab);
  ui.updateActiveTab(novaTab);
  carregarDadosAtuais();
}

/** Lida com o clique em "Salvar" ou "Atualizar" no modal */
async function handleSaveItem() {
  const { nomeHabito, descricao, tipo } = ui.getHabitFormData();
  const itemId = config.getEditandoId();

  if (!nomeHabito.trim()) {
    alert('Por favor, insira um nome.');
    return;
  }

  try {
    if (itemId) {
      // Atualizando
      await api.updateItem(tipo, itemId, nomeHabito, descricao);
      alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} atualizado com sucesso!`);
    } else {
      // Criando (a lógica de limite de 3 itens foi mantida no backend)
      await api.createItem(tipo, nomeHabito, descricao);
      alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} criado com sucesso!`);
    }
    
    ui.closeHabitModal();
    carregarDadosAtuais();
    
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao salvar: ${erro.message}`);
  }
}

/** Lida com o clique para editar um item (abre o modal) */
function handleEditItem(item, tipo) {
  if (item) {
    // Editando item existente
    ui.openHabitModal(tipo, item);
  } else {
    // Criando novo item (clicou no card vazio)
    ui.openHabitModal(tipo, null);
  }
}

/** Lida com o clique para deletar um item */
async function handleDeleteItem(itemId, tipo) {
  if (!confirm(`Tem certeza que deseja excluir este ${tipo === 'vicio' ? 'vício' : 'hábito'}?`)) return;

  try {
    await api.deleteItem(tipo, itemId);
    alert(`${tipo === 'vicio' ? 'Vício' : 'Hábito'} excluído com sucesso!`);
    carregarDadosAtuais();
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao excluir: ${erro.message}`);
  }
}

/** Lida com "Ceder ao Vício" */
async function handleCeder(vicioId) {
  if (!confirm('Deseja marcar que cedeu ao vício hoje? Isso reiniciará sua sequência.')) return;
  
  try {
    await api.cederVicio(vicioId);
    alert('Registrado! Amanhã é um novo dia para recomeçar! 💪');
    carregarDadosAtuais();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao registrar: ' + erro.message);
  }
}

/** Lida com "Controlar Vício" */
async function handleControlar(vicioId) {
  try {
    await api.controlarVicio(vicioId);
    alert('Parabéns! Mais um dia sem ceder ao vício! 🎉');
    carregarDadosAtuais();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao registrar: ' + erro.message);
  }
}

/** Lida com "Trocar Senha" */
async function handleChangePassword() {
  const senhaAntiga = prompt('Digite sua senha atual:');
  const senhaNova = prompt('Digite sua nova senha:');
  if (!senhaAntiga || !senhaNova) return;

  try {
    await auth.changePassword(senhaAntiga, senhaNova);
    alert('Senha alterada com sucesso!');
  } catch (erro) {
    console.error(erro);
    alert('Erro ao trocar senha: ' + erro.message);
  }
}

/** Lida com "Deletar Conta" */
async function handleDeleteAccount() {
  if (!confirm('Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.')) return;
  
  try {
    await auth.deleteAccount();
  } catch (erro) {
    console.error(erro);
    alert('Erro ao deletar conta: ' + erro.message);
  }
}


// --- INICIALIZAÇÃO ---

async function init() {
  // 1. Carrega a URL da API
  try {
    const apiConfig = await api.fetchApiConfig();
    config.setApiUrl(apiConfig.apiUrl);
  } catch (erro) {
    console.error('Erro ao carregar a configuração da API:', erro);
    // Você pode definir uma URL padrão aqui se quiser
    // config.setApiUrl('http://localhost:3000'); 
  }

  // 2. Verifica se está logado
  if (!auth.checkLogin()) return;
  
  const username = auth.getUsername();

  // 3. Configura a UI
  ui.setupProfileMenu(username, auth.logout, () => ui.openSettingsModal(username));
  ui.setupTabs(handleTabChange);
  ui.setupModalListeners(handleSaveItem, handleChangePassword, handleDeleteAccount);
  
  // 4. Carrega os dados iniciais
  ui.updateActiveTab(config.getCurrentTab());
  await carregarDadosAtuais();
}

// Inicia a aplicação quando a página carregar
window.addEventListener('load', init);