const API_URL = "../backend/api.php";
let token = null;

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API_URL + "?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();

  if (data.success) {
    token = data.token;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("main-section").style.display = "block";
    document.getElementById("user-display").innerText = username;
    loadHabits();
  } else {
    document.getElementById("auth-msg").innerText = data.message || "Login inválido!";
  }
}

async function addHabit() {
  const name = document.getElementById("habit-name").value;
  if (!name) return;

  await fetch(API_URL + "?action=addHabit", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name })
  });

  loadHabits();
  document.getElementById("habit-name").value = '';
}

async function loadHabits() {
  const res = await fetch(API_URL + "?action=getHabits", {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await res.json();

  const habitList = document.getElementById("habit-list");
  habitList.innerHTML = "";

  data.forEach(habit => {
    const div = document.createElement("div");
    div.classList.add("habit");
    div.innerHTML = `<h3>${habit.name}</h3><p>Desde: ${habit.start}</p>`;
    habitList.appendChild(div);
  });
}
