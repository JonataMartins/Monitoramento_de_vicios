const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;

  try {
    // Pega a URL da API (mantido)
    const configResponse = await fetch('/api/config');
    const config = await configResponse.json();
    const API_URL = config.apiUrl;

    // Faz a requisição para o login (mantido)
    const response = await fetch(API_URL + '/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_usuario, senha }),
    });

    const result = await response.json();

    if (response.ok) {

      // Se o login foi bem-sucedido:
      if (result.usuario) {

        localStorage.setItem('nome_usuario', result.usuario.nome_usuario);
        localStorage.setItem('user_id', result.usuario.id);

        alert(result.message);
        window.location.href = 'habitos.html';
      } else {
        // Caso o retorno seja inesperado, mas response.ok
        localStorage.setItem('nome_usuario', nome_usuario);
        alert('Login bem-sucedido!');
        window.location.href = 'habitos.html';
      }
    } else {
      alert(result.message);
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao tentar fazer login');
  }
});