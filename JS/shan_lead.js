// ===== Данные =====
const shanyraks = [
    { name: "Самғау", points: 610 },
    { name: "Алтын Ұя", points: 520 },
    { name: "Тұлпар", points: 470 },
    { name: "Бірлік", points: 430 },
    { name: "Жігер", points: 390 }
];

const changes = [
    { name: "Самғау", diff: 30 },
    { name: "Тұлпар", diff: 0 },
    { name: "Бірлік", diff: -10 }
];

const contributors = [
    { name: "Айдана", surname: "Серикова", grade: "10A", score: 120 },
    { name: "Алихан", surname: "Нурбаев", grade: "11B", score: 95 },
    { name: "Диас", surname: "Канатов", grade: "9C", score: 80 }
];

const tasks = [
    {
        title: "Эссе о развитии шанырака",
        description: "Напишите эссе (1–2 страницы) о развитии шанырака.",
        deadline: "20.02.2026"
    },
    {
        title: "Отчёт о мероприятии",
        description: "Загрузите PDF-отчёт с фото.",
        deadline: "25.02.2026"
    }
];

// ===== Рейтинг =====
const ratingList = document.getElementById("ratingList");
shanyraks.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "item";
    if (i === 0) div.classList.add("gold");
    if (i === 1) div.classList.add("silver");
    if (i === 2) div.classList.add("bronze");
    div.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.points}</span>`;
    ratingList.appendChild(div);
});

// ===== Изменения =====
const changesList = document.getElementById("changesList");
changes.forEach(c => {
    let cls = "neutral";
    let text = "0";
    if (c.diff > 0) { cls = "up"; text = `+${c.diff}`; }
    else if (c.diff < 0) { cls = "down"; text = c.diff; }

    const div = document.createElement("div");
    div.className = "change-item";
    div.innerHTML = `<span>${c.name}</span><span class="${cls}">${text}</span>`;
    changesList.appendChild(div);
});

// ===== Contributors =====
const contributorsList = document.getElementById("contributorsList");
contributors.forEach(c => {
    const div = document.createElement("div");
    div.className = "contributor";
    div.innerHTML = `
        <div>
            <strong>${c.name} ${c.surname}</strong><br>
            <small>Класс: ${c.grade}</small>
        </div>
        <span>${c.score}</span>
    `;
    contributorsList.appendChild(div);
});

// ===== Задания =====
const taskBoard = document.getElementById("taskBoard");
tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task.title;
    li.onclick = () => openTask(task);
    taskBoard.appendChild(li);
});

// ===== Модалка =====
function openTask(task) {
    document.getElementById("task-title").textContent = task.title;
    document.getElementById("task-desc").textContent = task.description;
    document.getElementById("task-deadline").textContent = task.deadline;
    document.getElementById("task-modal").classList.remove("hide");
}

function closeTask() {
    document.getElementById("task-modal").classList.add("hide");
}

function submitTask() {
    const file = document.getElementById("task-file").files[0];
    if (!file) return alert("Прикрепите файл");
    alert(`Файл "${file.name}" отправлен ✅`);
    closeTask();
}
