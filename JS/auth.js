function login() {
    const iin = document.getElementById("loginIin").value;
    const user = users.find(u => u.iin === iin);

    if (!user) {
        alert("Пользователь не найден");
        return;
    }

    openProfile(user);
}

function openProfile(user) {
    document.getElementById("iin").textContent = user.iin;
    document.getElementById("name").textContent = user.name;
    document.getElementById("surname").textContent = user.surname;
    document.getElementById("grade").textContent = user.grade;
    document.getElementById("role").textContent = user.role;

    document.getElementById("home").style.display = "none";
    document.getElementById("register").style.display = "none";
    document.getElementById("profile").style.display = "block";

    applyRoleAccess(user.role);
}

function goBack() { document.getElementById("profile").style.display = "none"; document.getElementById("home").style.display = "block"; } function openRegister() { document.getElementById("home").style.display = "none"; document.getElementById("register").style.display = "block"; } function goHome() { document.getElementById("register").style.display = "none"; document.getElementById("profile").style.display = "none"; document.getElementById("home").style.display = "block"; }

function register() { const iin = document.getElementById("regIin").value; const name = document.getElementById("regName").value; const surname = document.getElementById("regSurname").value; const grade = document.getElementById("regGrade").value; const role = document.getElementById("regRole").value; if (!iin || !name || !surname || !grade) { alert("Заполните все поля"); return; } const exists = users.find(u => u.iin === iin); if (exists) { alert("Пользователь с таким ИИН уже существует"); return; } const newUser = { iin, name, surname, grade, role }; users.push(newUser);document.getElementById("iin").textContent = newUser.iin; document.getElementById("name").textContent = newUser.name; document.getElementById("surname").textContent = newUser.surname; document.getElementById("grade").textContent = newUser.grade; document.getElementById("role").textContent = newUser.role; openProfile(newUser); }