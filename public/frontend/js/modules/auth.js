import { getApiUrl } from './config.js';

// --- Funções de Leitura ---

export function getUsername() {
  return localStorage.getItem('nome_usuario');
}

export function getToken() {
  return localStorage.getItem('authToken');
}

export function checkLogin() {
  if (!getUsername()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// --- Funções de Ação (que chamam a API) ---

export async function logout() {
  try {
    const token = getToken();
    if (token) {
      await fetch(getApiUrl() + '/usuario/logout', {
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

export async function changePassword(senhaAntiga, senhaNova) {
  const nomeUsuario = getUsername();
  const resposta = await fetch(getApiUrl() + '/usuario/trocarSenha', {
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
}

export async function deleteAccount() {
  const nomeUsuario = getUsername();
  const resposta = await fetch(getApiUrl() + '/usuario/delete', {
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
}