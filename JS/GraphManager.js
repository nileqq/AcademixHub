// # ---- Менеджер графа ---- #

class GraphManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.events = [];
        this.vertexWidth = 80;
        this.vertexHeight = 80;
        this.selectedEvent = null;
        this.connections = [];
        
        if (!this.container) {
            console.error('Контейнер графа не найден:', containerId);
            return;
        }
        
        this.initContainer();
    }

    /**
     * Инициализирует контейнер графа
     */
    initContainer() {
        // Обработчики для контейнера
        this.setupContainerListeners();
    }

    /**
     * Настройка обработчиков для контейнера
     */
    setupContainerListeners() {
        // Клик по пустому месту сбрасывает выбор
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.selectedEvent = null;
                const deselectEvent = new CustomEvent('eventDeselected');
                document.dispatchEvent(deselectEvent);
            }
        });
    }

    /**
     * Добавляет мероприятие
     */
    addEvent(eventData) {
        const event = new Event(eventData);
        
        this.events.push(event);
        this.renderEvent(event);
        this.renderAllConnections();
        
        return event;
    }

    /**
     * Удаляет мероприятие
     */
    removeEvent(eventId) {
        const index = this.events.findIndex(e => e.id == eventId);
        if (index === -1) return false;
        
        // Удаляем DOM-элемент
        const event = this.events[index];
        if (event.element) {
            event.element.remove();
        }
        
        // Удаляем из массива
        this.events.splice(index, 1);
        
        // Обновляем связи
        this.renderAllConnections();
        
        return true;
    }

    /**
     * Обновляет мероприятие
     */
    updateEvent(eventId, data) {
        const event = this.events.find(e => e.id == eventId);
        if (!event) return false;
        
        event.update(data);
        this.renderAllConnections();
        
        return true;
    }

    /**
     * Отображает мероприятие на графе
     */
    renderEvent(event) {
        const element = event.createElement();
        
        // Для центральной вершины - особый обработчик
        if (event.isCenter) {
            element.style.cursor = 'default';
        } else {
            // Обработчик клика для выбора
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectEvent(event);
            });
            
            // Настраиваем перетаскивание
            this.setupEventDragging(event, element);
        }
        
        // Добавляем в контейнер
        this.container.appendChild(element);
        
        return element;
    }

    /**
     * Настраивает перетаскивание для мероприятия
     */
    setupEventDragging(event, element) {
        let isDragging = false;
        let offsetX, offsetY;
        let startX, startY;
        
        element.addEventListener('mousedown', (e) => {
            // Если вершина подсвечена - блокируем перетаскивание
            if (element.classList.contains('highlighted')) {
                e.stopPropagation();
                return;
            }
            
            isDragging = true;
            startX = event.x;
            startY = event.y;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
            element.style.zIndex = '10';
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left - offsetX;
            const y = e.clientY - rect.top - offsetY;
            
            event.moveTo(x, y, {
                width: rect.width,
                height: rect.height
            });
            
            this.renderAllConnections();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.zIndex = '2';
            
            // Если позиция изменилась - можно сохранить
            if (event.x !== startX || event.y !== startY) {
                // Здесь можно вызвать сохранение
            }
        });
    }

    /**
     * Отображает все связи
     */
    renderAllConnections() {
        this.clearConnections();
        
        // Получаем центральную вершину если есть
        const centerVertex = this.events.find(event => event.isCenter);
        
        // Рисуем связи между обычными вершинами
        for (let i = 0; i < this.events.length; i++) {
            const event1 = this.events[i];
            if (event1.isCenter) continue;
            
            // Связи с другими обычными вершинами
            for (let j = i + 1; j < this.events.length; j++) {
                const event2 = this.events[j];
                if (event2.isCenter) continue;
                
                this.drawConnection(event1, event2);
            }
            
            // Связи с центральной вершиной
            if (centerVertex) {
                this.drawConnection(event1, centerVertex, 'center-connection');
            }
        }
    }

    /**
     * Рисует связь между двумя мероприятиями
     */
    drawConnection(event1, event2, type = null) {
        if (!event1.element || !event2.element) return;
        
        // Определяем тип связи если не указан
        if (!type) {
            type = this.getConnectionType(event1, event2);
            if (!type) return;
        }
        
        const line = this.createConnectionLine(event1, event2, type);
        this.container.appendChild(line);
        this.connections.push(line);
    }

    /**
     * Определяет тип связи
     */
    getConnectionType(event1, event2) {
        if (hasCommon(event1.tags, event2.tags)) {
            return 'tag';
        } else if (hasCommon(event1.errors, event2.errors)) {
            return 'error';
        }
        return null;
    }

    /**
     * Создает линию связи
     */
    createConnectionLine(event1, event2, type) {
        const rect1 = event1.element.getBoundingClientRect();
        const rect2 = event2.element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const x1 = rect1.left - containerRect.left + rect1.width / 2;
        const y1 = rect1.top - containerRect.top + rect1.height / 2;
        const x2 = rect2.left - containerRect.left + rect2.width / 2;
        const y2 = rect2.top - containerRect.top + rect2.height / 2;
        
        const line = document.createElement('div');
        line.className = `line-connection ${type}`;
        
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.width = length + 'px';
        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        
        // Добавляем подсказку
        if (type === 'center-connection') {
            line.title = `Связь с центром`;
        } else {
            line.title = `Схожесть: ${event1.calculateSimilarity(event2).toFixed(2)}`;
        }
        
        return line;
    }

    /**
     * Очищает все связи
     */
    clearConnections() {
        this.connections.forEach(line => line.remove());
        this.connections = [];
    }

    /**
     * Выбирает мероприятие
     */
    selectEvent(event) {
        this.selectedEvent = event;
        
        // Генерируем событие выбора
        const selectEvent = new CustomEvent('eventSelected', {
            detail: { event }
        });
        document.dispatchEvent(selectEvent);
    }

    /**
     * Получает выбранное мероприятие
     */
    getSelectedEvent() {
        return this.selectedEvent;
    }

    /**
     * Фильтрует мероприятия
     */
    filterEvents(filter) {
        this.events.forEach(event => {
            const matches = event.matchesFilter(filter);
            if (event.element) {
                event.element.style.display = matches ? 'block' : 'none';
            }
        });
        
        this.renderAllConnections();
    }

    /**
     * Получает все мероприятия
     */
    getAllEvents() {
        return this.events;
    }

    /**
     * Находит мероприятие по ID
     */
    getEventById(id) {
        return this.events.find(e => e.id == id);
    }

    /**
     * Получает центральную вершину
     */
    getCenterVertex() {
        return this.events.find(event => event.isCenter);
    }
}