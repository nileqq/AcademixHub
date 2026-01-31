const SHANYRAKS = ['Каспий', 'Окжетпес', 'Самрук', 'Барыс', 'Қыран', 'Алтын'];

function loadPending() {
  return JSON.parse(localStorage.getItem('sc_pending') || '[]');
}
function savePending(items) {
  localStorage.setItem('sc_pending', JSON.stringify(items));
}

function loadPoints() {
  const raw = localStorage.getItem('sc_shanyraks_points');
  if (raw) return JSON.parse(raw);

  // init
  const init = {};
  SHANYRAKS.forEach(n => init[n] = 0);
  localStorage.setItem('sc_shanyraks_points', JSON.stringify(init));
  return init;
}
function savePoints(points) {
  localStorage.setItem('sc_shanyraks_points', JSON.stringify(points));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logLine(text) {
  const logs = document.getElementById('logs');
  const div = document.createElement('div');
  div.className = 'card';
  div.style.padding = '8px 10px';
  div.style.borderRadius = '10px';
  div.textContent = text;
  logs.prepend(div);
}

function render() {
  const pending = loadPending();
  const points = loadPoints();

  const pendingOnly = pending.filter(x => x.status === 'pending');
  document.getElementById('pending-count').textContent = `Pending: ${pendingOnly.length}`;

  // Pending list
  const list = document.getElementById('pending-list');
  list.innerHTML = '';

  if (pendingOnly.length === 0) {
    list.innerHTML = `<div class="card">Нет новых заявок ✅</div>`;
  } else {
    pendingOnly.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';

      const tagsHtml = (item.tags || []).slice(0, 8).map(t => `<span class="tag">${t}</span>`).join('');
      const errorsHtml = (item.errors || []).slice(0, 5).map(e => `<span class="tag">${e}</span>`).join('');

      card.innerHTML = `
        <div style="font-weight:600;">${escapeHtml(item.title || 'Без названия')}</div>
        <div class="meta">
          <span>Тип: <b>${escapeHtml(item.portfolioType || '—')}</b></span>
          <span>Дата: <b>${escapeHtml(item.date || '—')}</b></span>
        </div>
        <div style="margin-top:6px; opacity:.85;">${escapeHtml(item.description || '')}</div>

        <div class="tags" title="Навыки">${tagsHtml || '<span class="meta">— навыков нет —</span>'}</div>
        <div class="tags" title="Ошибки">${errorsHtml || '<span class="meta">— ошибок нет —</span>'}</div>

        <div style="margin-top:8px;">
          <div class="meta"><span>Результат:</span> <b>${escapeHtml(item.result || '—')}</b></div>
          <div class="meta"><span>Рефлексия:</span> <b>${escapeHtml(item.reflection || '—')}</b></div>
        </div>

        <div class="actions">
          <button class="approve" data-action="approve" data-id="${item.scId}">✅ Утвердить</button>
          <button class="reject" data-action="reject" data-id="${item.scId}">❌ Отклонить</button>
        </div>
      `;

      list.appendChild(card);
    });
  }

  // Shanyrak board
  const board = document.getElementById('shanyrak-board');
  const sorted = Object.entries(points).sort((a, b) => b[1] - a[1]);

  board.innerHTML = '';
  sorted.forEach(([name, pts], idx) => {
    const row = document.createElement('div');
    row.className = 'leader-row';
    row.innerHTML = `<span>#${idx + 1} ${escapeHtml(name)}</span><b>${pts}</b>`;
    board.appendChild(row);
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function approve(scId) {
  const pending = loadPending();
  const idx = pending.findIndex(x => x.scId === scId);
  if (idx === -1) return;

  pending[idx].status = 'approved';
  savePending(pending);

  // начисляем рандомному шаныраку рандомные баллы
  const points = loadPoints();
  const sh = SHANYRAKS[randInt(0, SHANYRAKS.length - 1)];
  const delta = randInt(5, 30);
  points[sh] = (points[sh] || 0) + delta;
  savePoints(points);

  logLine(`✅ Утверждено: "${pending[idx].title}" → ${sh} +${delta} баллов`);
  render();
}

function reject(scId) {
  const pending = loadPending();
  const idx = pending.findIndex(x => x.scId === scId);
  if (idx === -1) return;

  pending[idx].status = 'rejected';
  savePending(pending);

  logLine(`❌ Отклонено: "${pending[idx].title}"`);
  render();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'approve') approve(id);
  if (action === 'reject') reject(id);
});

document.getElementById('reset-demo')?.addEventListener('click', () => {
  localStorage.removeItem('sc_pending');
  localStorage.removeItem('sc_shanyraks_points');
  document.getElementById('logs').innerHTML = '';
  render();
});

render();
