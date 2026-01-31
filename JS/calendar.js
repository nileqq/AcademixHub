// ===== Настройки =====
let currentUser = null; // роль пользователя будет подгружена из JSON
const rooms = ["Актовый зал", "Спортзал"];
const hours = Array.from({length: 12}, (_, i) => 8 + i + ":00"); // 8:00 - 19:00
const bookings = {}; // Занятость по дате

// ===== Получение текущего пользователя из JSON =====
fetch('../db/users.json')
    .then(res => res.json())
    .then(users => {
        // Здесь можно выбрать пользователя по ИИН или другому идентификатору
        currentUser = users.find(u => u.role); // просто берем первого для примера
        createCalendar();
    })
    .catch(err => console.error("Ошибка при загрузке users.json:", err));

// ===== Создание календаря =====
const calendarEl = document.getElementById("calendar");
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

function daysInMonth(month, year) {
    return new Date(year, month+1, 0).getDate();
}

// Массив с названиями месяцев
const monthNames = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

// Показываем календарь на месяц вперёд
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
const displayMonth = nextMonth.getMonth();
const displayYear = nextMonth.getFullYear();

function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function createCalendar() {
    calendarEl.innerHTML = ""; // очищаем старый календарь
    const days = daysInMonth(displayMonth, displayYear);

    for (let d = 1; d <= days; d++) {
        const dayDate = new Date(displayYear, displayMonth, d);
        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.textContent = d;

        if (dayDate < today) dayEl.classList.add("past");
        if (d === today.getDate() && displayMonth === today.getMonth() && displayYear === today.getFullYear()) {
            dayEl.classList.add("today");
        }

        dayEl.onclick = () => {
            if (dayDate < today) return; // прошлые дни некликабельны
            openSchedule(dayDate);
        }

        calendarEl.appendChild(dayEl);
    }
}


// ===== Открытие расписания =====
const scheduleContainer = document.getElementById("schedule-container");
const scheduleBody = document.getElementById("schedule-body");
const selectedDateEl = document.getElementById("selected-date");
const addBookingEl = document.getElementById("add-booking");

function openSchedule(date) {
    const dateStr = date.toISOString().split("T")[0];

    // Отображаем день и месяц
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    selectedDateEl.textContent = `${day} ${month} ${date.getFullYear()}`;

    scheduleContainer.classList.remove("hide");

    // Инициализация занятости
    if (!bookings[dateStr]) {
        bookings[dateStr] = {};
        hours.forEach(h => {
            bookings[dateStr][h] = {};
            rooms.forEach(r => bookings[dateStr][h][r] = "");
        });
    }

    renderSchedule(dateStr);
}


function renderSchedule(dateStr) {
    scheduleBody.innerHTML = "";
    hours.forEach(h => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${h}</td>` + rooms.map(r => `<td>${bookings[dateStr][h][r] || "-"}</td>`).join("");
        scheduleBody.appendChild(tr);
    });

    // Форма добавления теперь всегда видна
    addBookingEl.classList.remove("hide");
}


// ===== Добавление занятости =====
document.getElementById("save-booking").onclick = () => {
    const time = document.getElementById("booking-time").value;
    const room = document.getElementById("booking-room").value;
    const purpose = document.getElementById("booking-purpose").value;

    if (!time || !purpose) return alert("Заполните все поля");

    const dateStr = new Date(selectedDateEl.textContent).toISOString().split("T")[0];
    bookings[dateStr][time][room] = purpose;

    renderSchedule(dateStr);

    document.getElementById("booking-time").value = "";
    document.getElementById("booking-purpose").value = "";
}


// ===== Закрытие расписания =====
document.getElementById("close-schedule").onclick = () => {
    scheduleContainer.classList.add("hide");
}
