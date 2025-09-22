// Verifica login
function checarLogin() {
  if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
  }
}

// Carrega hábitos
async function carregarHabitos() {
  try {
    const token = localStorage.getItem('authToken');
    const resposta = await fetch('http://localhost:3000/habito', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resposta.ok) throw new Error('Erro ao buscar hábitos');

    const habitos = await resposta.json();
    const habitosList = document.getElementById('habitosList');
    habitosList.innerHTML = '';

    habitos.forEach(h => {
      const li = document.createElement('li');
      li.textContent = h.nome_habito;
      habitosList.appendChild(li);
    });
  } catch (erro) {
    console.error(erro);
  }
}

// Menu perfil
function setupPerfil() {
  const profileMenu = document.getElementById('profileMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const usernameEl = document.getElementById('username');

  usernameEl.textContent = localStorage.getItem('nome_usuario') || 'Usuário';

  profileMenu.addEventListener('click', () => {
    dropdownMenu.classList.toggle('active');
  });

  window.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target)) dropdownMenu.classList.remove('active');
  });

  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('nome_usuario');
    window.location.href = 'login.html';
  });

  document.getElementById('settings').addEventListener('click', () => {
    alert('Configurações (a implementar)');
  });
}

window.onload = () => {
  checarLogin();
  setupPerfil();
  carregarHabitos();
};
