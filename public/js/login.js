// Função para fazer login
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome_usuario = document.getElementById("nome_usuario").value;
  const senha = document.getElementById("senha").value;

  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome_usuario, senha }),
  });

  const result = await response.json();
  
  // Adicionar um console.log para verificar a resposta do servidor
  console.log(result); // Exibe a resposta completa para ajudar no debug
  
  if (response.ok) {
    alert(result.message);
    window.location.href = 'habitos.html';  // Redireciona para a página de hábitos
  } else {
    alert(result.message);
  }
});
