let menu = { breakfast: "", lunch: "", dinner: "" };
let attendance = { breakfast: [], lunch: [], dinner: [] };
let wasteData = [];
let loginTimestamps = {};
let selectedLogin = "";
let currentStudentName = "";

function updateDateTime() {
  document.getElementById("datetime").innerText = new Date().toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

function showLogin(type) {
  selectedLogin = type;
  document.getElementById("login-selection").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("student-name").style.display = type === "student" ? "block" : "none";
}

function goBack() {
  selectedLogin = "";
  document.getElementById("password").value = "";
  document.getElementById("student-name").value = "";
  document.getElementById("login-selection").classList.remove("hidden");
  ['login-section', 'student-panel', 'admin-panel'].forEach(id =>
    document.getElementById(id).classList.add("hidden")
  );
  document.querySelectorAll('.admin-box').forEach(b => b.classList.add('hidden'));
}

function login() {
  const pwd = document.getElementById("password").value;
  const name = document.getElementById("student-name").value;
  if (selectedLogin === "student" && pwd === "0000" && name) {
    const now = Date.now();
    const last = loginTimestamps[name] || 0;
    if (now - last < 4 * 3600e3) {
      return alert("You can log in only once every 4 hours.");
    }
    loginTimestamps[name] = now;
    currentStudentName = name;
    document.getElementById("student-greet-name").innerText = name;
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("student-panel").classList.remove("hidden");

    // Disable buttons if already marked
    ["breakfast", "lunch", "dinner"].forEach(meal => {
      const { ref, onValue } = window.firebaseFunctions;
      onValue(ref(window.db, `attendance/${meal}`), snapshot => {
        const data = snapshot.val() || [];
        document.getElementById(`btn-${meal}`).disabled = data.includes(name);
      });
    });

  } else if (selectedLogin === "admin" && pwd === "1111") {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("admin-panel").classList.remove("hidden");
    updateAttendanceView();
    updateWasteSummary();
  } else {
    alert("Incorrect credentials!");
  }
}

function updateMenu() {
  const { ref, set } = window.firebaseFunctions;
  ["breakfast", "lunch", "dinner"].forEach(m => {
    const val = document.getElementById(`input-${m}`).value;
    menu[m] = val;
    set(ref(window.db, `menu/${m}`), val);
  });
  alert("Menu updated!");
}

function listenToMenuUpdates() {
  const { ref, onValue } = window.firebaseFunctions;
  ["breakfast", "lunch", "dinner"].forEach(m => {
    onValue(ref(window.db, `menu/${m}`), snapshot => {
      const val = snapshot.val() || "";
      menu[m] = val;
      document.getElementById(`menu-${m}`).innerText = val;
    });
  });
}
listenToMenuUpdates();

function sendFoodMessage() {
  const num = document.getElementById("contact-number").value;
  num.length >= 8
    ? alert(`Message sent to ${num}: "Food is available, please collect it."`)
    : alert("Enter a valid number!");
}

function updateWaste() {
  const total = ["breakfast", "lunch", "dinner"]
    .reduce((sum, m) => sum + (parseFloat(document.getElementById(`waste-${m}`).value) || 0), 0);
  wasteData.push(total);
  document.getElementById("total-waste-today").innerText = total.toFixed(2);
  updateWasteSummary();
}

function updateWasteSummary() {
  const sum = wasteData.reduce((a, b) => a + b, 0);
  document.getElementById("weekly-waste").innerText = sum.toFixed(2);
}

function showAdminSection(sec) {
  document.querySelectorAll('.admin-box').forEach(b => b.classList.add('hidden'));
  document.getElementById(`admin-${sec}`).classList.remove('hidden');
}

function updateAttendanceView() {
  ["breakfast", "lunch", "dinner"].forEach(meal => {
    getFirebaseAttendance(meal, data => {
      attendance[meal] = data;
      document.getElementById(`list-${meal}`).innerText = data.join(", ");
      document.getElementById(`count-${meal}`).innerText = data.length;
    });
  });
}

function getFirebaseAttendance(meal, callback) {
  const { ref, onValue } = window.firebaseFunctions;
  onValue(ref(window.db, `attendance/${meal}`), snapshot => {
    callback(snapshot.val() || []);
  });
}

function resetAttendance() {
  const { ref, set } = window.firebaseFunctions;
  if (confirm("Are you sure you want to reset today's attendance?")) {
    ["breakfast", "lunch", "dinner"].forEach(meal => {
      set(ref(window.db, `attendance/${meal}`), []);
    });
    alert("Attendance reset successfully!");
  }
}

function markAttendance(meal) {
  const name = currentStudentName;
  if (!name) return alert("Name missing");

  const { ref, get, set } = window.firebaseFunctions;
  const mealRef = ref(window.db, `attendance/${meal}`);

  get(mealRef).then(snapshot => {
    const data = snapshot.exists() ? snapshot.val() : [];
    if (!data.includes(name)) {
      data.push(name);
      set(mealRef, data).then(() => {
        document.getElementById(`btn-${meal}`).disabled = true;
        alert(`${meal.charAt(0).toUpperCase() + meal.slice(1)} marked for ${name}`);
        updateAttendanceView();
      });
    } else {
      alert("Already marked!");
      document.getElementById(`btn-${meal}`).disabled = true;
    }
  });
}
