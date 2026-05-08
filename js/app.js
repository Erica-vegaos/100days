const STORAGE_KEY = 'fh100_app_v1';
const SCHEMA_VERSION = 1;

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
    days: {}
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
    days: safe.days ?? {}
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

let state = load();
let archiveFilter = 'all';
let archiveSort = 'newest';
let archiveCategory = 'all';
ensureToday(state);
save(state);

const pages = [...document.querySelectorAll('.page')];
const nav = (id) => pages.forEach((p) => p.classList.toggle('hidden', p.id !== id));
document.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => nav(b.dataset.nav)));

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

  document.getElementById('dayLabel').textContent = `Day ${day} / 100`;
  document.getElementById('progressBar').style.width = `${day}%`;
  document.getElementById('todayMessage').textContent = today.futureMessage;
  document.getElementById('todayTask').textContent = `${today.task.title} · ${today.task.category}`;
  document.getElementById('streakText').textContent = `🔥 ${state.progress.currentStreak}`;
  document.getElementById('xpText').textContent = `Lv.${state.progress.level} · ${state.progress.totalXP} XP`;
  document.getElementById('todayStatus').textContent = today.checkedIn ? `已完成（${completionLabel[today.taskCompletion]}）` : '尚未 check-in';
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
  statsKeys.forEach((k) => {
    const v = state.stats[k];
    const row = document.createElement('div');
    row.innerHTML = `<p class="text-sm mb-1 capitalize">${k} ${v}</p><div class="h-2 bg-line rounded mb-2"><div class="h-2 bg-primary rounded" style="width:${Math.min(v, 100)}%"></div></div>`;
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
  showSuccessModal(`+${xp} XP · ${deltaSummary} · Streak ${state.progress.currentStreak}`);
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
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}

render();
