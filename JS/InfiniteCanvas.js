// # ---- Бесконечный канвас ---- #

class InfiniteCanvas {
    constructor(containerId) {
        console.log('🟡 Создание InfiniteCanvas с ID:', containerId);
        
        // Ищем контейнер разными способами
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.log('🟡 Не нашли по ID, ищем по классу .infinite-canvas-container');
            this.container = document.querySelector('.infinite-canvas-container');
        }
        
        if (!this.container) {
            console.log('🟡 Не нашли по классу, ищем любую подходящую структуру');
            this.container = document.querySelector('main .infinite-canvas-container, main [id*="canvas"]');
        }
        
        console.log('🟡 Найден контейнер:', this.container);
        
        if (!this.container) {
            console.error('❌ InfiniteCanvas: Контейнер не найден!');
            console.error('❌ Искали ID:', containerId);
            console.error('❌ Доступные элементы в DOM:');
            console.error(document.querySelectorAll('main > div'));
            return;
        }
        
        // Определяем canvas элемент
        // Если контейнер сам имеет класс .infinite-canvas, то он и есть canvas
        if (this.container.classList.contains('infinite-canvas')) {
            this.canvas = this.container;
            console.log('✅ Контейнер и canvas - один элемент (имеет класс .infinite-canvas)');
        } else {
            // Ищем .infinite-canvas внутри контейнера
            this.canvas = this.container.querySelector('.infinite-canvas');
            console.log('✅ Canvas найден внутри контейнера:', this.canvas);
        }
        
        // Если canvas не найден, но контейнер есть - создаем canvas
        if (this.container && !this.canvas) {
            console.log('🟡 Canvas не найден, создаем...');
            this.canvas = document.createElement('div');
            this.canvas.className = 'infinite-canvas';
            this.container.appendChild(this.canvas);
            console.log('✅ Canvas создан автоматически');
        }
        
        if (!this.canvas) {
            console.error('❌ InfiniteCanvas: Canvas элемент не создан!');
            return;
        }
        
        console.log('✅ InfiniteCanvas создан успешно');
        console.log('✅ Container:', this.container);
        console.log('✅ Canvas:', this.canvas);
        
        this.events = [];
        this.connections = [];
        
        // Параметры канваса
        this.position = { x: 0, y: 0 };
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 3;
        this.gridSize = 50;
        
        // Состояние перетаскивания
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragStartPosition = { x: 0, y: 0 };
        

        this.centerVertex = null;
        this.init();
    }
    
    /**
     * Инициализация канваса
     */
    init() {
        console.log('🟡 InfiniteCanvas init() запущен');
        
        if (!this.container) {
            console.error('❌ InfiniteCanvas init: Контейнер не найден');
            return;
        }
        
        if (!this.canvas) {
            console.error('❌ InfiniteCanvas init: Canvas не найден');
            return;
        }
        
        console.log('✅ Container размеры:', this.container.offsetWidth, 'x', this.container.offsetHeight);
        console.log('✅ Canvas размеры:', this.canvas.offsetWidth, 'x', this.canvas.offsetHeight);
        
        this.setupEventListeners();
        this.createGrid();
        this.updateView();
        this.setupNavigation();
        this.createCenterVertex();
        
        console.log('✅ InfiniteCanvas полностью инициализирован');


    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        console.log('🟡 Настройка обработчиков событий...');
        
        if (!this.container) {
            console.error('❌ Не могу настроить обработчики: нет контейнера');
            return;
        }
        
        // Перетаскивание канваса
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Зум колесиком мыши
        this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Touch события для мобильных
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Обновление индикатора при движении
        this.container.addEventListener('mousemove', this.updatePositionIndicator.bind(this));
        
        console.log('✅ Обработчики событий настроены');
    }
    
    /**
     * Создание сетки
     */
    createGrid() {
        console.log('🟡 Создание сетки...');
        
        if (!this.canvas) {
            console.error('❌ Не могу создать сетку: нет canvas');
            return;
        }
        
        // Очищаем старую сетку
        document.querySelectorAll('.grid-line').forEach(line => line.remove());
        
        // Создаем вертикальные линии
        for (let x = 0; x <= 200; x++) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = (x * this.gridSize) + 'px';
            line.style.top = '0';
            line.style.opacity = '0.5';
            this.canvas.appendChild(line);
        }
        
        // Создаем горизонтальные линии
        for (let y = 0; y <= 200; y++) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.left = '0';
            line.style.top = (y * this.gridSize) + 'px';
            line.style.opacity = '0.5';
            this.canvas.appendChild(line);
        }
        
        console.log('✅ Сетка создана: 200x200 линий, размер ячейки', this.gridSize, 'px');
    }
    
    /**
     * Обновление вида канваса
     */
    updateView() {
        if (!this.canvas) return;
        
        this.canvas.style.transform = `
            translate(${this.position.x}px, ${this.position.y}px)
            scale(${this.scale})
        `;
        
        // Обновляем индикатор
        this.updatePositionIndicator();
        this.updateZoomIndicator();
    }
    
    /**
     * Обработчик нажатия мыши
     */
    handleMouseDown(e) {
        // Игнорируем клики на вершины
        if (e.target.classList.contains('vertex') || 
            e.target.closest('.vertex')) {
            return;
        }
        
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.dragStartPosition = { ...this.position };
        this.container.classList.add('dragging');
        e.preventDefault();
    }
    
    /**
     * Обработчик движения мыши
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        this.position.x = this.dragStartPosition.x + deltaX;
        this.position.y = this.dragStartPosition.y + deltaY;
        
        this.updateView();
    }
    
    /**
     * Обработчик отпускания мыши
     */
    handleMouseUp() {
        this.isDragging = false;
        this.container.classList.remove('dragging');
    }
    
    /**
     * Обработчик колесика мыши
     */
    handleWheel(e) {
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX - this.position.x) / this.scale;
        const worldY = (mouseY - this.position.y) / this.scale;
        
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));
        
        if (newScale !== this.scale) {
            this.scale = newScale;
            
            // Корректируем позицию для сохранения точки под курсором
            this.position.x = mouseX - worldX * this.scale;
            this.position.y = mouseY - worldY * this.scale;
            
            this.updateView();
            this.updateGrid();
        }
    }
    
    /**
     * Обновление сетки в зависимости от зума
     */
    updateGrid() {
        const gridLines = document.querySelectorAll('.grid-line');
        const opacity = this.scale < 0.5 ? 0.1 : this.scale < 1 ? 0.3 : 0.5;
        
        gridLines.forEach(line => {
            line.style.opacity = opacity;
        });
    }
    
    /**
     * Touch события
     */
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            // Начало pinch-зума
            this.handlePinchStart(e);
        } else if (e.touches.length === 1) {
            // Начало перетаскивания
            const touch = e.touches[0];
            this.handleMouseDown({ 
                clientX: touch.clientX, 
                clientY: touch.clientY,
                target: e.target,
                preventDefault: () => e.preventDefault()
            });
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length === 2) {
            // Pinch-зум
            this.handlePinchMove(e);
        } else if (e.touches.length === 1 && this.isDragging) {
            // Перетаскивание
            const touch = e.touches[0];
            this.handleMouseMove({ 
                clientX: touch.clientX, 
                clientY: touch.clientY 
            });
        }
    }
    
    handleTouchEnd() {
        this.handleMouseUp();
    }
    
    handlePinchStart(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.pinchStartDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        this.pinchStartScale = this.scale;
    }
    
    handlePinchMove(e) {
        if (e.touches.length !== 2) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        const scale = this.pinchStartScale * (distance / this.pinchStartDistance);
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        
        this.updateView();
        this.updateGrid();
    }
    
    /**
     * Обновление индикатора положения
     */
    updatePositionIndicator() {
        const xElement = document.getElementById('position-x');
        const yElement = document.getElementById('position-y');
        
        if (xElement && yElement) {
            xElement.textContent = `X: ${Math.round(-this.position.x)}`;
            yElement.textContent = `Y: ${Math.round(-this.position.y)}`;
        }
    }
    
    /**
     * Обновление индикатора зума
     */
    updateZoomIndicator() {
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement) {
            zoomElement.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }
    
    /**
     * Настройка навигации
     */
    setupNavigation() {
        console.log('🟡 Настройка навигации...');
        
        // Центрирование
        const centerBtn = document.getElementById('center-view');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                this.centerView();
            });
            console.log('✅ Кнопка center-view подключена');
        } else {
            console.warn('⚠️ Кнопка center-view не найдена');
        }
        
        // Зум +
        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomIn();
            });
            console.log('✅ Кнопка zoom-in подключена');
        } else {
            console.warn('⚠️ Кнопка zoom-in не найдена');
        }
        
        // Зум -
        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOut();
            });
            console.log('✅ Кнопка zoom-out подключена');
        } else {
            console.warn('⚠️ Кнопка zoom-out не найдена');
        }
        
        // Сброс зума
        const resetZoomBtn = document.getElementById('reset-zoom');
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                this.resetZoom();
            });
            console.log('✅ Кнопка reset-zoom подключена');
        } else {
            console.warn('⚠️ Кнопка reset-zoom не найдена');
        }
        
        console.log('✅ Навигация настроена');
    }

    /**
     * Создаем центральную вершину;
     */

    createCenterVertex() {
        // Удаляем старую центральную вершину если есть
        if (this.centerVertex && this.centerVertex.element) {
            this.centerVertex.element.remove();
        }
        
        // Создаем элемент центральной вершины
        const centerElement = document.createElement('div');
        centerElement.className = 'vertex center-vertex';
        centerElement.textContent = 'Вы';
        centerElement.style.position = 'absolute';
        centerElement.style.left = '0px';
        centerElement.style.top = '0px';
        centerElement.style.width = '100px';
        centerElement.style.height = '100px';
        centerElement.style.backgroundColor = 'var(--primary)';
        centerElement.style.border = '3px solid var(--green)';
        centerElement.style.fontWeight = 'bold';
        centerElement.style.fontSize = '16px';
        centerElement.style.zIndex = '5';
        centerElement.style.cursor = 'default';
        
        // НЕ позволяем перетаскивать центральную вершину
        centerElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        
        // Добавляем на канвас
        this.canvas.appendChild(centerElement);
        
        // Сохраняем информацию о центральной вершине
        this.centerVertex = {
            id: 'center-vertex',
            title: 'Вы',
            element: centerElement,
            x: 0,
            y: 0,
            isCenter: true,
            tags: ['#центральная_точка'],
            errors: [],
            contacts: '',
            budget: 0,
            date: '',
            participants: 1
        };
        
        // Центрируем вид на центральной вершине
        this.centerView();
        
        console.log('✅ Центральная вершина "Вы" создана');
    }
    
    /**
     * Центрирование вида на центральной вершине
     */
    centerView() {
        // Центрируем на (0, 0) - где находится центральная вершина
        this.position = { x: 0, y: 0 };
        this.scale = 1;
        this.updateView();
        this.updateGrid();
        console.log('✅ Вид отцентрирован на "Вы"');
    }
    
    /**
     * Увеличение
     */
    zoomIn() {
        const newScale = Math.min(this.maxScale, this.scale + 0.2);
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.updateView();
            this.updateGrid();
            console.log('✅ Увеличение до:', this.scale);
        }
    }
    
    /**
     * Уменьшение
     */
    zoomOut() {
        const newScale = Math.max(this.minScale, this.scale - 0.2);
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.updateView();
            this.updateGrid();
            console.log('✅ Уменьшение до:', this.scale);
        }
    }
    
    /**
     * Сброс зума
     */
    resetZoom() {
        this.scale = 1;
        this.updateView();
        this.updateGrid();
        console.log('✅ Зум сброшен до 100%');
    }
    
    /**
     * Перемещение к определенной точке
     */
    moveTo(x, y) {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        this.position.x = centerX - x * this.scale;
        this.position.y = centerY - y * this.scale;
        
        this.updateView();
        console.log('✅ Перемещено к точке:', x, y);
    }
    
    /**
     * Добавление вершины
     */
    addVertex(vertex) {
        if (!vertex || !vertex.element) {
            console.warn('❌ Не могу добавить вершину: нет элемента');
            return;
        }
        
        console.log('🟡 Добавление вершины:', vertex.title);
        console.log('🟡 Исходные координаты:', vertex.x, vertex.y);
        
        // ЕСЛИ ЭТО НЕ ЦЕНТРАЛЬНАЯ ВЕРШИНА - создаем рядом с центром
        if (!vertex.isCenter) {
            // Генерируем позицию по кругу вокруг центра
            const angle = Math.random() * Math.PI * 2;
            const radius = 300 + Math.random() * 200; // 300-500px от центра
            
            vertex.x = Math.cos(angle) * radius;
            vertex.y = Math.sin(angle) * radius;
            
            console.log('🟡 Новая позиция (по кругу):', vertex.x, vertex.y);
        }
        
        // Позиционируем по сетке
        const snapped = this.snapToGrid(vertex.x, vertex.y);
        vertex.x = snapped.x;
        vertex.y = snapped.y;
        
        console.log('🟡 Координаты после сетки:', vertex.x, vertex.y);
        
        // Устанавливаем стили
        vertex.element.style.position = 'absolute';
        vertex.element.style.left = vertex.x + 'px';
        vertex.element.style.top = vertex.y + 'px';
        vertex.element.style.zIndex = '2';
        
        // Если это не центральная вершина, добавляем возможность перетаскивания
        if (!vertex.isCenter) {
            vertex.element.style.cursor = 'pointer';
        }
        
        // Добавляем на канвас
        this.canvas.appendChild(vertex.element);
        this.events.push(vertex);
        
        console.log('✅ Вершина добавлена на канвас');
        
        // Автоматически центрируем на новой вершине (только если это не центральная)
        if (!vertex.isCenter) {
            this.moveTo(vertex.x, vertex.y);
        }
    }
    
    /**
     * Получает центральную вершину
     */
    getCenterVertex() {
        return this.centerVertex;
    }
    
    /**
     * Рассчитывает позицию на круге вокруг центра
     */
    getPositionOnCircle(radius = 300, angle = null) {
        if (angle === null) {
            angle = Math.random() * Math.PI * 2;
        }
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return this.snapToGrid(x, y);
    }
    
    /**
     * Получение координат мыши в системе канваса
     */
    getCanvasCoordinates(clientX, clientY) {
        if (!this.container) return { x: 0, y: 0 };
        
        const rect = this.container.getBoundingClientRect();
        const canvasX = (clientX - rect.left - this.position.x) / this.scale;
        const canvasY = (clientY - rect.top - this.position.y) / this.scale;
        
        return { x: canvasX, y: canvasY };
    }
    
    /**
     * Привязка к сетке
     */
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }
    
    /**
     * Получить все события
     */
    getAllEvents() {
        return this.events;
    }
    
    /**
     * Очистить все связи
     */
    clearConnections() {
        this.connections.forEach(connection => {
            if (connection.parentNode) {
                connection.parentNode.removeChild(connection);
            }
        });
        this.connections = [];
        console.log('✅ Все связи очищены');
    }
}