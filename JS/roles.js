function applyRoleAccess(role) {
    document.getElementById("scButton").style.display = "none";
    document.getElementById("shanyrButton").style.display = "none";

    if (role === "Сотрудник СК") {
        document.getElementById("scButton").style.display = "block";
    }

    if (role === "Лидер шанырака") {
        document.getElementById("shanyrButton").style.display = "block";
    }
}
