# Future Her: 100

> 每天 3 分鐘，成為理想中的自己。

## 產品定位

Future Her: 100 是一個 **女性向、精緻質感、輕 RPG 化** 的 100 天人格成長 App。

- 技術限定：`HTML + Tailwind CSS + JavaScript + LocalStorage + PWA`
- 不使用：後端、登入、資料庫、雲端同步
- 使用情境：手機為主，可加入桌面像 App 一樣使用
- 每日使用時間：3 分鐘內完成 check-in

---

## 核心感受（體驗北極星）

1. 人生正在前進
2. 自己正在掌握中
3. 每天回到一個有歸屬感的小空間
4. 見證 100 天的小改變與成長

---

## 視覺與品牌方向

- 產品名稱：**Future Her: 100**
- 主題風格：**Rosy Minimal（方案 B）**
- 視覺關鍵字：奶油療癒、clean girl、柔和、乾淨、發光感、精緻女性向

### 色彩 Token（v1）

- `bg`: `#FFF8FB`
- `surface`: `#FFFFFF`
- `surface-soft`: `#FFF2F7`
- `primary`: `#DFA3BA`
- `primary-deep`: `#C97C9E`
- `secondary`: `#CBBBEA`
- `accent`: `#F1D3B8`
- `text-main`: `#2F2730`
- `text-sub`: `#7A6D78`
- `line`: `#F0E4EC`
- `success`: `#BFD8C8`

---

## MVP 必要功能

1. Day 1–100 進度追蹤
2. 每日 check-in
3. 每日一個小任務
4. 今日一句 Future Self message
5. 人格數值系統（6 維）
6. Streak
7. 100 天 heatmap / progress map
8. 每日一句簡短反思輸入
9. LocalStorage 儲存
10. PWA 支援（可加入手機桌面）

### 6 維人格數值

- Clarity
- Discipline
- Glow
- Calmness
- Confidence
- Energy

---

## App 頁面架構

1. **Home**
   - Day X / 100
   - Future Self 今日訊息
   - 今日任務摘要
   - streak / 進度摘要
2. **Daily Check-in**
   - 心情/能量、任務完成程度、反思輸入
   - 完成後回饋（XP / stats / streak）
3. **Growth Map / 100 Day Progress**
   - 10x10 heatmap（100 天）
   - 里程碑與每日摘要入口
4. **Persona Stats**
   - 六維人格數值
   - 本週/累積成長視覺化
5. **Future Self Archive**
   - 每日訊息歷史
   - 收藏與篩選
6. **Settings / Reset Data**
   - 主題、資料重置、版本資訊

---

## 每日 Check-in 流程（3 分鐘內）

1. 開啟 App
2. 看見 Day X / 100
3. 閱讀 Future Self message
4. 查看今日小任務
5. 選擇今日狀態 / 完成程度
6. 輸入一句反思
7. 顯示微回饋（升級感）
8. 更新 streak、heatmap、人格數值

---

## 遊戲化機制（精緻 RPG-lite）

### 核心循環

Check-in → XP → 人格值成長 → 稱號/里程碑解鎖

### MVP 參考規則

- Check-in 完成：+10 XP
- 任務完成：+10 XP（部分完成 +5）
- 填寫反思：+5 XP
- 每 7 天 streak 里程碑：額外加成

### 稱號（可調）

- Day 7：Awakening
- Day 30：Steady Bloom
- Day 60：Radiant Core
- Day 100：Future Self Embodied

---

## LocalStorage 結構（草案 v1）

主要 key：`fh100_app_v1`

```json
{
  "meta": {
    "schemaVersion": 1,
    "createdAt": "2026-05-08T00:00:00.000Z",
    "updatedAt": "2026-05-08T00:00:00.000Z"
  },
  "profile": {
    "appName": "Future Her: 100",
    "startDate": "2026-05-08",
    "currentDay": 1,
    "timezone": "Etc/UTC"
  },
  "progress": {
    "completedDays": 0,
    "currentStreak": 0,
    "longestStreak": 0,
    "lastCheckInDate": null,
    "totalXP": 0,
    "level": 1,
    "title": "Seed of Her"
  },
  "stats": {
    "clarity": 10,
    "discipline": 10,
    "glow": 10,
    "calmness": 10,
    "confidence": 10,
    "energy": 10
  },
  "today": {
    "taskId": "t_001",
    "messageId": "m_001"
  },
  "days": {
    "1": {
      "date": "2026-05-08",
      "checkedIn": false,
      "mood": null,
      "energyLevel": null,
      "task": {
        "id": "t_001",
        "title": "整理桌面 3 分鐘",
        "category": "discipline"
      },
      "taskCompletion": "none",
      "reflection": "",
      "futureMessage": "先穩穩完成一件小事，妳就已經在前進。",
      "xpGained": 0,
      "statDelta": {
        "clarity": 0,
        "discipline": 0,
        "glow": 0,
        "calmness": 0,
        "confidence": 0,
        "energy": 0
      },
      "completedAt": null
    }
  },
  "archive": {
    "messages": [
      {
        "id": "m_001",
        "day": 1,
        "text": "先穩穩完成一件小事，妳就已經在前進。",
        "tags": ["discipline", "calmness"],
        "favorited": false
      }
    ]
  }
}
```

其他 key：

- `fh100_theme`
- `fh100_install_hint_dismissed`
- `fh100_schema_version`

---

## PWA 檔案架構規劃

```txt
/
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ README.md
├─ /assets
│  ├─ /icons
│  └─ /images
├─ /styles
│  └─ main.css
└─ /js
   ├─ app.js
   ├─ state.js
   ├─ storage.js
   ├─ checkin.js
   ├─ stats.js
   ├─ map.js
   ├─ messages.js
   └─ ui.js
```

---

## 可完整落地的開發起手順序（建議）

以下順序以「最快做出可用手機版 MVP」為優先，而不是先追求完整視覺：

### Step 1 — 建立可運行骨架（先做）

目標：手機可開、可切頁、可安裝雛形。

- `index.html`：基本頁面容器 + 導覽
- `main.css`：基礎色彩 token + mobile 排版
- `app.js`：路由/切頁最小邏輯

**理由**：先確保資訊架構在手機上成立，避免先做細節後返工。

### Step 2 — 先做資料層與日更邏輯（優先級最高）

目標：所有畫面都能依賴同一份可信資料。

- `storage.js`：初始化、讀寫、重置
- `state.js`：載入 currentDay、streak、stats
- 日期與 Day 1~100 推導

**理由**：這是全產品地基，沒有資料層就無法做 check-in / heatmap。

### Step 3 — 完成 Daily Check-in（第一個可交付核心）

目標：3 分鐘流程跑通。

- 心情、任務完成度、反思輸入
- 更新 XP、streak、stats
- 顯示完成回饋

**理由**：這是每天都會用到的核心價值，最能驗證產品可用性。

### Step 4 — 回填 Home（形成完整主流程）

目標：打開 App 就知道今天要做什麼。

- Day X / 100
- 今日訊息與任務
- streak、完成狀態摘要

**理由**：Daily + Home 串起來就完成產品最小閉環。

### Step 5 — Growth Map + Persona Stats（可見成長）

目標：使用者看到自己真的前進。

- heatmap
- 六維數值顯示

**理由**：這是留存 hook（看見變化）。

### Step 6 — Future Self Archive + Settings

目標：強化情感連結與管理能力。

- 訊息歷史/收藏
- reset data、主題設定

### Step 7 — 補上 PWA 完整能力

目標：可安裝 + 基本離線體驗。

- `manifest.webmanifest`
- `service-worker.js` 快取 app shell
- 圖示、啟動畫面設定

> 這一步可在 Step 1 做雛形註冊，Step 7 再完善快取策略。

---

## 版本里程碑（建議）

- **v0.1（可跑）**：Home + Daily + LocalStorage
- **v0.2（可感知成長）**：Heatmap + Persona Stats
- **v0.3（可安裝）**：PWA 完整 + Archive + Settings
- **v1.0（可日用）**：UI 打磨、互動回饋、穩定性修正

---

## 非目標（MVP 階段不做）

- 不做登入
- 不做後端
- 不做 API 串接（含 OpenAI API）
- 不做雲端同步
- 不做社群功能
- 不做複雜動畫

