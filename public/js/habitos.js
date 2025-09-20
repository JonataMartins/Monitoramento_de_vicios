// Função para carregar hábitos
async function carregarHabitos() {
  try {
    const resposta = await fetch('http://localhost:3000/habitos');
    const habitos = await resposta.json();
    
    const habitosList = document.getElementById('habitosList');
    habitos.forEach(habito => {
      const li = document.createElement('li');
      li.textContent = habito.nome;  // Ajuste conforme o que você quiser exibir
      habitosList.appendChild(li);
    });
  } catch (erro) {
    console.error('Erro ao carregar hábitos:', erro);
  }
}

// Chamar a função para carregar os hábitos ao carregar a página
window.onload = carregarHabitos;
