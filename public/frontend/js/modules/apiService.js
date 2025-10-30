import { getApiUrl } from './config.js';
import { getUsername } from './auth.js';

/**
 * Função helper genérica para requisições
 * Isso evita repetição de código
 */
async function request(endpoint, method, body) {
  const url = getApiUrl() + endpoint;
  const nomeUsuario = getUsername();
  
  // Adiciona nome_usuario ao corpo, se existir
  let requestBody = body ? { ...body, nome_usuario: nomeUsuario } : { nome_usuario: nomeUsuario };

  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  };
  
  // GET e DELETE (padrão) não têm body
  if (method === 'GET' || (method === 'DELETE' && !body)) {
     if (method === 'POST' && (endpoint === '/habito' || endpoint === '/vicio')) {
     } else {
        delete options.body;
     }
  }
  
  // Lógica para DELETE
  if (method === 'DELETE' && body) {
     options.body = JSON.stringify(body);
  }
  
  // Lógica para carregar
  if (method === 'POST' && (endpoint === '/habito' || endpoint === '/vicio') && Object.keys(body).length === 0) {
      options.body = JSON.stringify({ nome_usuario: nomeUsuario });
  }

  const resposta = await fetch(url, options);

  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.message);
  }
  
  try {
    return await resposta.json();
  } catch (e) {
    return { ok: true };
  }
}

// --- Funções da API ---

export async function fetchApiConfig() {
  const configResponse = await fetch('/api/config');
  return await configResponse.json();
}

export async function fetchHabitos() {
  return request('/habito', 'POST', {});
}

export async function fetchVicios() {
  return request('/vicio', 'POST', {});
}

export async function createItem(tipo, nome_habito, descricao) {
  const endpoint = tipo === 'vicio' ? '/vicio/create' : '/habito/create';
  return request(endpoint, 'POST', { nome_habito, descricao });
}

export async function updateItem(tipo, itemId, nome_habito, descricao) {
  const endpoint = tipo === 'vicio' ? `/vicio/${itemId}` : `/habito/${itemId}`;
  return request(endpoint, 'PUT', { nome_habito, descricao });
}

export async function deleteItem(tipo, itemId) {
  const endpoint = tipo === 'vicio' ? '/vicio/delete' : '/habito/delete';
  // Corpo especial para delete, como no seu original
  const body = {
    nome_usuario: getUsername(),
    habito_id: itemId
  };
  
  const url = getApiUrl() + endpoint;
  const resposta = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!resposta.ok) {
    const erro = await resposta.json();
    throw new Error(erro.message);
  }
  return { ok: true };
}

export async function cederVicio(vicioId) {
  return request(`/vicio/${vicioId}/ceder`, 'POST', {});
}

export async function controlarVicio(vicioId) {
  return request(`/vicio/${vicioId}/controlado`, 'POST', {});
}

// Função para buscar um item (para edição)
export async function fetchItem(tipo, itemId) {
    const items = tipo === 'vicio' ? await fetchVicios() : await fetchHabitos();
    return items.find(h => h._id === itemId);
}