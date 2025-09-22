// Função para criar conta
document.getElementById("createAccountForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;
  const confirmar_senha = document.getElementById("confirmar_senha").value;

  if (senha !== confirmar_senha) {
    alert('As senhas não coincidem.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/usuario/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome_usuario, senha, confirmar_senha }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      // Redireciona para a página de login
      window.location.href = 'login.html';
    } else {
      alert(result.message);
    }
  } catch (erro) {
    console.error('Erro ao criar conta:', erro);
    alert('Erro ao tentar criar a conta.');
  }
});
