// # ---- Класс мероприятия ---- #

class Event {
    constructor(data) {
        this.id = data.id || Date.now() + Math.random();
        this.title = data.title || 'Новая запись';

        // Новые портфолио-поля
        this.description = data.description || '';
        this.portfolioType = data.portfolioType || data.type || 'project';
        this.result = data.result || '';
        this.reflection = data.reflection || '';

        // Старые поля (оставляем для совместимости/рекомендаций)
        this.tags = Array.isArray(data.tags) ? data.tags : parseTags(data.tags || '');
        this.errors = Array.isArray(data.errors) ? data.errors : parseTags(data.errors || '');
        this.contacts = data.contacts || '';

        this.budget = parseInt(data.budget) || 0;
        this.date = data.date || '';
        this.participants = parseInt(data.participants) || 1;

        this.x = data.x || 0;
        this.y = data.y || 0;

        this.element = null;
        this.isCenter = data.isCenter || false;
    }





    /**
     * Обновляет данные мероприятия
     */
    update(data) {
        if (data.title !== undefined) this.title = data.title;

        // портфолио
        if (data.description !== undefined) this.description = data.description;
        if (data.portfolioType !== undefined) this.portfolioType = data.portfolioType;
        if (data.result !== undefined) this.result = data.result;
        if (data.reflection !== undefined) this.reflection = data.reflection;

        // совместимость
        if (data.tags !== undefined) {
        this.tags = Array.isArray(data.tags) ? data.tags : parseTags(data.tags || '');
        }
        if (data.errors !== undefined) {
        this.errors = Array.isArray(data.errors) ? data.errors : parseTags(data.errors || '');
        }
        if (data.contacts !== undefined) this.contacts = data.contacts;
        if (data.budget !== undefined) this.budget = parseInt(data.budget) || 0;
        if (data.date !== undefined) this.date = data.date;
        if (data.participants !== undefined) this.participants = parseInt(data.participants) || 1;

        if (this.element) this.element.textContent = this.title;
    }

    /**
     * Рассчитывает схожесть с другим мероприятием
     */
    calculateSimilarity(otherEvent, weights = {
        tags: 0.4,
        budget: 0.25,
        date: 0.2,
        participants: 0.15
    }) {
        // Схожесть по тегам
        const tagSimilarity = this.calculateTagSimilarity(otherEvent);
        
        // Схожесть по бюджету
        const budgetSimilarity = this.calculateBudgetSimilarity(otherEvent);
        
        // Схожесть по датам
        const dateSimilarity = this.calculateDateSimilarity(otherEvent);
        
        // Схожесть по количеству участников
        const participantsSimilarity = this.calculateParticipantsSimilarity(otherEvent);
        
        // Используем среднеквадратичное среднее
        const similarities = [tagSimilarity, budgetSimilarity, dateSimilarity, participantsSimilarity];
        const sumOfSquares = similarities.reduce((sum, val) => sum + val * val, 0);
        
        return Math.sqrt(sumOfSquares / similarities.length);
    }

    /**
     * Схожесть по тегам
     */
    calculateTagSimilarity(otherEvent) {
        const commonTags = this.tags.filter(tag => otherEvent.tags.includes(tag)).length;
        const totalTags = new Set([...this.tags, ...otherEvent.tags]).size;
        
        if (totalTags === 0) return 1;
        
        return (commonTags / totalTags) * 2;
    }

    /**
     * Схожесть по бюджету
     */
    calculateBudgetSimilarity(otherEvent) {
        return calculateSimilarityValue(this.budget, otherEvent.budget);
    }

    /**
     * Схожесть по датам
     */
    calculateDateSimilarity(otherEvent) {
        return calculateDateSimilarity(this.date, otherEvent.date);
    }

    /**
     * Схожесть по количеству участников
     */
    calculateParticipantsSimilarity(otherEvent) {
        return calculateSimilarityValue(this.participants, otherEvent.participants);
    }

    /**
     * Возвращает данные для отображения в сайдбаре
     */
    getInfoData() {
        return {
        title: this.title,
        description: this.description,
        type: this.portfolioType,
        tags: this.tags.join(', '),
        errors: this.errors.join(', '),
        result: this.result,
        date: formatDate(this.date),
        reflection: this.reflection
        };
    }

    /**
     * Проверяет, соответствует ли мероприятие фильтру
     */
    matchesFilter(filter) {
    if (!filter) return true;

    // tag
    if (filter.tag) {
        const normTag = normalizeTag(filter.tag);
        const ok = this.tags.some(t => t.toLowerCase().includes(normTag.toLowerCase()));
        if (!ok) return false;
    }

    // type
    if (filter.type) {
        if ((this.portfolioType || '') !== filter.type) return false;
    }

    // onlyWithErrors
    if (filter.onlyWithErrors) {
        if (!this.errors || this.errors.length === 0) return false;
    }

    // date range
    if (filter.dateFrom || filter.dateTo) {
        if (!this.date) return false; // если фильтруем по датам — записи без даты скрываем
        const d = new Date(this.date);
        if (filter.dateFrom) {
        const from = new Date(filter.dateFrom);
        if (d < from) return false;
        }
        if (filter.dateTo) {
        const to = new Date(filter.dateTo);
        // чтобы включать весь день "to"
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
        }
    }

    return true;
    }

    /**
     * Создает DOM-элемент для мероприятия
     */
    createElement() {
        const div = document.createElement('div');
        div.classList.add('vertex');
        
        if (this.isCenter) {
            div.classList.add('center-vertex');
        }
        
        div.style.left = this.x + 'px';
        div.style.top = this.y + 'px';
        div.textContent = this.title;
        div.dataset.eventId = this.id;
        div.title = this.title;
        
        this.element = div;
        return div;
    }

    /**
     * Перемещает мероприятие
     */
    moveTo(x, y, container) {
        // Раньше мы "зажимали" координаты в пределах видимого контейнера,
        // что ломает идею бесконечной сетки (нельзя утащить вершину дальше экрана).
        // Теперь clamp делаем только если явно передали границы.
        if (container && typeof container.width === 'number' && typeof container.height === 'number') {
            this.x = Math.max(0, Math.min(x, container.width - 80));
            this.y = Math.max(0, Math.min(y, container.height - 80));
        } else {
            this.x = x;
            this.y = y;
        }
        
        if (this.element) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
}
