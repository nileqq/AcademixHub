// # ---- Менеджер графа ---- #

class GraphManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.events = [];
        this.vertexWidth = 80;
        this.vertexHeight = 80;
        this.selectedEvent = null;
        // Рёбра (DOM-линии)
        this.connections = [];
        this.connectionMap = new Map(); // key -> { line, e1, e2, type }
        this._connectionsNeedRebuild = true;
        this._rafConnections = null;
        
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
        this.rebuildConnections();
        this.scheduleConnectionsLayout();
        
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
        this.rebuildConnections();
        this.scheduleConnectionsLayout();
        
        return true;
    }

    /**
     * Обновляет мероприятие
     */
    updateEvent(eventId, data) {
        const event = this.events.find(e => e.id == eventId);
        if (!event) return false;
        
        event.update(data);
        this.rebuildConnections();
        this.scheduleConnectionsLayout();
        
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
        let offsetX = 0, offsetY = 0;
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

            // IMPORTANT:
            // Канвас трансформируется (translate + scale), поэтому e.offsetX/offsetY
            // и clientX->rect... даёт неверные координаты в мире.
            // Берём мировые координаты через InfiniteCanvas.
            const canvas = window.infiniteCanvas;
            if (canvas && canvas.getCanvasCoordinates) {
                const p = canvas.getCanvasCoordinates(e.clientX, e.clientY);
                offsetX = p.x - event.x;
                offsetY = p.y - event.y;
            } else {
                // fallback (если по какой-то причине canvas недоступен)
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            }
            element.style.zIndex = '10';
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const canvas = window.infiniteCanvas;
            let x, y;
            if (canvas && canvas.getCanvasCoordinates) {
                const p = canvas.getCanvasCoordinates(e.clientX, e.clientY);
                x = p.x - offsetX;
                y = p.y - offsetY;
                // Привязка к сетке
                const snapped = canvas.snapToGrid(x, y);
                x = snapped.x;
                y = snapped.y;
            } else {
                const rect = this.container.getBoundingClientRect();
                x = e.clientX - rect.left - offsetX;
                y = e.clientY - rect.top - offsetY;
            }

            event.moveTo(x, y);
            this.scheduleConnectionsLayout();
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
     * (Новая версия) Мы больше не удаляем и не пересоздаём рёбра при каждом движении мыши.
     * Теперь:
     * 1) rebuildConnections() — пересчитывает список существующих рёбер (создаёт/удаляет DOM при необходимости)
     * 2) scheduleConnectionsLayout() — обновляет позиционирование рёбер через requestAnimationFrame
     */
    rebuildConnections() {
        // Помечаем, что нужен пересчёт набора рёбер
        this._connectionsNeedRebuild = true;
    }

    scheduleConnectionsLayout() {
        if (this._rafConnections) return;
        this._rafConnections = requestAnimationFrame(() => {
            this._rafConnections = null;
            this.layoutConnections();
        });
    }

    layoutConnections() {
        // 1) при необходимости обновляем набор рёбер (создание/удаление)
        if (this._connectionsNeedRebuild) {
            this._connectionsNeedRebuild = false;
            this.syncConnectionSet();
        }

        // 2) обновляем геометрию всех линий БЕЗ getBoundingClientRect()
        for (const entry of this.connectionMap.values()) {
            const { line, e1, e2 } = entry;
            this.updateConnectionLineGeometry(line, e1, e2);
        }
    }

    /**
     * Пересчитывает геометрию линии в "мировых" координатах canvas.
     * Главное отличие от старой реализации:
     * - мы не вызываем getBoundingClientRect() на каждом кадре (это триггерит layout),
     * - используем event.x/event.y и известные размеры вершин.
     * Так ребра обновляются намного плавнее.
     */
    updateConnectionLineGeometry(line, event1, event2) {
        if (!line || !event1 || !event2) return;

        const w = this.vertexWidth;
        const h = this.vertexHeight;

        const x1 = event1.x + w / 2;
        const y1 = event1.y + h / 2;
        const x2 = event2.x + w / 2;
        const y2 = event2.y + h / 2;

        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        line.style.width = length + 'px';
        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.transform = `rotate(${angle}deg)`;

        // Подсказка (title) оставляем — удобно.
        if (line.classList.contains('center-connection')) {
            line.title = 'Связь с центром';
        } else {
            line.title = `Схожесть: ${event1.calculateSimilarity(event2).toFixed(2)}`;
        }
    }


    syncConnectionSet() {
        const desired = new Map();

        const centerVertex = this.events.find(e => e.isCenter);
        const regular = this.events.filter(e => !e.isCenter && e.element && e.element.style.display !== 'none');

        // Рёбра между обычными вершинами (только если есть причина: общие теги/ошибки)
        for (let i = 0; i < regular.length; i++) {
            for (let j = i + 1; j < regular.length; j++) {
                const e1 = regular[i];
                const e2 = regular[j];
                const type = this.getConnectionType(e1, e2);
                if (!type) continue;
                const key = this.makeConnectionKey(e1, e2, type);
                desired.set(key, { e1, e2, type });
            }
        }

        // Рёбра «обычная -> центр» (всегда)
        if (centerVertex && centerVertex.element && centerVertex.element.style.display !== 'none') {
            for (const e of regular) {
                const key = this.makeConnectionKey(e, centerVertex, 'center-connection');
                desired.set(key, { e1: e, e2: centerVertex, type: 'center-connection' });
            }
        }

        // Удаляем лишние
        for (const [key, entry] of this.connectionMap.entries()) {
            if (!desired.has(key)) {
                entry.line.remove();
                this.connectionMap.delete(key);
            }
        }

        // Добавляем недостающие
        for (const [key, spec] of desired.entries()) {
            if (this.connectionMap.has(key)) continue;
            const line = document.createElement('div');
            line.className = `line-connection ${spec.type}`;
            this.container.appendChild(line);
            this.connectionMap.set(key, { line, ...spec });
        }
    }

    makeConnectionKey(e1, e2, type) {
        const a = String(e1.id);
        const b = String(e2.id);
        const [id1, id2] = a < b ? [a, b] : [b, a];
        return `${id1}|${id2}|${type}`;
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

        this.rebuildConnections();
        this.scheduleConnectionsLayout();
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
