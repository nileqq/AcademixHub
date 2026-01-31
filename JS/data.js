let users = [];

fetch("db/users.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Ошибка загрузки users.json");
        }
        return response.json();
    })
    .then(data => {
        users = data;
        console.log("Пользователи загружены:", users);
    })
    .catch(error => {
        console.error("Ошибка:", error);
    });
