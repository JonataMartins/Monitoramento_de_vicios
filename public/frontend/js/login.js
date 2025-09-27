const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;

  try {
    const response = await fetch('${process.env.API_URL}/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_usuario, senha }),
    });

    const result = await response.json();

    if (response.ok) {
      // **CORRIGIDO: Verificar se o token existe antes de salvar**
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('nome_usuario', result.usuario.nome_usuario);
        localStorage.setItem('user_id', result.usuario.id);
        
        alert(result.message);
        window.location.href = 'habitos.html';
      } else {
        // Se não há token, usar a abordagem antiga
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