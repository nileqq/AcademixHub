// # ---- Вспомогательные функции ---- #

/**
 * Парсит теги из строки
 */
function parseTags(str) {
    if (!str) return [];
    return str
        .split(/[, ]+/)
        .map(t => normalizeTag(t.trim()))
        .filter(tag => tag !== '#' && tag !== '');
}

/**
 * Нормализует тег (добавляет # если нужно)
 */
function normalizeTag(t) {
    if (!t) return '';
    return t.startsWith('#') ? t : '#' + t;
}

/**
 * Проверяет есть ли общие элементы в двух массивах
 */
function hasCommon(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0) return false;
    const setB = new Set(b);
    return a.some(x => setB.has(x));
}

/**
 * Рассчитывает схожесть двух числовых значений по формуле
 */
function calculateSimilarityValue(a, b) {
    if (a === 0 && b === 0) return 2;
    
    const sum = a + b;
    if (sum === 0) return 0;
    
    return 2 - (2 * Math.abs(a - b)) / sum;
}

/**
 * Рассчитывает схожесть двух дат (в днях)
 */
function calculateDateSimilarity(dateStr1, dateStr2) {
    if (!dateStr1 || !dateStr2) return 1;
    
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const maxDiff = 30;
    const normalizedDiff = Math.min(diffDays / maxDiff, 1);
    
    return 2 - (normalizedDiff * 2);
}

/**
 * Получает цвет для значения схожести
 */
function getSimilarityClass(similarity) {
    if (similarity >= 1.5) {
        return { className: 'high', label: 'Высокая' };
    } else if (similarity >= 1.0) {
        return { className: 'medium', label: 'Средняя' };
    } else {
        return { className: 'low', label: 'Низкая' };
    }
}

/**
 * Форматирует дату для отображения
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Не указана';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
}

/**
 * Форматирует число с разделителями
 */
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Проверяет, пустая ли строка
 */
function isEmpty(str) {
    return !str || !str.trim();
}

// Делаем функции доступными глобально
window.parseTags = parseTags;
window.normalizeTag = normalizeTag;
window.hasCommon = hasCommon;
window.calculateSimilarityValue = calculateSimilarityValue;
window.calculateDateSimilarity = calculateDateSimilarity;
window.getSimilarityClass = getSimilarityClass;
window.formatDate = formatDate;
window.formatNumber = formatNumber;
window.isEmpty = isEmpty;