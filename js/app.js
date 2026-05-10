const STORAGE_KEY = 'fh100_app_v1';
const SCHEMA_VERSION = 2;

const messagesByCategory = {
  clarity: ['先釐清一件最重要的事，今天就會很穩。', '把焦點收回來，妳會更有掌控感。'],
  discipline: ['小小的自律，會變成妳的氣場。', '出現一次，就是對未來最好的投資。'],
  glow: ['照顧好自己，是妳的高級感來源。', '妳的狀態，值得被妳親手打造。'],
  calmness: ['慢下來，才看得到真正重要的方向。', '穩定是妳最強的超能力。'],
  confidence: ['妳不需要完美，妳只需要相信自己。', '今天的勇敢會累積成明天的自信。'],
  energy: ['動一下，能量就會回到妳身上。', '身體先醒來，人生就會跟著前進。']
};

const taskPool = {
  clarity: ['寫下今日最重要一件事', '列出今天的 3 個優先順序', '關掉一個分心來源 30 分鐘'],
  discipline: ['整理桌面 3 分鐘', '先做最難任務 5 分鐘', '完成一件一直拖延的小事'],
  glow: ['做 3 分鐘保養整理', '補水並伸展 2 分鐘', '把今天穿搭整理得更俐落'],
  calmness: ['喝一杯水並深呼吸 5 次', '靜坐 2 分鐘', '把肩膀放鬆並慢呼吸 10 次'],
  confidence: ['對鏡子給自己一句肯定', '記下今天做得好的一件事', '傳一則真誠訊息給自己'],
  energy: ['散步 5 分鐘', '做 10 次深蹲', '離開座位活動 3 分鐘']
};

const categories = ['clarity', 'discipline', 'glow', 'calmness', 'confidence', 'energy'];
const titles = [
  { minLevel: 1, name: 'Seed of Her' },
  { minLevel: 3, name: 'Steady Muse' },
  { minLevel: 5, name: 'Radiant Maker' },
  { minLevel: 7, name: 'Future Her Embodied' }
];

const statsKeys = [...categories];
const completionLabel = { none: '未做', partial: '部分完成', done: '完成' };
const statDisplay = {
  clarity: 'Clarity / 洞察',
  discipline: 'Discipline / 自律',
  glow: 'Glow / 光感',
  calmness: 'Calmness / 穩定',
  confidence: 'Confidence / 自信',
  energy: 'Energy / 能量'
};

function localDateISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const todayISO = localDateISO;

function createInitialState() {
  return {
    meta: { schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    profile: { appName: 'Future Her: 100', startDate: todayISO(), currentDay: 1 },
    progress: {
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckInDate: null,
      totalXP: 0,
      level: 1,
      title: 'Seed of Her'
    },
    stats: Object.fromEntries(statsKeys.map((k) => [k, 10])),
    days: {},
    journalEntries: [],
    versionBoard: [],
    todoTasks: []
  };
}

function normalizeState(input) {
  const safe = input ?? {};
  const fallback = createInitialState();
  return {
    meta: safe.meta ?? fallback.meta,
    profile: { ...fallback.profile, ...(safe.profile ?? {}) },
    progress: { ...fallback.progress, ...(safe.progress ?? {}) },
    stats: { ...fallback.stats, ...(safe.stats ?? {}) },
    days: safe.days ?? {},
    journalEntries: Array.isArray(safe.journalEntries) ? safe.journalEntries : [],
    versionBoard: Array.isArray(safe.versionBoard) ? safe.versionBoard : [],
    todoTasks: Array.isArray(safe.todoTasks) ? safe.todoTasks : []
  };
}


function validateImportedState(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (!candidate.profile || typeof candidate.profile.startDate !== 'string') return false;
  if (!candidate.progress || typeof candidate.progress.totalXP !== 'number') return false;
  if (!candidate.stats || typeof candidate.stats !== 'object') return false;
  if (!candidate.days || typeof candidate.days !== 'object') return false;
  return true;
}

function hasCompletedAnyDay() {
  return Object.values(state.days).some((day) => day.checkedIn);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed?.meta || parsed.meta.schemaVersion !== SCHEMA_VERSION) return createInitialState();
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
}

function save(state) {
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dayFromStart(startDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date(`${todayISO()}T00:00:00`);
  const diff = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, Math.min(100, diff));
}

function ensureToday(state) {
  const day = dayFromStart(state.profile.startDate);
  state.profile.currentDay = day;
  if (!state.days[day]) {
    state.days[day] = {
      date: todayISO(),
      checkedIn: false,
      mood: 3,
      taskCompletion: 'none',
      reflection: '',
      task: pickTaskForDay(day),
      futureMessage: pickMessageForTask(pickTaskForDay(day)),
      xpGained: 0,
      statDelta: {},
      favorited: false
    };
  }
}


function pickTaskForDay(day) {
  const category = categories[(day - 1) % categories.length];
  const options = taskPool[category];
  const title = options[Math.floor((day - 1) / categories.length) % options.length];
  return { title, category };
}

function pickMessageForTask(task) {
  const options = messagesByCategory[task.category] ?? messagesByCategory.clarity;
  return options[Math.floor(Math.random() * options.length)];
}

function weeklyInsight() {
  const entries = Object.entries(state.days)
    .filter(([, v]) => v.checkedIn)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 7)
    .map(([, v]) => v.task.category);
  if (!entries.length) return '這週開始第一步，Future Her 會陪妳慢慢穩下來。';
  const score = Object.fromEntries(categories.map((c) => [c, 0]));
  entries.forEach((c) => (score[c] += 1));
  const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
  return `這週妳在 ${top} 的投入最明顯，持續下去會看到更大的改變。`;
}

function weeklyMix() {
  const entries = Object.entries(state.days)
    .filter(([, v]) => v.checkedIn)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 7)
    .map(([, v]) => v.task.category);
  const score = Object.fromEntries(categories.map((c) => [c, 0]));
  entries.forEach((c) => (score[c] += 1));
  return score;
}

function updateLevelTitle(state) {
  state.progress.level = Math.floor(state.progress.totalXP / 100) + 1;
  state.progress.title = [...titles].reverse().find((t) => state.progress.level >= t.minLevel)?.name ?? 'Seed of Her';
}

function dateDiffDays(a, b) {
  return Math.floor((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
}

function calcXp(completion, reflection, nextStreak, alreadyChecked) {
  let xp = 10;
  if (completion === 'done') xp += 10;
  if (completion === 'partial') xp += 5;
  if (reflection) xp += 5;
  if (!alreadyChecked && nextStreak % 7 === 0) xp += 10;
  return xp;
}
function getPersonaPhase(day, streak) {
  if (day <= 3) return 'Seed Phase';
  if (day <= 7) return 'Sync Phase';
  if (day <= 14) return 'Stability Phase';
  return streak >= 15 ? 'Embodiment Phase' : 'Embodiment Phase';
}
function getVisualPhase(day, streak, level) {
  const phases = [
    { name: 'Soft Dawn', gradient: 'bg-gradient-to-br from-rose-200 via-purple-100 to-amber-100', subtitle: 'Morning system calibration in progress.', label: 'soft breathing loop', bg: 'bg-gradient-to-b from-rose-50 via-purple-50 to-bg' },
    { name: 'Rose Orbit', gradient: 'bg-gradient-to-br from-pink-200 via-rose-200 to-purple-100', subtitle: 'Orbit stabilized. You returned to your path.', label: 'orbit drift active', bg: 'bg-gradient-to-b from-pink-50 via-purple-50 to-bg' },
    { name: 'Lavender Shield', gradient: 'bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-100', subtitle: 'Protective focus shield is softly online.', label: 'shield pulse', bg: 'bg-gradient-to-b from-violet-50 via-purple-50 to-bg' },
    { name: 'Golden Recovery', gradient: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100', subtitle: 'Recovery light detected. Rhythm is rebuilding.', label: 'recovery glow', bg: 'bg-gradient-to-b from-amber-50 via-rose-50 to-bg' },
    { name: 'Future Bloom', gradient: 'bg-gradient-to-br from-fuchsia-200 via-purple-200 to-sky-100', subtitle: 'Future identity field is blooming steadily.', label: 'bloom expansion', bg: 'bg-gradient-to-b from-fuchsia-50 via-purple-50 to-bg' }
  ];
  const idx = Math.floor((Math.max(day, streak, level) - 1) / 3) % phases.length;
  return phases[idx];
}
function getStatRank(value) {
  if (value >= 80) return 'Embodied';
  if (value >= 60) return 'Radiant';
  if (value >= 40) return 'Stable';
  if (value >= 20) return 'Warming';
  return 'Awakening';
}
function getXPProgress(totalXP) {
  const currentLevelXP = totalXP % 100;
  return { currentLevelXP, nextLevelXP: 100, percent: currentLevelXP };
}
function getHomeMessage(s) {
  const pool = ['You returned.', 'Small progress detected.', 'Identity stability increased.', 'Future Her is forming.', 'The system remembers your effort.'];
  return pool[(s.profile.currentDay + s.progress.currentStreak) % pool.length];
}
function getUnlockedAchievements(s) {
  const achievements = [];
  if (s.progress.completedDays >= 1) achievements.push('First Check-in');
  if (s.progress.currentStreak >= 3) achievements.push('3-Day Return');
  if (s.progress.currentStreak >= 7) achievements.push('7-Day Stability Trial');
  if (Object.values(s.days).some((d) => d.reflection)) achievements.push('First Reflection');
  if (s.progress.level >= 3) achievements.push('Level 3 Awakening');
  if (s.progress.completedDays >= 10) achievements.push('10 Days of Becoming');
  return achievements.slice(-3).reverse();
}
function getInnerEnemy(s) {
  const day = s.profile.currentDay;
  const recent7 = Array.from({ length: 7 }, (_, i) => s.days[day - i]).filter(Boolean);
  const strongDays = recent7.filter((d) => d.checkedIn && (d.taskCompletion === 'done' || d.reflection)).length;
  const weakDays = recent7.filter((d) => !d.checkedIn || d.taskCompletion === 'none').length;
  const candidates = ['三日放棄怪', '拖延小怪', '混亂霧氣', '自我懷疑影子', '能量低潮獸'];
  const name = weakDays >= 4 ? candidates[1] : s.progress.currentStreak >= 7 ? candidates[0] : strongDays <= 2 ? candidates[4] : candidates[(day + s.progress.level) % candidates.length];
  const hp = Math.max(0, 100 - s.progress.currentStreak * 8 - s.progress.completedDays * 2 - strongDays * 4);
  return { name, hp, reduced: 100 - hp, trial: s.progress.currentStreak >= 7 ? `Streak ${s.progress.currentStreak} 達成：Day 7 Stability Trial cleared` : 'Tiny resistance tracking online' };
}

let state = load();
let archiveFilter = 'all';
let archiveSort = 'newest';
let archiveCategory = 'all';
ensureToday(state);
save(state);

const pages = [...document.querySelectorAll('.page')];
const nav = (id) => pages.forEach((p) => p.classList.toggle('hidden', p.id !== id));
document.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => nav(b.dataset.nav)));



const stopWords = new Set(['的','了','我','也','很','在','是','和','有','就','都','你','妳','自己','今天','一個','可以','想要','這個','那個']);

function buildVisionBoardFromJournal(entries) {
  const text = entries.map((e) => `${e.title || ''} ${e.content || ''}`).join(' ');
  const keywords = (text.match(/[一-龥A-Za-z]{2,}/g) || [])
    .map((w) => w.trim())
    .filter((w) => w && !stopWords.has(w))
    .reduce((acc, w) => ((acc[w] = (acc[w] || 0) + 1), acc), {});
  const topWords = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
  const topImages = entries.map((e) => e.image).filter(Boolean).slice(-4);

  const generatedCards = [
    { type: 'headline', title: '100天後的我', text: topWords.length ? topWords.join(' · ') : '穩定 · 自信 · 發光' },
    { type: 'action', title: '我正在成為', text: `我每天用小步累積，現在已經收集 ${entries.length} 篇日記。` },
    ...topWords.slice(0, 2).map((word) => ({ type: 'focus', title: `聚焦：${word}`, text: `把「${word}」變成每天看得見的行動。` })),
    ...topImages.map((image) => ({ type: 'image', image, title: '來自日記的畫面', text: '這是我正在前進的證據。' }))
  ];

  return { createdAt: new Date().toISOString(), sourceCount: entries.length, cards: generatedCards };
}

function fileToDataURL(file, onload) {
  if (!file) return onload('');
  const reader = new FileReader();
  reader.onload = () => {
    if (!file.type.startsWith('image/')) return onload(String(reader.result));
    const img = new Image();
    img.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onload(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => onload(String(reader.result));
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function renderJournal() {
  const root = document.getElementById('journalList');
  const items = [...state.journalEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!items.length) { root.innerHTML = '<p class="text-sm text-textSub">還沒有日記收藏，先新增第一篇吧。</p>'; return; }
  root.innerHTML = items.map((item) => `
    <article class="bg-white rounded-2xl border border-line p-3 space-y-2">
      <div class="flex justify-between text-xs text-textSub"><span>${item.title || '未命名日記'}</span><span>${item.dayLabel}</span></div>
      <p class="text-sm">${item.content}</p>
      ${item.image ? `<img src="${item.image}" class="w-full rounded-xl border border-line" alt="journal image" />` : ''}
    </article>`).join('');
}

function renderBoard() {
  const root = document.getElementById('boardList');
  const [latest] = [...state.versionBoard]
    .filter((entry) => Array.isArray(entry.cards))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (!latest) { root.innerHTML = '<p class="text-sm text-textSub col-span-2">還沒有 Vision Board，先到日記牆累積內容再生成。</p>'; return; }
  root.innerHTML = latest.cards.map((card) => `
    <article class="bg-white rounded-2xl border border-line p-3 space-y-2 ${card.type === 'headline' ? 'col-span-2' : ''}">
      <p class="text-xs text-textSub">${card.title || ''}</p>
      ${card.image ? `<img src="${card.image}" class="w-full h-28 object-cover rounded-xl border border-line" alt="vision board image" />` : ''}
      <p class="text-sm ${card.type === 'headline' ? 'font-semibold' : ''}">${card.text || ''}</p>
    </article>`).join('');
}

let draggingTodoId = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function moveTodo(activeId, targetId, insertAfter = false) {
  if (!activeId || !targetId || activeId === targetId) return;
  const from = state.todoTasks.findIndex((task) => task.id === activeId);
  const to = state.todoTasks.findIndex((task) => task.id === targetId);
  if (from < 0 || to < 0) return;
  const [item] = state.todoTasks.splice(from, 1);
  const adjustedTo = from < to ? to - 1 : to;
  state.todoTasks.splice(adjustedTo + (insertAfter ? 1 : 0), 0, item);
  save(state);
  renderTodo();
}

function renderTodo() {
  const root = document.getElementById('todoList');
  if (!root) return;
  if (!state.todoTasks.length) {
    root.innerHTML = '<p class="text-sm text-textSub bg-surface border border-line rounded-xl p-3">還沒有 TODO，先新增一件想完成的小事。</p>';
    return;
  }
  root.innerHTML = state.todoTasks.map((task) => `
    <article data-todo-id="${task.id}" draggable="true" class="todo-item bg-white rounded-xl border border-line p-3 flex items-center gap-2 ${draggingTodoId === task.id ? 'opacity-60' : ''}">
      <button data-drag-handle="${task.id}" class="cursor-grab select-none px-2 py-1 rounded-lg border border-line text-textSub" aria-label="drag todo">☰</button>
      <p class="flex-1 min-w-0 text-sm break-words">${escapeHtml(task.text)}</p>
      <button data-delete-todo="${task.id}" class="px-3 py-1 rounded-lg border border-line text-sm">Delete</button>
    </article>`).join('');

  root.querySelectorAll('[data-delete-todo]').forEach((button) => {
    button.addEventListener('click', () => {
      state.todoTasks = state.todoTasks.filter((task) => task.id !== button.dataset.deleteTodo);
      save(state);
      renderTodo();
    });
  });

  root.querySelectorAll('.todo-item').forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      draggingTodoId = item.dataset.todoId;
      event.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragover', (event) => {
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      moveTodo(draggingTodoId, item.dataset.todoId, event.clientY > rect.top + rect.height / 2);
    });
    item.addEventListener('dragend', () => {
      draggingTodoId = null;
      renderTodo();
    });
  });

  root.querySelectorAll('[data-drag-handle]').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      draggingTodoId = handle.dataset.dragHandle;
      event.preventDefault();
    });
  });
}

document.addEventListener('pointermove', (event) => {
  if (!draggingTodoId) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-todo-id]');
  if (target) {
    const rect = target.getBoundingClientRect();
    moveTodo(draggingTodoId, target.dataset.todoId, event.clientY > rect.top + rect.height / 2);
  }
});

document.addEventListener('pointerup', () => {
  if (!draggingTodoId) return;
  draggingTodoId = null;
  renderTodo();
});

document.addEventListener('pointercancel', () => {
  if (!draggingTodoId) return;
  draggingTodoId = null;
  renderTodo();
});

function renderArchive() {
  const archive = document.getElementById('archiveList');
  const items = Object.entries(state.days)
    .filter(([, v]) => v.checkedIn)
    .filter(([, v]) => (archiveFilter === 'favorites' ? v.favorited : true))
    .filter(([, v]) => (archiveCategory === 'all' ? true : v.task.category === archiveCategory))
    .sort((a, b) => (archiveSort === 'newest' ? Number(b[0]) - Number(a[0]) : Number(a[0]) - Number(b[0])));

  document.getElementById('filterAll').setAttribute('aria-pressed', archiveFilter === 'all');
  document.getElementById('filterFav').setAttribute('aria-pressed', archiveFilter === 'favorites');

  if (!items.length) {
    archive.innerHTML = `<p class="text-sm text-textSub">${archiveFilter === 'favorites' ? '還沒有收藏訊息，先把喜歡的句子加星號吧。' : '還沒有完成記錄，今天先開始第一天吧。'}</p>`;
    return;
  }

  archive.innerHTML = items
    .map(
      ([day, v]) => `<article class="bg-white border border-line rounded-xl p-3">
      <div class="flex justify-between items-center">
        <p class="text-xs text-textSub">Day ${day}</p>
        <button data-fav-day="${day}" class="text-lg" aria-label="toggle favorite">${v.favorited ? '⭐' : '☆'}</button>
      </div>
      <p>${v.futureMessage}</p>
      <p class="text-sm text-textSub">${v.reflection || '—'}</p>
    </article>`
    )
    .join('');

  document.querySelectorAll('[data-fav-day]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const day = Number(btn.dataset.favDay);
      state.days[day].favorited = !state.days[day].favorited;
      save(state);
      renderArchive();
    })
  );
}

function renderArchiveControls() {
  const root = document.getElementById('archiveControls');
  root.innerHTML = `
    <select id="archiveSort" class="px-3 py-1 rounded-full border border-line bg-surface text-sm">
      <option value="newest">最新優先</option>
      <option value="oldest">最舊優先</option>
    </select>
    <select id="archiveCategory" class="px-3 py-1 rounded-full border border-line bg-surface text-sm">
      <option value="all">全部分類</option>
      ${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}
    </select>
  `;
  const sort = document.getElementById('archiveSort');
  const category = document.getElementById('archiveCategory');
  sort.value = archiveSort;
  category.value = archiveCategory;
  sort.addEventListener('change', () => {
    archiveSort = sort.value;
    renderArchive();
  });
  category.addEventListener('change', () => {
    archiveCategory = category.value;
    renderArchive();
  });
}

function renderDayDetail(day) {
  const detail = document.getElementById('dayDetail');
  const entry = state.days[day];
  if (!entry) {
    detail.textContent = `Day ${day}: 尚未開始。`;
    return;
  }
  if (!entry.checkedIn) {
    detail.textContent = `Day ${day}: 已建立任務（${entry.task.title}）但尚未 check-in。`;
    return;
  }
  const deltaText = Object.entries(entry.statDelta ?? {}).map(([k, v]) => `${k} +${v}`).join(' / ') || '無';
  detail.textContent = `Day ${day}｜${completionLabel[entry.taskCompletion]}｜+${entry.xpGained} XP｜${entry.reflection || '—'}｜${deltaText}`;
}

function render() {
  ensureToday(state);
  const day = state.profile.currentDay;
  const today = state.days[day];
  const personaPhase = getPersonaPhase(day, state.progress.currentStreak, state.progress.level);
  const visualPhase = getVisualPhase(day, state.progress.currentStreak, state.progress.level);
  const achievements = getUnlockedAchievements(state);
  const enemy = getInnerEnemy(state);

  document.getElementById('dayLabel').textContent = `Day ${day} / 100`;
  document.getElementById('progressBar').style.width = `${day}%`;
  document.getElementById('todayMessage').textContent = today.futureMessage;
  document.getElementById('todayTask').textContent = `${today.task.title} · ${today.task.category}`;
  document.getElementById('streakText').textContent = `🔥 ${state.progress.currentStreak}`;
  document.getElementById('xpText').textContent = `Lv.${state.progress.level} · ${state.progress.totalXP} XP`;
  document.getElementById('todayStatus').textContent = today.checkedIn ? `已完成（${completionLabel[today.taskCompletion]}）` : '尚未 check-in';
  document.getElementById('homeWelcomeMessage').textContent = getHomeMessage(state);
  document.getElementById('coreStage').textContent = personaPhase;
  document.getElementById('coreVisualLabel').textContent = `${visualPhase.name} · ${visualPhase.label}`;
  document.getElementById('coreSubtitle').textContent = visualPhase.subtitle;
  document.getElementById('coreOrb').className = `orb-core w-36 h-36 rounded-full shadow-glow ${visualPhase.gradient}`;
  document.getElementById('appBody').className = `text-textMain min-h-screen transition-all duration-700 ${visualPhase.bg}`;
  document.getElementById('nextStepHint').textContent = today.checkedIn
    ? '很棒，明天再回來維持 streak。'
    : hasCompletedAnyDay()
      ? '先完成今天 check-in，維持節奏。'
      : '歡迎開始 Day 1：先花 3 分鐘完成第一次 check-in。';

  document.getElementById('mood').value = today.mood;
  document.getElementById('moodLabel').textContent = today.mood;
  document.getElementById('completion').value = today.taskCompletion;
  document.getElementById('reflection').value = today.reflection;
  document.getElementById('reflectionCount').textContent = `${today.reflection.length}/120`;

  document.getElementById('completedDaysText').textContent = state.progress.completedDays;
  document.getElementById('currentStreakText').textContent = state.progress.currentStreak;
  document.getElementById('longestStreakText').textContent = state.progress.longestStreak;

  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  for (let i = 1; i <= 100; i += 1) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'h-6 rounded';
    const entry = state.days[i];
    cell.style.background = !entry ? '#F6EDF3' : !entry.checkedIn ? '#EABED0' : entry.taskCompletion === 'done' ? '#D58CB1' : '#E5A8C2';
    cell.title = `Day ${i}`;
    cell.addEventListener('click', () => renderDayDetail(i));
    heatmap.appendChild(cell);
  }

  const statsList = document.getElementById('statsList');
  statsList.innerHTML = `<p class="text-sm text-textSub mb-2">${state.progress.title}</p><p class="text-sm text-textSub mb-3">${weeklyInsight()}</p>`;
  const xpProgress = getXPProgress(state.progress.totalXP);
  document.getElementById('personaHeader').textContent = `Lv.${state.progress.level} · ${state.progress.title}`;
  document.getElementById('personaMeta').textContent = `Total XP ${state.progress.totalXP} · Current Phase: ${personaPhase}`;
  document.getElementById('xpProgressBar').style.width = `${xpProgress.percent}%`;
  document.getElementById('xpProgressText').textContent = `${xpProgress.currentLevelXP} / ${xpProgress.nextLevelXP} XP to next level`;
  document.getElementById('enemyStatus').textContent = `你已經削弱了「${enemy.name}」 ${enemy.reduced}%`;
  document.getElementById('enemyHpBar').style.width = `${enemy.hp}%`;
  document.getElementById('enemyTrialText').textContent = enemy.trial;

  const achRoot = document.getElementById('achievementList');
  achRoot.innerHTML = achievements.length
    ? achievements.map((a) => `<span class="px-3 py-1 rounded-full text-xs bg-white border border-line">${a}</span>`).join('')
    : '<span class="text-xs text-textSub">First Check-in will unlock your first badge.</span>';

  statsKeys.forEach((k) => {
    const v = state.stats[k];
    const row = document.createElement('div');
    row.innerHTML = `<div class="flex items-center justify-between text-sm mb-1"><p>${statDisplay[k]}</p><p>${v} · ${getStatRank(v)}</p></div><div class="h-2 bg-line rounded mb-2"><div class="h-2 bg-primary rounded" style="width:${Math.min(v, 100)}%"></div></div>`;
    statsList.appendChild(row);
  });

  const mix = weeklyMix();
  const mixRoot = document.getElementById('weeklyMix');
  mixRoot.innerHTML = "";
  categories.forEach((c) => {
    const row = document.createElement('div');
    row.className = "flex items-center justify-between text-xs";
    row.innerHTML = `<span class="capitalize text-textSub">${c}</span><span>${mix[c]} 次</span>`;
    mixRoot.appendChild(row);
  });

  const trendRoot = document.getElementById('weeklyTrend');
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = day - (6 - i);
    const entry = state.days[d];
    if (!entry || !entry.checkedIn) return { label: `D${d}`, score: 0 };
    const base = entry.taskCompletion === 'done' ? 3 : entry.taskCompletion === 'partial' ? 2 : 1;
    return { label: `D${d}`, score: base + (entry.reflection ? 1 : 0) };
  });
  trendRoot.innerHTML = '';
  last7.forEach((point) => {
    const row = document.createElement('div');
    row.className = 'space-y-1';
    row.innerHTML = `<div class="text-[10px] text-textSub">${point.label}</div><div class="h-12 bg-line rounded flex items-end"><div class="w-full bg-primaryDeep rounded" style="height:${point.score * 20}%"></div></div>`;
    trendRoot.appendChild(row);
  });
  const strongDays = last7.filter((p) => p.score >= 3).length;
  document.getElementById('trendFeedback').textContent =
    strongDays >= 4 ? '這週節奏很穩，妳正在把改變變成習慣。' : '先把每次 check-in 做小做穩，趨勢就會慢慢拉起來。';

  renderArchiveControls();
  renderArchive();
  renderJournal();
  renderBoard();
  renderTodo();
}

function showSuccessModal(text) {
  document.getElementById('successSummary').textContent = text;
  document.getElementById('successModal').classList.remove('hidden');
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.add('hidden');
}

document.getElementById('closeSuccess').addEventListener('click', closeSuccessModal);
document.getElementById('successModal').addEventListener('click', (e) => {
  if (e.target.id === 'successModal') closeSuccessModal();
});

document.getElementById('mood').addEventListener('input', (e) => {
  document.getElementById('moodLabel').textContent = e.target.value;
});
document.getElementById('reflection').addEventListener('input', (e) => {
  document.getElementById('reflectionCount').textContent = `${e.target.value.length}/120`;
});
document.getElementById('filterAll').addEventListener('click', () => {
  archiveFilter = 'all';
  renderArchive();
});
document.getElementById('filterFav').addEventListener('click', () => {
  archiveFilter = 'favorites';
  renderArchive();
});



document.getElementById('addJournalEntry').addEventListener('click', () => {
  const title = document.getElementById('journalTitle').value.trim();
  const content = document.getElementById('journalContent').value.trim();
  const file = document.getElementById('journalImage').files?.[0];
  if (!content && !file) return alert('請先寫下日記內容或上傳一張圖片');
  fileToDataURL(file, (image) => {
    state.journalEntries.push({ title, content, image, createdAt: new Date().toISOString(), dayLabel: `Day ${state.profile.currentDay}` });
    save(state);
    document.getElementById('journalTitle').value = '';
    document.getElementById('journalContent').value = '';
    document.getElementById('journalImage').value = '';
    renderJournal();
  });
});

document.getElementById('addTodo').addEventListener('click', () => {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (!text) return;
  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.todoTasks.push({ id, text, createdAt: new Date().toISOString() });
  save(state);
  input.value = '';
  renderTodo();
});

document.getElementById('todoInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') document.getElementById('addTodo').click();
});

document.getElementById('generateVisionBoard').addEventListener('click', () => {
  if (!state.journalEntries.length) return alert('請先在 100天日記牆新增至少一篇內容');
  const generated = buildVisionBoardFromJournal(state.journalEntries);
  state.versionBoard = [generated];
  save(state);
  document.getElementById('visionBoardHint').textContent = `已生成（來源 ${generated.sourceCount} 篇日記）`;
  renderBoard();
});

document.getElementById('submitCheckin').addEventListener('click', () => {
  const day = state.profile.currentDay;
  const today = state.days[day];
  const completion = document.getElementById('completion').value;
  const reflection = document.getElementById('reflection').value.trim();
  const mood = Number(document.getElementById('mood').value);
  const alreadyChecked = today.checkedIn;

  if (alreadyChecked) {
    state.progress.totalXP -= today.xpGained;
    Object.entries(today.statDelta ?? {}).forEach(([k, v]) => {
      state.stats[k] = Math.max(0, state.stats[k] - v);
    });
  }

  let nextStreak = state.progress.currentStreak;
  if (!alreadyChecked) {
    const last = state.progress.lastCheckInDate;
    if (!last) nextStreak = 1;
    else {
      const diff = dateDiffDays(last, todayISO());
      nextStreak = diff === 1 ? state.progress.currentStreak + 1 : 1;
    }
  }

  const xp = calcXp(completion, reflection, nextStreak, alreadyChecked);
  Object.assign(today, { checkedIn: true, mood, taskCompletion: completion, reflection, xpGained: xp });

  state.progress.totalXP += xp;
  if (!alreadyChecked) {
    state.progress.currentStreak = nextStreak;
    state.progress.completedDays += 1;
  }

  state.progress.lastCheckInDate = todayISO();
  state.progress.longestStreak = Math.max(state.progress.longestStreak, state.progress.currentStreak);
  const gain = completion === 'done' ? 2 : completion === 'partial' ? 1 : 0;
  const moodBonusKey = mood >= 4 ? 'confidence' : mood <= 2 ? 'calmness' : null;
  const statDelta = {};
  if (gain > 0) {
    state.stats[today.task.category] = Math.min(100, state.stats[today.task.category] + gain);
    statDelta[today.task.category] = gain;
  }
  if (moodBonusKey && moodBonusKey !== today.task.category) {
    state.stats[moodBonusKey] = Math.min(100, state.stats[moodBonusKey] + 1);
    statDelta[moodBonusKey] = (statDelta[moodBonusKey] ?? 0) + 1;
  }
  today.statDelta = statDelta;
  updateLevelTitle(state);

  save(state);
  render();
  nav('home');
  const deltaSummary = Object.entries(today.statDelta).map(([k, v]) => `${k}+${v}`).join(' · ') || 'no stat gain';
  const enemy = getInnerEnemy(state);
  const feedback = ['Your future self felt this one.', 'You cleared a tiny resistance today.', 'Identity stability increased.'][(day + state.progress.level) % 3];
  showSuccessModal(`+${xp} XP · ${deltaSummary} · Streak ${state.progress.currentStreak} · Inner Enemy HP -${Math.min(14, enemy.reduced)} · ${feedback}`);
});


function exportState() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `future-her-100-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importStateFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!validateImportedState(parsed)) throw new Error('invalid-format');
      const normalized = normalizeState(parsed);
      const previewNode = document.getElementById('importPreview');
      const previewText = `將匯入：Day 紀錄 ${Object.keys(normalized.days).length} 筆、已完成 ${normalized.progress.completedDays} 天、目前 ${normalized.progress.totalXP} XP。`;
      previewNode.textContent = previewText;
      previewNode.classList.remove('hidden');
      if (!confirm(`${previewText}\n\n確認覆蓋目前資料？`)) return;
      normalized.meta.schemaVersion = SCHEMA_VERSION;
      state = normalized;
      ensureToday(state);
      save(state);
      render();
      nav('home');
      showSuccessModal('資料匯入成功，已回到 Home。');
    } catch {
      alert('匯入失敗：檔案格式不符合 Future Her: 100 備份格式。');
    }
  };
  reader.readAsText(file);
}


document.getElementById('exportData').addEventListener('click', exportState);
document.getElementById('importDataBtn').addEventListener('click', () => {
  document.getElementById('importDataInput').click();
});
document.getElementById('importDataInput').addEventListener('change', (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;
  importStateFromFile(file);
  event.target.value = '';
});

document.getElementById('resetData').addEventListener('click', () => {
  if (!confirm('確定要重置所有 100 天資料嗎？')) return;
  state = createInitialState();
  ensureToday(state);
  save(state);
  render();
  nav('home');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js?v=6'));
}

render();
