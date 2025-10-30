// Variáveis de estado global
let API_URL = '';
let editandoHabitoId = null;
let currentTab = 'habitos';

// Funções "Setters" para alterar o estado de forma controlada
export function setApiUrl(url) {
  API_URL = url;
}

export function setEditandoId(id) {
  editandoHabitoId = id;
}

export function setCurrentTab(tab) {
  currentTab = tab;
}

// Funções "Getters" para ler o estado
export function getApiUrl() {
  return API_URL;
}

export function getEditandoId() {
  return editandoHabitoId;
}

export function getCurrentTab() {
  return currentTab;
}