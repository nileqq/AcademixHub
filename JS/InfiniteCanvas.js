// # ---- Бесконечный канвас ---- #

class InfiniteCanvas {
    constructor(containerId) {
        console.log('🟡 Создание InfiniteCanvas с ID:', containerId);
        
        // Ищем контейнер
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.log('🟡 Не нашли по ID, ищем .infinite-canvas-container');
            this.container = document.querySelector('.infinite-canvas-container');
        }
        
        if (!this.container) {
            console.error('❌ InfiniteCanvas: Контейнер не найден!');
            return;
        }
        
        // Определяем canvas элемент
        if (this.container.classList.contains('infinite-canvas')) {
            this.canvas = this.container;
        } else {
            this.canvas = this.container.querySelector('.infinite-canvas');
        }
        
        // Если canvas не найден, создаем его
        if (!this.canvas) {
            this.canvas = document.createElement('div');
            this.canvas.className = 'infinite-canvas';
            this.container.appendChild(this.canvas);
        }
        
        console.log('✅ InfiniteCanvas создан');
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
        
        this.init();
    }
    
    /**
     * Инициализация канваса
     */
    init() {
        console.log('🟡 InfiniteCanvas init() запущен');
        
        if (!this.container || !this.canvas) {
            console.error('❌ InfiniteCanvas не инициализирован');
            return;
        }
        
        this.setupEventListeners();
        this.createGrid();
        this.createCenterVertex();
        this.updateView();
        this.setupNavigation();
        
        console.log('✅ InfiniteCanvas полностью инициализирован');
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Перетаскивание канваса
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Зум колесиком мыши
        this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // Обновление индикатора
        this.container.addEventListener('mousemove', this.updatePositionIndicator.bind(this));
    }
    
    /**
     * Создание сетки
     */
    createGrid() {
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
    }
    
    /**
     * Создает центральную вершину "Вы"
     */
    createCenterVertex() {
        // Создаем элемент центральной вершины
        const centerElement = document.createElement('div');
        centerElement.className = 'vertex center-vertex';
        centerElement.textContent = 'Вы';
        centerElement.style.left = '0px';
        centerElement.style.top = '0px';
        centerElement.style.cursor = 'default';
        
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
        
        this.events.push(this.centerVertex);
        
        console.log('✅ Центральная вершина "Вы" создана');
    }
    
    /**
     * Обновление вида канваса
     */
    updateView() {
        this.canvas.style.transform = `
            translate(${this.position.x}px, ${this.position.y}px)
            scale(${this.scale})
        `;
        
        this.updatePositionIndicator();
        this.updateZoomIndicator();
    }
    
    /**
     * Обработчик нажатия мыши
     */
    handleMouseDown(e) {
        // Игнорируем клики на вершины
        if (e.target.classList.contains('vertex')) {
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
            
            // Корректируем позицию
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
        // Центрирование
        document.getElementById('center-view')?.addEventListener('click', () => {
            this.centerView();
        });
        
        // Зум +
        document.getElementById('zoom-in')?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        // Зум -
        document.getElementById('zoom-out')?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Сброс зума
        document.getElementById('reset-zoom')?.addEventListener('click', () => {
            this.resetZoom();
        });
    }
    
    /**
     * Центрирование вида
     */
    centerView() {
        this.position = { x: 0, y: 0 };
        this.scale = 1;
        this.updateView();
        this.updateGrid();
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
        }
    }
    
    /**
     * Сброс зума
     */
    resetZoom() {
        this.scale = 1;
        this.updateView();
        this.updateGrid();
    }
    
    /**
     * Добавление вершины
     */
    addVertex(vertex) {
        if (!vertex || !vertex.element) return;
        
        // Для нецентральных вершин - позиционируем по кругу
        if (!vertex.isCenter) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 300 + Math.random() * 200;
            
            vertex.x = Math.cos(angle) * radius;
            vertex.y = Math.sin(angle) * radius;
            
            // Привязка к сетке
            const snapped = this.snapToGrid(vertex.x, vertex.y);
            vertex.x = snapped.x;
            vertex.y = snapped.y;
        }
        
        // Устанавливаем позицию
        vertex.element.style.left = vertex.x + 'px';
        vertex.element.style.top = vertex.y + 'px';
        
        // Добавляем на канвас
        this.canvas.appendChild(vertex.element);
        this.events.push(vertex);
        
        // Центрируем на новой вершине
        if (!vertex.isCenter) {
            this.moveTo(vertex.x, vertex.y);
        }
    }
    
    /**
     * Перемещение к точке
     */
    moveTo(x, y) {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        this.position.x = centerX - x * this.scale;
        this.position.y = centerY - y * this.scale;
        
        this.updateView();
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
     * Получение позиции на круге
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
     * Получает центральную вершину
     */
    getCenterVertex() {
        return this.centerVertex;
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
    }
}