// # ---- Главный файл приложения ---- #

document.addEventListener('DOMContentLoaded', () => {
    console.log('DNA Engine загружается...');
    
    let graphManager = null;
    let currentUser = null;
    let infiniteCanvas = null;
    
    // Даем время на загрузку всех элементов
    setTimeout(() => {
        try {
            console.log('🟡 Пытаемся создать InfiniteCanvas...');
            infiniteCanvas = new InfiniteCanvas('graph-box');
            
            if (!infiniteCanvas || !infiniteCanvas.container) {
                console.error('❌ InfiniteCanvas не создан');
                return;
            }
            
            console.log('✅ InfiniteCanvas создан');
            
            // Инициализируем менеджер графа
            graphManager = new GraphManager('graph-box');
            console.log('✅ GraphManager создан');
            graphManager.container = infiniteCanvas.canvas;
            graphManager.initContainer();
            
            setupCanvasIntegration(infiniteCanvas, graphManager);
            ensureCenterVertex(infiniteCanvas, graphManager);
            
            // Загружаем данные из localStorage
            loadFromLocalStorage();
            
            // Настраиваем обработчики событий
            setupEventListeners();
            
            console.log('✅ DNA Engine успешно загружен');
            
        } catch (error) {
            console.error('❌ Ошибка при загрузке приложения:', error);
            alert('Произошла ошибка при загрузке приложения. Пожалуйста, проверьте консоль для подробностей.');
        }
    }, 100);
    
    // # ---- Функции ---- #
    
    function setupCanvasIntegration(canvas, graph) {
        if (!canvas || !canvas.snapToGrid) {
            console.warn('Canvas не инициализирован или не имеет метода snapToGrid');
            return;
        }
        
        console.log('🟡 Настройка интеграции canvas и графа');
        
        // Сохраняем оригинальный метод добавления события
        const originalAddEvent = graph.addEvent;
        
        // Переопределяем метод добавления события
        graph.addEvent = function(eventData) {
            console.log('🟡 Добавление события через интегрированный метод');
            
            // Создаем событие через оригинальный метод
            const event = originalAddEvent.call(graph, eventData);
            
            if (!event) {
                console.error('❌ Событие не создано');
                return null;
            }
            
            // Для нецентральных вершин - позиционируем по кругу
            if (!eventData.isCenter) {
                const position = canvas.getPositionOnCircle();
                event.x = position.x;
                event.y = position.y;
                
                if (event.element) {
                    event.element.style.left = event.x + 'px';
                    event.element.style.top = event.y + 'px';
                    event.element.style.position = 'absolute';
                }
            }
            
            // Добавляем вершину на канвас
            if (canvas.addVertex) {
                canvas.addVertex(event);
            }
            
            return event;
        };
        
        // Делаем canvas доступным глобально
        window.infiniteCanvas = canvas;
    }

    function ensureCenterVertex(canvas, graph) {
        // Создаёт центральную вершину "Вы" в центре мира и центрирует камеру на ней.
        const existing = graph.getCenterVertex?.();
        if (existing) {
            canvas.centerOn(existing.x, existing.y, { resetZoom: true });
            return;
        }

        const centerEventData = {
            id: 'center-vertex',
            title: 'Вы',
            isCenter: true,
            x: canvas.worldCenter?.x ?? 5000,
            y: canvas.worldCenter?.y ?? 5000,
            tags: '#центр',
            errors: '',
            contacts: '',
            budget: 0,
            date: '',
            participants: 1
        };

        const centerEvent = graph.addEvent(centerEventData);

        if (centerEvent?.element) {
            centerEvent.element.style.left = centerEvent.x + 'px';
            centerEvent.element.style.top = centerEvent.y + 'px';
        }

        canvas.centerOn(centerEvent.x, centerEvent.y, { resetZoom: true });
    }

    function setupEventListeners() {
        // Кнопки добавления/редактирования
        document.getElementById('open-card')?.addEventListener('click', showAddEventForm);
        document.getElementById('close-card')?.addEventListener('click', hideAddEventForm);
        document.getElementById('create-vertex')?.addEventListener('click', createEvent);
        document.getElementById('edit-vertex')?.addEventListener('click', showEditEventForm);
        document.getElementById('save-vertex')?.addEventListener('click', saveEvent);
        document.getElementById('close-edit')?.addEventListener('click', hideEditEventForm);
        document.getElementById('delete-vertex')?.addEventListener('click', deleteEvent);
        document.getElementById('close-info')?.addEventListener('click', hideInfoSidebar);
        
        // Рекомендации
        document.getElementById('show-recommendations')?.addEventListener('click', showRecommendations);
        document.getElementById('show-development')?.addEventListener('click', showDevelopmentRecommendations);
        document.getElementById('close-recommendations')?.addEventListener('click', hideRecommendations);
        
        // Фильтры
        document.getElementById('tag-filter')?.addEventListener('input', applyFilters);
        document.getElementById('budget-filter')?.addEventListener('change', applyFilters);
        document.getElementById('date-filter')?.addEventListener('change', applyFilters);
        document.getElementById('participants-filter')?.addEventListener('change', applyFilters);
        
        // Авторизация
        document.getElementById('open-auth')?.addEventListener('click', showAuthForm);
        document.getElementById('close-auth')?.addEventListener('click', hideAuthForm);
        document.getElementById('toggle-auth')?.addEventListener('click', toggleAuthForms);
        document.getElementById('register-btn')?.addEventListener('click', registerUser);
        document.getElementById('login-btn')?.addEventListener('click', loginUser);
        
        // Событие выбора мероприятия
        document.addEventListener('eventSelected', handleEventSelected);

        // Шаныраки
        document.getElementById('open-shanyrak')?.addEventListener('click', showShanyrakOverlay);
        document.getElementById('close-shanyrak')?.addEventListener('click', hideShanyrakOverlay);
    }
    
    function showAddEventForm() {
        document.getElementById('card-overlay').style.display = 'flex';
        document.getElementById('vertex-date').value = new Date().toISOString().split('T')[0];
    }
    
    function hideAddEventForm() {
        document.getElementById('card-overlay').style.display = 'none';
    }
    
    function createEvent() {
        const title = document.getElementById('vertex-title').value.trim();
        const tags = document.getElementById('vertex-tags').value;
        const errors = document.getElementById('vertex-errors').value;
        const contacts = document.getElementById('vertex-contacts').value.trim();
        const budget = document.getElementById('vertex-budget').value;
        const date = document.getElementById('vertex-date').value;
        const participants = document.getElementById('vertex-participants').value;
        
        if (isEmpty(title)) {
            alert('Название мероприятия не может быть пустым!');
            return;
        }
        
        const eventData = {
            title,
            tags,
            errors,
            contacts,
            budget,
            date,
            participants
        };
        
        graphManager.addEvent(eventData);
        saveToLocalStorage();
        hideAddEventForm();
        clearAddEventForm();
    }
    
    function clearAddEventForm() {
        document.getElementById('vertex-title').value = '';
        document.getElementById('vertex-tags').value = '';
        document.getElementById('vertex-errors').value = '';
        document.getElementById('vertex-contacts').value = '';
        document.getElementById('vertex-budget').value = '0';
        document.getElementById('vertex-date').value = '';
        document.getElementById('vertex-participants').value = '1';
    }
    
    function handleEventSelected(e) {
        const event = e.detail.event;
        updateEventInfo(event);
    }
    
    function updateEventInfo(event) {
        if (!event) return;
        
        const infoData = event.getInfoData();
        
        document.getElementById('info-title').textContent = infoData.title;
        document.getElementById('info-tags').textContent = infoData.tags;
        document.getElementById('info-errors').textContent = infoData.errors;
        document.getElementById('info-contacts').textContent = infoData.contacts;
        document.getElementById('info-budget').textContent = infoData.budget;
        document.getElementById('info-date').textContent = infoData.date;
        document.getElementById('info-participants').textContent = infoData.participants;
        
        // Рассчитываем схожесть с центром
        if (!event.isCenter) {
            const similarity = SimilarityCalculator.calculateSimilarityToCenter(event);
            const similarityClass = getSimilarityClass(similarity);
            
            const similarityElement = document.getElementById('info-similarity');
            similarityElement.textContent = `${similarityClass.label} (${similarity.toFixed(2)})`;
            similarityElement.className = `similarity-indicator ${similarityClass.className}`;
        } else {
            document.getElementById('info-similarity').textContent = 'Центральная точка';
        }
        
        const infoSidebar = document.getElementById('info-sidebar');
        infoSidebar.dataset.vertexId = event.id;
        infoSidebar.classList.add('open');
    }
    
    function showEditEventForm() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        const event = graphManager.getEventById(vertexId);
        if (!event) return;
        
        document.getElementById('edit-vertex-title').value = event.title;
        document.getElementById('edit-vertex-tags').value = event.tags.join(', ');
        document.getElementById('edit-vertex-errors').value = event.errors.join(', ');
        document.getElementById('edit-vertex-contacts').value = event.contacts;
        document.getElementById('edit-vertex-budget').value = event.budget;
        document.getElementById('edit-vertex-date').value = event.date;
        document.getElementById('edit-vertex-participants').value = event.participants;
        
        document.getElementById('edit-overlay').style.display = 'flex';
    }
    
    function hideEditEventForm() {
        document.getElementById('edit-overlay').style.display = 'none';
    }
    
    function saveEvent() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        const updateData = {
            title: document.getElementById('edit-vertex-title').value,
            tags: document.getElementById('edit-vertex-tags').value,
            errors: document.getElementById('edit-vertex-errors').value,
            contacts: document.getElementById('edit-vertex-contacts').value,
            budget: document.getElementById('edit-vertex-budget').value,
            date: document.getElementById('edit-vertex-date').value,
            participants: document.getElementById('edit-vertex-participants').value
        };
        
        if (graphManager.updateEvent(vertexId, updateData)) {
            saveToLocalStorage();
            hideEditEventForm();
            const event = graphManager.getEventById(vertexId);
            updateEventInfo(event);
        }
    }
    
    function deleteEvent() {
        const infoSidebar = document.getElementById('info-sidebar');
        const vertexId = infoSidebar.dataset.vertexId;
        
        if (!vertexId) return;
        
        if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            if (graphManager.removeEvent(vertexId)) {
                saveToLocalStorage();
                hideInfoSidebar();
            }
        }
    }
    
    function hideInfoSidebar() {
        document.getElementById('info-sidebar').classList.remove('open');
    }
    
    function applyFilters() {
        const tagFilter = document.getElementById('tag-filter').value.trim();
        const budgetFilter = document.getElementById('budget-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        const participantsFilter = document.getElementById('participants-filter').value;
        
        const filter = {
            tag: tagFilter || null,
            maxBudget: budgetFilter ? parseInt(budgetFilter) : null,
            date: dateFilter || null,
            minParticipants: participantsFilter ? parseInt(participantsFilter) : null
        };
        
        graphManager.filterEvents(filter);
    }
    
    function showRecommendations() {
        const selectedEvent = graphManager.getSelectedEvent();
        const allEvents = graphManager.getAllEvents();
        
        if (allEvents.length < 2) {
            alert('Добавьте хотя бы два мероприятия для получения рекомендаций');
            return;
        }
        
        let recommendations;
        
        if (selectedEvent && !selectedEvent.isCenter) {
            recommendations = SimilarityCalculator.getRecommendations(selectedEvent, allEvents);
        } else {
            const similarities = SimilarityCalculator.calculateAllSimilarities(allEvents);
            recommendations = similarities.slice(0, 5).map(sim => ({
                event: sim.event2,
                similarity: sim.similarity,
                details: {
                    tagSimilarity: sim.event1.calculateTagSimilarity(sim.event2),
                    budgetSimilarity: sim.event1.calculateBudgetSimilarity(sim.event2),
                    dateSimilarity: sim.event1.calculateDateSimilarity(sim.event2),
                    participantsSimilarity: sim.event1.calculateParticipantsSimilarity(sim.event2)
                }
            }));
        }
        
        renderRecommendations(recommendations, selectedEvent);
        document.getElementById('recommendations-sidebar').classList.add('open');
    }
    
    function showDevelopmentRecommendations() {
        const allEvents = graphManager.getAllEvents();
        const developmentRecs = SimilarityCalculator.getDevelopmentRecommendations(allEvents);
        
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = '<h4>🏆 Мои направления развития</h4>';
        
        if (developmentRecs.length === 0) {
            recommendationsList.innerHTML += '<p>Добавьте мероприятия для анализа развития</p>';
            return;
        }
        
        developmentRecs.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="recommendation-title">${index + 1}. ${rec.event.title}</div>
                <div class="recommendation-similarity high">
                    Потенциал развития: ${rec.developmentPotential.toFixed(1)}%
                </div>
                <div class="recommendation-meta">
                    <div>📈 Направление: ${rec.direction}</div>
                    <div>💰 Бюджет: ${formatNumber(rec.event.budget)} KZT</div>
                    <div>👥 Участники: ${formatNumber(rec.event.participants)} чел.</div>
                </div>
                <div class="recommendation-tags">
                    ${rec.event.tags.map(tag => `<span class="recommendation-tag">${tag}</span>`).join('')}
                </div>
                <button class="btn in-box select-btn">Выбрать для деталей</button>
            `;
            
            card.querySelector('.select-btn').addEventListener('click', () => {
                graphManager.selectEvent(rec.event);
                highlightVertex(rec.event.id, 'recommendation');
                hideRecommendations();
            });
            
            recommendationsList.appendChild(card);
        });
        
        document.getElementById('recommendations-sidebar').classList.add('open');
    }
    
    function renderRecommendations(recommendations, sourceEvent = null) {
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = '';
        
        if (recommendations.length === 0) {
            recommendationsList.innerHTML = '<p>Рекомендации не найдены</p>';
            return;
        }
        
        recommendations.forEach((rec, index) => {
            const card = createRecommendationCard(rec, sourceEvent, index + 1);
            recommendationsList.appendChild(card);
        });
    }
    
    function createRecommendationCard(recommendation, sourceEvent, rank) {
        const event = recommendation.event;
        const similarity = recommendation.similarity;
        const simClass = getSimilarityClass(similarity);
        
        const card = document.createElement('div');
        card.className = `recommendation-card ${simClass.className}`;
        
        card.innerHTML = `
            <div class="recommendation-title">${rank}. ${event.title}</div>
            <div class="recommendation-similarity ${simClass.className}">
                Схожесть: ${similarity.toFixed(2)}
            </div>
            <div class="recommendation-meta">
                <div>💰 Бюджет: ${formatNumber(event.budget)} KZT</div>
                <div>📅 Дата: ${formatDate(event.date)}</div>
                <div>👥 Участники: ${formatNumber(event.participants)} чел.</div>
            </div>
            <div class="recommendation-tags">
                ${event.tags.map(tag => `<span class="recommendation-tag">${tag}</span>`).join('')}
            </div>
            <button class="btn in-box select-btn">Выбрать и подсветить</button>
        `;
        
        card.querySelector('.select-btn').addEventListener('click', () => {
            graphManager.selectEvent(event);
            highlightVertex(event.id, 'recommendation');
            hideRecommendations();
        });
        
        return card;
    }
    
    function highlightVertex(eventId, type = 'recommendation') {
        const event = graphManager.getEventById(eventId);
        if (!event || !event.element) return;
        
        const vertex = event.element;
        
        vertex.classList.remove('highlighted', 'tag', 'error', 'recommendation');
        vertex.classList.add('highlighted', type);
        vertex.style.zIndex = '100';
        
        setTimeout(() => {
            vertex.classList.remove('highlighted', type);
            vertex.style.zIndex = '1';
        }, 3500);
    }
    
    function hideRecommendations() {
        document.getElementById('recommendations-sidebar').classList.remove('open');
    }
    
    function showAuthForm() {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('auth-title').querySelector('span').textContent = 'Войти';
        document.getElementById('toggle-auth').textContent = '→';
    }
    
    function hideAuthForm() {
        document.getElementById('auth-overlay').style.display = 'none';
    }
    
    function toggleAuthForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitleText = document.getElementById('auth-title').querySelector('span');
        const toggleAuthBtn = document.getElementById('toggle-auth');
        
        if (loginForm.style.display !== 'none') {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitleText.textContent = 'Регистрация';
            toggleAuthBtn.textContent = '←';
        } else {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            authTitleText.textContent = 'Войти';
            toggleAuthBtn.textContent = '→';
        }
    }
    
    function registerUser() {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;
        
        if (isEmpty(username) || isEmpty(password)) {
            alert('Введите имя пользователя и пароль');
            return;
        }
        
        if (password !== passwordConfirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[username]) {
            alert('Пользователь уже существует!');
            return;
        }
        
        users[username] = { 
            password: password,
            events: []
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        alert('Регистрация успешна!');
        toggleAuthForms();
    }
    
    function loginUser() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (!users[username]) {
            alert('Пользователь не найден');
            return;
        }
        
        if (users[username].password !== password) {
            alert('Неверный пароль');
            return;
        }
        
        currentUser = username;
        alert('Вход выполнен успешно!');
        loadUserEvents(username);
        hideAuthForm();
    }
    
    function saveToLocalStorage() {
        if (!currentUser) return;
        
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[currentUser]) {
            const eventsData = graphManager.getAllEvents()
                .filter(event => !event.isCenter) // Не сохраняем центральную вершину
                .map(event => ({
                    id: event.id,
                    title: event.title,
                    tags: event.tags,
                    errors: event.errors,
                    contacts: event.contacts,
                    budget: event.budget,
                    date: event.date,
                    participants: event.participants,
                    x: event.x,
                    y: event.y
                }));
            
            users[currentUser].events = eventsData;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // # ---- Раскоментируй для теста ---- #
    function loadFromLocalStorage() {
        // Загружаем тестовые данные если нет пользователя
        if (!currentUser) {
            loadSampleEvents();
        }
    }
    
    function loadUserEvents(username) {
        const usersJSON = localStorage.getItem('users');
        const users = usersJSON ? JSON.parse(usersJSON) : {};
        
        if (users[username] && users[username].events) {
            // Очищаем текущие мероприятия (кроме центральной)
            graphManager.getAllEvents()
                .filter(event => !event.isCenter)
                .forEach(event => {
                    if (event.element) event.element.remove();
                });
            
            graphManager.events = graphManager.events.filter(event => event.isCenter);
            
            // Загружаем мероприятия пользователя
            users[username].events.forEach(eventData => {
                graphManager.addEvent(eventData);
            });
        }
    }
    
    function loadSampleEvents() {
        // Добавляем несколько примеров для демонстрации
        const sampleEvents = [
            {
                title: 'Хакатон по AI',
                tags: '#хакатон,#искуственный_интеллект,#python',
                errors: '#плохая_документация',
                contacts: 'org@hackathon.ai',
                budget: '50000',
                date: '2024-03-15',
                participants: '50'
            },
            {
                title: 'Конференция DevDays',
                tags: '#конференция,#разработка,#сеть',
                errors: '#долгий_регистрация',
                contacts: 'info@devdays.kz',
                budget: '100000',
                date: '2024-04-20',
                participants: '200'
            },
            {
                title: 'Воркшоп по React',
                tags: '#воркшоп,#react,#frontend',
                errors: '#мало_практики',
                contacts: 'workshop@react.kz',
                budget: '25000',
                date: '2024-02-10',
                participants: '30'
            }
        ];
        
        sampleEvents.forEach(eventData => {
            setTimeout(() => {
                graphManager.addEvent(eventData);
            }, 100);
        });
    }

    function getShanyrakState() {
        // Пока мок: все 0. Потом сюда подключишь реальную систему.
        // Можешь расширить список до 10-12 для эффекта.
        const shanyraks = [
            { id: 'S1', name: 'Каспий', points: 0 },
            { id: 'S2', name: 'Окжетпес', points: 0 },
            { id: 'S3', name: 'Самрук', points: 0 },
            { id: 'S4', name: 'Барыс', points: 0 },
            { id: 'S5', name: 'Қыран', points: 0 },
            { id: 'S6', name: 'Алтын', points: 0 }
        ];

        // кто “ваш” шанырак: пока фиксируем первый, потом заменишь на currentUser.shanyrakId
        const myShanyrakId = 'S1';

        return { shanyraks, myShanyrakId };
    }

    function showShanyrakOverlay() {
        const overlay = document.getElementById('shanyrak-overlay');
        if (!overlay) return;

        overlay.classList.remove('hide');
        overlay.style.display = 'flex';
        renderShanyrakLeaderboard();
    }

    function hideShanyrakOverlay() {
        const overlay = document.getElementById('shanyrak-overlay');
        if (!overlay) return;

        overlay.classList.add('hide');
        overlay.style.display = 'none';
    }

    function renderShanyrakLeaderboard() {
        const board = document.getElementById('shanyrak-board');
        if (!board) return;

        const { shanyraks, myShanyrakId } = getShanyrakState();

        // сортировка по убыванию баллов, затем по имени (чтобы стабильно)
        const sorted = [...shanyraks].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.name.localeCompare(b.name, 'ru');
        });

        // рендер списка
        board.innerHTML = '';
        sorted.forEach((s, idx) => {
            const rank = idx + 1;
            const row = document.createElement('div');
            row.className = `shanyrak-item ${rank <= 3 ? `rank-${rank}` : ''}`;

            row.innerHTML = `
                <div class="shanyrak-rank">#${rank}</div>
                <div class="shanyrak-name">${s.name}</div>
                <div class="shanyrak-points">${s.points}</div>
            `;

            board.appendChild(row);
        });

        // “моё место”
        const my = sorted.findIndex(s => s.id === myShanyrakId);
        const myRank = my >= 0 ? my + 1 : null;
        const mySh = myRank ? sorted[my] : null;

        document.getElementById('my-shanyrak-name').textContent = mySh ? mySh.name : '—';
        document.getElementById('my-shanyrak-rank').textContent = myRank ? `Место: #${myRank}` : 'Место: —';
        document.getElementById('my-shanyrak-points').textContent = mySh ? String(mySh.points) : '0';
    }
});