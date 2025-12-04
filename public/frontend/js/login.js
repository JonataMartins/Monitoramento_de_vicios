const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;

  try {
    const configResponse = await fetch('/api/config');
    const config = await configResponse.json();
    const API_URL = config.apiUrl;

    const response = await fetch(API_URL + '/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_usuario, senha }),
    });

    const result = await response.json();

    if (response.ok) {
      
      if (result.token && result.usuario) {
        localStorage.setItem('jwt_token', result.token); 
        
        localStorage.setItem('nome_usuario', result.usuario.nome_usuario);
        localStorage.setItem('user_id', result.usuario.id);

        alert(result.message);
        window.location.href = 'habitos.html';
      } else {
        alert('Login bem-sucedido, mas o token não foi recebido.');
      }
    } else {
      alert(result.message);
    }
  } catch (erro) {
    console.error(erro);
    alert('Erro ao tentar fazer login');
  }
});