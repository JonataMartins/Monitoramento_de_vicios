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
  
  // Console.log para verificar a resposta do servidor
  console.log(result);
  if (response.ok) {
    alert(result.message);
    window.location.href = 'habitos.html'; 
  } else {
    alert(result.message);
  }
});
