// Пример данных объявлений
const announcements = [
    {
        title: "Математическая олимпиада",
        deadline: "2026-02-15",
        type: "Соревнование",
        field: "Математика"
    },
    {
        title: "Курс по программированию",
        deadline: "2026-02-20",
        type: "Обучение",
        field: "Информационные технологии"
    },
    {
        title: "Турнир по баскетболу",
        deadline: "2026-03-01",
        type: "Соревнование",
        field: "Спорт"
    }
];

const container = document.getElementById("announcements-container");

// Отображение объявлений
announcements.forEach(a => {
    const div = document.createElement("div");
    div.className = "announcement";

    div.innerHTML = `
        <h2>${a.title}</h2>
        <p>Дедлайн регистрации: <span>${a.deadline}</span></p>
        <p>Тип: <span>${a.type}</span></p>
        <p>Сфера: <span>${a.field}</span></p>
    `;

    container.appendChild(div);
});

// Кнопка назад (пока без ссылки)
document.getElementById("back-button").onclick = () => {
    // Здесь вы можете добавить редирект
    console.log("Назад нажата");
};
