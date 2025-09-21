// Função para criar conta
document.getElementById("createAccountForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;
  const confirmar_senha = document.getElementById("confirmar_senha").value;

  // Verificar se as senhas coincidem
  if (senha !== confirmar_senha) {
    alert('As senhas não coincidem.');
    return;
  }

  // Enviar a requisição com todos os dados necessários (incluindo 'confirmar_senha')
  const response = await fetch('http://localhost:3000/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome_usuario, senha, confirmar_senha }),
  });

  const result = await response.json();
  if (response.ok) {
    alert(result.message);
    window.location.href = 'index.html';
  } else {
    alert(result.message);
  }
});
