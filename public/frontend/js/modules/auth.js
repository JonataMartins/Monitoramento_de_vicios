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

/**
 * Realiza uma requisição à API injetando automaticamente o header JWT.
 * Lida com a URL da API e a validação básica de resposta.
 * * @param {string} endpoint - O caminho da API (ex: '/usuario/logout')
 * @param {object} options - Opções do fetch (method, body, etc.)
 * @returns {Promise<object | void>} - O resultado JSON da resposta
 */
async function requestAutenticado(endpoint, options = {}) {
  const token = getToken();
  const apiUrl = getApiUrl();
  const nomeUsuario = getUsername();

  // Configuração dos headers, priorizando JWT
  let headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    // Método moderno: autenticação via JWT Header
    headers['Authorization'] = `Bearer ${token}`;
  } else if (options.body && nomeUsuario) {
    // Fallback Legado: Adicionar nome_usuario ao body se não houver token.
    // Necessário para manter a compatibilidade da lógica original (sem JWT)
    try {
      const bodyObj = JSON.parse(options.body);
      bodyObj.nome_usuario = nomeUsuario;
      options.body = JSON.stringify(bodyObj);
    } catch (e) {
      // Se o body não for JSON, ignora.
    }
  }

  const response = await fetch(apiUrl + endpoint, {
    ...options,
    headers: headers
  });

  if (!response.ok) {
    // Lógica de tratamento de erro centralizada
    const errorText = await response.text();
    let errorMessage = 'Erro desconhecido na requisição.';

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorText;
    } catch {
      errorMessage = errorText;
    }

    throw new Error(errorMessage);
  }

  // Retorna JSON apenas se houver conteúdo (para evitar erros em DELETE/POST sem body)
  if (response.headers.get('content-length') === '0' || response.status === 204) {
    return;
  }

  return response.json();
}


export async function logout() {
  try {
    // A autenticação e o tratamento de token são feitos dentro de requestAutenticado
    await requestAutenticado('/usuario/logout', { method: 'POST' });
  } catch (erro) {
    // Ignora erros no logout (comportamento original mantido)
  } finally {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

export async function changePassword(senhaAntiga, senhaNova) {
  // Removido: Captura de nomeUsuario e construção de fetch
  // Adicionado: Uso de requestAutenticado

  // Nota: O nome_usuario é incluído no body APENAS se o token não existir (Fallback Legacy)
  await requestAutenticado('/usuario/trocarSenha', {
    method: 'PUT',
    body: JSON.stringify({
      senha_antiga: senhaAntiga,
      senha_nova: senhaNova
    })
  });
  // O requestAutenticado lida com o throw new Error()
}

export async function deleteAccount() {
  // Removido: Captura de nomeUsuario e construção de fetch
  // Adicionado: Uso de requestAutenticado

  await requestAutenticado('/usuario/delete', {
    method: 'DELETE',
    body: JSON.stringify({}) // Body vazio, nome_usuario é injetado como fallback se não houver token
  });

  // Lógica de UI/Navegação mantida no nível da função, mas o erro API é tratado antes.
  localStorage.clear();
  alert('Conta deletada com sucesso!');
  window.location.href = 'login.html';
}