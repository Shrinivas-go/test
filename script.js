// script.js

const {
  ref,
  set,
  get,
  onValue
} = window.firebaseFunctions;
const db = window.db;

let currentUser = "";

function showLogin(type) {
  document.getElementById("login-selection").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("login-title").innerText = type === 'student' ? "Student Login" : "Admin Login";
  document.getElementById("student-name").style.display = type === 'student' ? "block" : "none";
  currentUser = type;
}

function goBack() {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById("login-selection").classList.remove("hidden");
}

function login() {
  const password = document.getElementById("password").value;

  if (currentUser === 'admin') {
    if (password === "admin123") {
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("admin-panel").classList.remove("hidden");
      fetchMenu();
      fetchAttendance();
    } else alert("Invalid admin password");
  } else {
    const name = document.getElementById("student-name").value;
    if (name.trim()) {
      document.getElementById("student-greet-name").innerText = name;
      document.getElementById("login-section").classList.add("hidden");
      document.getElementById("student-panel").classList.remove("hidden");
      currentUser = name;
      fetchMenu();
    } else alert("Enter your name");
  }
}

function updateMenu() {
  const breakfast = document.getElementById("input-breakfast").value;
  const lunch = document.getElementById("input-lunch").value;
  const dinner = document.getElementById("input-dinner").value;

  const menuRef = ref(db, "menu");
  get(menuRef).then(snapshot => {
    const data = snapshot.val();
    if (data?.locked) {
      alert("Menu is locked. Please reset before updating.");
    } else {
      set(menuRef, {
        breakfast,
        lunch,
        dinner,
        locked: true
      }).then(() => {
        alert("Menu updated");
        fetchMenu();
      });
    }
  });
}

function resetMenu() {
  set(ref(db, "menu"), {
    breakfast: "",
    lunch: "",
    dinner: "",
    locked: false
  }).then(() => {
    alert("Menu reset");
    fetchMenu();
  });
}

function fetchMenu() {
  const menuRef = ref(db, "menu");
  onValue(menuRef, snapshot => {
    const data = snapshot.val();
    document.getElementById("menu-breakfast").innerText = data?.breakfast || "";
    document.getElementById("menu-lunch").innerText = data?.lunch || "";
    document.getElementById("menu-dinner").innerText = data?.dinner || "";

    document.getElementById("input-breakfast").value = data?.breakfast || "";
    document.getElementById("input-lunch").value = data?.lunch || "";
    document.getElementById("input-dinner").value = data?.dinner || "";
  });
}

function markAttendance(meal) {
  const name = currentUser;
  const today = new Date().toISOString().split('T')[0];

  const attRef = ref(db, `attendance/${today}/${meal}/${name}`);
  set(attRef, true).then(() => alert("Attendance marked"));
}

function fetchAttendance() {
  const today = new Date().toISOString().split('T')[0];

  ["breakfast", "lunch", "dinner"].forEach(meal => {
    const mealRef = ref(db, `attendance/${today}/${meal}`);
    onValue(mealRef, snapshot => {
      const data = snapshot.val() || {};
      document.getElementById(`count-${meal}`).innerText = Object.keys(data).length;
      document.getElementById(`list-${meal}`).innerText = Object.keys(data).join(', ');
    });
  });
}

function resetAttendance() {
  const today = new Date().toISOString().split('T')[0];
  set(ref(db, `attendance/${today}`), {}).then(() => {
    alert("Attendance reset");
    fetchAttendance();
  });
}

function showAdminSection(section) {
  ["admin-attendance", "admin-menu", "admin-taker", "admin-waste"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(`admin-${section}`).classList.remove("hidden");
}

function sendFoodMessage() {
  alert("Message sent to contact: " + document.getElementById("contact-number").value);
}

function updateWaste() {
  const b = parseFloat(document.getElementById("waste-breakfast").value) || 0;
  const l = parseFloat(document.getElementById("waste-lunch").value) || 0;
  const d = parseFloat(document.getElementById("waste-dinner").value) || 0;
  const total = b + l + d;

  document.getElementById("total-waste-today").innerText = total;
  document.getElementById("weekly-waste").innerText = total * 7;
}

setInterval(() => {
  const now = new Date();
  document.getElementById("datetime").innerText = now.toLocaleString();
}, 1000);
