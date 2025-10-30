import { setEditandoId } from './config.js';

// --- Funções de Renderização ---

export function renderHabitos(habitos, onEdit, onDelete) {
  const cards = document.querySelectorAll('#contentHabitos .add-habit-card');
  const emptyState = document.getElementById('emptyStateHabitos');
  
  // Limpa os cards
  cards.forEach((card, index) => {
    card.innerHTML = `<i>📝</i><span>Adicione seu hábito</span>`;
    card.onclick = () => onEdit(null, 'habito'); // null indica "novo"
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
      
      // Adiciona listeners em vez de onclick inline
      card.querySelector('.edit-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onEdit(habito, 'habito'); // Passa o objeto habito
      });
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onDelete(habito._id, 'habito');
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
    card.onclick = () => onEdit(null, 'vicio'); // null indica "novo"
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
      
      // Listeners
      card.querySelector('.ceder-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onCeder(vicio._id);
      });
      card.querySelector('.controlado-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onControlar(vicio._id);
      });
      card.querySelector('.edit-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onEdit(vicio, 'vicio');
      });
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          onDelete(vicio._id, 'vicio');
      });
    }
  });
}

// --- Funções de UI (Modals, Tabs, etc) ---

export function setupTabs(onTabChange) {
  document.getElementById('tabHabitos').addEventListener('click', () => onTabChange('habitos'));
  document.getElementById('tabVicios').addEventListener('click', () => onTabChange('vicios'));
}

export function updateActiveTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  if (tab === 'habitos') {
    document.getElementById('tabHabitos').classList.add('active');
    document.getElementById('contentHabitos').classList.add('active');
  } else {
    document.getElementById('tabVicios').classList.add('active');
    document.getElementById('contentVicios').classList.add('active');
  }
}

export function openHabitModal(tipo, item) {
  const modalTitle = document.getElementById('modalHabitTitle');
  const saveBtn = document.getElementById('saveHabit');
  
  if (item) { // Editando
    setEditandoId(item._id);
    modalTitle.textContent = tipo === 'vicio' ? 'Editar Vício' : 'Editar Hábito';
    document.getElementById('habitName').value = item.nome_habito;
    document.getElementById('habitDescription').value = item.descricao || '';
    saveBtn.textContent = 'Atualizar';
  } else { // Criando
    setEditandoId(null);
    modalTitle.textContent = tipo === 'vicio' ? 'Adicionar Novo Vício' : 'Adicionar Novo Hábito';
    document.getElementById('habitName').value = '';
    document.getElementById('habitDescription').value = '';
    saveBtn.textContent = 'Salvar';
  }
  
  document.getElementById('habitType').value = tipo;
  document.getElementById('addHabitModal').classList.add('active');
}

export function closeHabitModal() {
  document.getElementById('addHabitModal').classList.remove('active');
  setEditandoId(null);
}

export function getHabitFormData() {
  return {
    nomeHabito: document.getElementById('habitName').value,
    descricao: document.getElementById('habitDescription').value,
    tipo: document.getElementById('habitType').value
  };
}

export function setupProfileMenu(username, onLogout, onSettings) {
  const profileMenu = document.getElementById('profileMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  
  document.getElementById('username').textContent = username || 'Usuário';

  profileMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
  });

  window.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) dropdownMenu.classList.remove('active');
  });

  document.getElementById('logout').addEventListener('click', onLogout);
  document.getElementById('settings').addEventListener('click', () => {
    dropdownMenu.classList.remove('active');
    onSettings();
  });
}

export function openSettingsModal(username) {
  document.getElementById('userName').value = username || 'Usuário';
  document.getElementById('settingsModal').classList.add('active');
}

export function closeSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
}

export function setupModalListeners(onSave, onChangePassword, onDeleteAccount) {
  // Modal de Hábito
  document.getElementById('closeAddHabitModal').addEventListener('click', closeHabitModal);
  document.getElementById('cancelAddHabit').addEventListener('click', closeHabitModal);
  document.getElementById('saveHabit').addEventListener('click', onSave);
  
  // Modal de Configurações
  document.getElementById('closeSettingsModal').addEventListener('click', closeSettingsModal);
  document.getElementById('changePassword').addEventListener('click', onChangePassword);
  document.getElementById('deleteAccount').addEventListener('click', onDeleteAccount);

  // Fechar ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target.id === 'addHabitModal') closeHabitModal();
    if (e.target.id === 'settingsModal') closeSettingsModal();
  });
}