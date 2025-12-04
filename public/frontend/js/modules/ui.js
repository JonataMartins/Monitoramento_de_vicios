import { setEditandoId } from './config.js';

// --- Função Auxiliar de Tolerância a Falhas no DOM ---
/**
 * Anexa um event listener a um seletor dentro de um container,
 * prevenindo falhas caso o elemento não exista.
 */
function safeAddListener(container, selector, handler) {
  const element = container.querySelector(selector);
  if (element) {
    element.addEventListener('click', handler);
  } else {
    // Opcional: Adicionar um log de aviso para depuração
    // console.warn(`Elemento com seletor '${selector}' não encontrado no container.`);
  }
}

// --- Funções de Renderização ---

export function renderHabitos(habitos, onEdit, onDelete) {
  const cards = document.querySelectorAll('#contentHabitos .add-habit-card');
  const emptyState = document.getElementById('emptyStateHabitos');

  // Limpa os cards
  cards.forEach((card, index) => {
    card.innerHTML = `<i>📝</i><span>Adicione seu hábito</span>`;
    // Usa onEdit apenas se for uma função válida
    card.onclick = typeof onEdit === 'function' ? () => onEdit(null, 'habito') : null;
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled');
  });

  if (!habitos || habitos.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Preenche
  habitos.forEach((habito, index) => {
    if (index < cards.length) {
      const card = cards[index];
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${habito.nome_habito}</h3>
          ${habito.descricao ? `<p class="habit-description">${habito.descricao}</p>` : ''}
          <div class="habit-card-actions">
            <button class="icon-btn small-btn edit-btn" title="Editar">✏️</button>
            <button class="icon-btn small-btn delete-btn" title="Excluir">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled');

      // Adiciona listeners usando a função segura
      safeAddListener(card, '.edit-btn', (e) => {
        e.stopPropagation();
        // Garante que onEdit é uma função antes de chamar
        if (typeof onEdit === 'function') onEdit(habito, 'habito');
      });

      safeAddListener(card, '.delete-btn', (e) => {
        e.stopPropagation();
        // Garante que onDelete é uma função antes de chamar
        if (typeof onDelete === 'function') onDelete(habito._id, 'habito');
      });
    }
  });
}

export function renderVicios(vicios, onCeder, onControlar, onEdit, onDelete) {
  const cards = document.querySelectorAll('#contentVicios .add-habit-card');
  const emptyState = document.getElementById('emptyStateVicios');

  // Limpa
  cards.forEach((card, index) => {
    card.innerHTML = `<i>🚫</i><span>Adicione seu vício</span>`;
    // Usa onEdit apenas se for uma função válida
    card.onclick = typeof onEdit === 'function' ? () => onEdit(null, 'vicio') : null;
    card.style.cursor = 'pointer';
    card.classList.remove('habit-card-filled', 'vicio-card-filled');
  });

  if (!vicios || vicios.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Preenche
  vicios.forEach((vicio, index) => {
    if (index < cards.length) {
      const card = cards[index];
      // CORREÇÃO: Usando o template string original para preservar o CSS/Layout
      card.innerHTML = `
        <div class="habit-card-content">
          <h3>${vicio.nome_habito}</h3>
          ${vicio.descricao ? `<p class="habit-description">${vicio.descricao}</p>` : ''}
          <div class="streak-info current-streak">📅 Sequência atual: ${vicio.sequencia_atual || 0} dias</div>
          <div class="streak-info best-streak">🏆 Melhor sequência: ${vicio.melhor_sequencia || 0} dias</div>
          <div class="streak-info total-days">📊 Total controlado: ${vicio.total_dias || 0} dias</div>
          <div class="habit-card-actions">
            <button class="ceder-btn">🚫 Ceder hoje</button>
            <button class="controlado-btn">✅ Controlado hoje</button>
            <button class="icon-btn small-btn edit-btn" title="Editar">✏️</button>
            <button class="icon-btn small-btn delete-btn" title="Excluir">🗑️</button>
          </div>
        </div>
      `;
      card.onclick = null;
      card.style.cursor = 'default';
      card.classList.add('habit-card-filled', 'vicio-card-filled');

      // Listeners usando a função segura e verificando callbacks (MANTIDO)
      safeAddListener(card, '.ceder-btn', (e) => {
        e.stopPropagation();
        if (typeof onCeder === 'function') onCeder(vicio._id);
      });

      safeAddListener(card, '.controlado-btn', (e) => {
        e.stopPropagation();
        if (typeof onControlar === 'function') onControlar(vicio._id);
      });

      safeAddListener(card, '.edit-btn', (e) => {
        e.stopPropagation();
        if (typeof onEdit === 'function') onEdit(vicio, 'vicio');
      });

      safeAddListener(card, '.delete-btn', (e) => {
        e.stopPropagation();
        if (typeof onDelete === 'function') onDelete(vicio._id, 'vicio');
      });
    }
  });
}

// --- Funções de UI (Modals, Tabs, etc) ---

export function setupTabs(onTabChange) {
  // Verificação de callbacks
  const handler = typeof onTabChange === 'function' ? onTabChange : (tab) => console.warn(`onTabChange não é uma função: ${tab}`);

  // Adiciona listeners de forma segura
  safeAddListener(document, '#tabHabitos', () => handler('habitos'));
  safeAddListener(document, '#tabVicios', () => handler('vicios'));
}

export function updateActiveTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  if (tab === 'habitos') {
    const tabHabitos = document.getElementById('tabHabitos');
    const contentHabitos = document.getElementById('contentHabitos');
    if (tabHabitos) tabHabitos.classList.add('active');
    if (contentHabitos) contentHabitos.classList.add('active');
  } else {
    const tabVicios = document.getElementById('tabVicios');
    const contentVicios = document.getElementById('contentVicios');
    if (tabVicios) tabVicios.classList.add('active');
    if (contentVicios) contentVicios.classList.add('active');
  }
}

export function openHabitModal(tipo, item) {
  const modalTitle = document.getElementById('modalHabitTitle');
  const saveBtn = document.getElementById('saveHabit');

  if (item) { // Editando
    // Verifica e chama setEditandoId (de ./config.js)
    if (typeof setEditandoId === 'function') setEditandoId(item._id);

    if (modalTitle) modalTitle.textContent = tipo === 'vicio' ? 'Editar Vício' : 'Editar Hábito';
    const habitName = document.getElementById('habitName');
    const habitDescription = document.getElementById('habitDescription');

    if (habitName) habitName.value = item.nome_habito || '';
    if (habitDescription) habitDescription.value = item.descricao || '';

    if (saveBtn) saveBtn.textContent = 'Atualizar';
  } else { // Criando
    if (typeof setEditandoId === 'function') setEditandoId(null);

    if (modalTitle) modalTitle.textContent = tipo === 'vicio' ? 'Adicionar Novo Vício' : 'Adicionar Novo Hábito';

    const habitName = document.getElementById('habitName');
    const habitDescription = document.getElementById('habitDescription');

    if (habitName) habitName.value = '';
    if (habitDescription) habitDescription.value = '';

    if (saveBtn) saveBtn.textContent = 'Salvar';
  }

  const habitType = document.getElementById('habitType');
  if (habitType) habitType.value = tipo;

  const modal = document.getElementById('addHabitModal');
  if (modal) modal.classList.add('active');
}

export function closeHabitModal() {
  const modal = document.getElementById('addHabitModal');
  if (modal) modal.classList.remove('active');
  // Garante que o ID de edição seja limpo mesmo se o modal não existir
  if (typeof setEditandoId === 'function') setEditandoId(null);
}

export function getHabitFormData() {
  // Usa verificações para garantir que os elementos existam
  const nomeHabito = document.getElementById('habitName')?.value || '';
  const descricao = document.getElementById('habitDescription')?.value || '';
  const tipo = document.getElementById('habitType')?.value || '';

  return { nomeHabito, descricao, tipo };
}

export function setupProfileMenu(username, onLogout, onSettings) {
  const profileMenu = document.getElementById('profileMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');

  const usernameElement = document.getElementById('username');
  if (usernameElement) usernameElement.textContent = username || 'Usuário';

  if (profileMenu && dropdownMenu) {
    profileMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (profileMenu && dropdownMenu && !profileMenu.contains(e.target)) {
      dropdownMenu.classList.remove('active');
    }
  });

  // Adiciona listeners de forma segura e verifica callbacks
  safeAddListener(document, '#logout', typeof onLogout === 'function' ? onLogout : () => { });

  safeAddListener(document, '#settings', () => {
    if (dropdownMenu) dropdownMenu.classList.remove('active');
    if (typeof onSettings === 'function') onSettings();
  });
}

export function openSettingsModal(username) {
  const userNameInput = document.getElementById('userName');
  if (userNameInput) userNameInput.value = username || 'Usuário';

  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('active');
}

export function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

export function setupModalListeners(onSave, onChangePassword, onDeleteAccount) {

  // Funções de verificação e chamada para os callbacks
  const safeSave = typeof onSave === 'function' ? onSave : () => console.error('onSave não é uma função.');
  const safeChangePassword = typeof onChangePassword === 'function' ? onChangePassword : () => console.error('onChangePassword não é uma função.');
  const safeDeleteAccount = typeof onDeleteAccount === 'function' ? onDeleteAccount : () => console.error('onDeleteAccount não é uma função.');

  // Modal de Hábito
  safeAddListener(document, '#closeAddHabitModal', closeHabitModal);
  safeAddListener(document, '#cancelAddHabit', closeHabitModal);
  safeAddListener(document, '#saveHabit', safeSave);

  // Modal de Configurações
  safeAddListener(document, '#closeSettingsModal', closeSettingsModal);
  safeAddListener(document, '#changePassword', safeChangePassword);
  safeAddListener(document, '#deleteAccount', safeDeleteAccount);

  // Fechar ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') closeHabitModal();
    if (e.target.id === 'settingsModal') closeSettingsModal();
  });
}