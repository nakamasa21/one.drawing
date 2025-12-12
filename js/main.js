/* =========================================================
   main.js -- お題抽出ロジック（仕様完全反映）
   - data/ にある JSON を読み込む
   - levels.json によるスコア参照
   - 誕生日・イベント・通常お題の抽出ルールを実装
   - 通常お題はランダムに、かつ合計スコアが 4 になるよう選定
   - usedTopics は localStorage で管理（topics の重複排除）
   ========================================================= */

/* ---------------------
   グローバルデータ
   --------------------- */
let LEVEL_SCORES = {};      // from data/levels.json
let TOPICS_RAW = {};        // raw topics JSON (categories...)
let EVENTS_RAW = {};        // events.json (standard/special/inszumaEleven)
let BIRTHDAY_RAW = {};      // birthday.json
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]"); // array of { id, title, date }

/* ---------------------
   設定：データパス
   --------------------- */
const PATH = {
  topics: "data/topics.json",
  events: "data/events.json",
  birthday: "data/birthday.json",
  levels: "data/levels.json"
};

/* ---------------------
   ユーティリティ：日付取得（ゼロパディング）
   --------------------- */
function getToday() {
  const d = new Date();
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0")
  };
}

/* ---------------------
   JSON 読み込み関数
   - loadAllData() を呼べば全部読み込む（冪等）
   --------------------- */
async function loadLevels() {
  if (Object.keys(LEVEL_SCORES).length) return LEVEL_SCORES;
  const res = await fetch(PATH.levels);
  const j = await res.json();
  LEVEL_SCORES = j.levels || {};
  return LEVEL_SCORES;
}

async function loadTopics() {
  if (Object.keys(TOPICS_RAW).length) return TOPICS_RAW;
  const res = await fetch(PATH.topics);
  TOPICS_RAW = await res.json();
  return TOPICS_RAW;
}

async function loadEvents() {
  if (Object.keys(EVENTS_RAW).length) return EVENTS_RAW;
  const res = await fetch(PATH.events);
  EVENTS_RAW = await res.json();
  return EVENTS_RAW;
}

async function loadBirthday() {
  if (Object.keys(BIRTHDAY_RAW).length) return BIRTHDAY_RAW;
  const res = await fetch(PATH.birthday);
  BIRTHDAY_RAW = await res.json();
  return BIRTHDAY_RAW;
}

async function loadAllData() {
  await Promise.all([loadLevels(), loadTopics(), loadEvents(), loadBirthday()]);
  // ensure usedTopics is up-to-date variable (already loaded from localStorage at top)
}

/* ---------------------
   スコア参照
   getScore(level) -> numeric
   --------------------- */
function getScore(level) {
  // LEVEL_SCORES loaded from levels.json
  // fallback 0 if unknown
  return LEVEL_SCORES[level] ?? 0;
}

/* ---------------------
   誕生日抽出（today.month & day と一致するものを全部返す）
   birthday.json 形式想定：
   { "month": { "01": [ { day:"01", name:"...", kana:"...", level:"unique" }, ... ], ... } }
   --------------------- */
function getBirthdaysForToday(today = getToday()) {
  const monthArr = (BIRTHDAY_RAW.month || {})[today.month] || [];
  // Ensure we keep level (should be unique)
  return monthArr.filter(item => item.day === today.day).map(i => ({
    ...i,
    // normalise level default unique if missing
    level: i.level || "unique"
  }));
}

/* ---------------------
   イベント抽出（rules）
   - inszumaEleven: month/day が一致するもの全て出力; title に "（n周年）" を追加表示用に付ける（処理側で付ける）
   - standard/special:
       - year == "" => month/day が一致するもの全て
       - year != "" => year/month/day が一致するもの全て
   events.json 形式想定:
   { "standard":[...], "special":[...], "inszumaEleven":[...] }
   --------------------- */
function getEventsForToday(today = getToday()) {
  const out = [];

  const cats = ["standard", "special", "inszumaEleven"];
  cats.forEach(cat => {
    const list = EVENTS_RAW[cat] || [];
    list.forEach(ev => {
      // normalize fields to strings with zero padding
      const ey = ev.year === undefined ? "" : String(ev.year);
      const em = String(ev.month).padStart(2, "0");
      const ed = String(ev.day).padStart(2, "0");

      if (cat === "inszumaEleven") {
        // match month+day only; ignore year for matching
        if (em === today.month && ed === today.day) {
          // compute anniversary years if ev.year present and numeric
          let anniversaryNote = null;
          if (ey && !isNaN(Number(ey))) {
            const diff = Number(today.year) - Number(ey);
            if (!isNaN(diff) && diff >= 0) {
              anniversaryNote = `${diff}周年`;
            }
          }
          const titleWithAnno = anniversaryNote ? `${ev.title}（${anniversaryNote}）` : ev.title;
          out.push({
            ...ev,
            year: ey,
            month: em,
            day: ed,
            level: ev.level || "common",
            _displayTitle: titleWithAnno,
            _category: cat
          });
        }
      } else {
        // standard / special
        if (ey === "" ) {
          // annual repeat
          if (em === today.month && ed === today.day) {
            out.push({
              ...ev,
              year: ey,
              month: em,
              day: ed,
              level: ev.level || "common",
              _displayTitle: ev.title,
              _category: cat
            });
          }
        } else {
          // year specified -> exact match required
          if (ey === today.year && em === today.month && ed === today.day) {
            out.push({
              ...ev,
              year: ey,
              month: em,
              day: ed,
              level: ev.level || "common",
              _displayTitle: ev.title,
              _category: cat
            });
          }
        }
      }
    });
  });

  return out;
}

/* ---------------------
   通常お題の候補取得（topics.json の categories をフラットにしてフィルタ）
   - months を持つ場合は現在月と一致するものだけ
   - usedTopics に含まれる id は除外
   topics.json 構造想定:
   { "categories": { "catA":[ { id, title, level, months? }, ... ], ... } }
   --------------------- */
function getAvailableTopicsForToday(today = getToday()) {
  const categories = TOPICS_RAW.categories || {};
  const all = [];
  Object.keys(categories).forEach(catName => {
    const arr = categories[catName] || [];
    arr.forEach(t => {
      all.push({
        ...t,
        _category: catName
      });
    });
  });

  const usedIds = new Set((usedTopics || []).map(u => u.id || u.title)); // compatibility: prefer id, fallback title
  const mm = today.month;

  // filter months and used
  const available = all.filter(t => {
    const idOrTitle = t.id || t.title;
    if (usedIds.has(idOrTitle)) return false;
    if (t.months && Array.isArray(t.months)) {
      // months entries should be zero-padded strings like "08"
      return t.months.map(x => String(x).padStart(2, "0")).includes(mm);
    }
    return true; // no months restriction -> available
  });

  return available;
}

/* ---------------------
   通常お題選定：
   - 基本ルール：誕生日+イベント の合計 S を計算し、
     件数 = { S==0 ? 2 : (S>=1 && S<=3 ? 1 : 0) }
   - 目的：topics の score 合計が (4 - S) になるようランダムに選ぶ（ただし上の件数制限を守る）
   - 最大件数は 0 / 1 / 2 のいずれか
   - 抽出アルゴリズム：
       1) 利用可能なトピック候補を取る（months と used filter済み）
       2) まず maxCount >=1 のとき、1件で一致する候補を集める
       3) 次に maxCount>=2 のとき、2件の組合せで一致する候補を全取得
       4) 取得したパターン群からランダムに1つ返す
   - 注意：必要なスコアが 0 の場合は空配列（出題無し）
   --------------------- */
function computeNormalCountByBaseScore(baseScore) {
  if (baseScore >= 4) return 0;
  if (baseScore === 0) return 2;
  // baseScore 1..3
  return 1;
}

function pickTopicsToMeetScore(neededScore, maxCount, today = getToday()) {
  // neededScore: integer >=0
  if (neededScore <= 0) return [];

  const candidates = getAvailableTopicsForToday(today);
  if (!candidates.length) return [];

  const patterns = [];

  // 1-item patterns
  if (maxCount >= 1) {
    candidates.forEach(t => {
      const s = getScore(t.level);
      if (s === neededScore) patterns.push([t]);
    });
  }

  // 2-item patterns
  if (maxCount >= 2) {
    const n = candidates.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = candidates[i], b = candidates[j];
        if (getScore(a.level) + getScore(b.level) === neededScore) {
          patterns.push([a, b]);
        }
      }
    }
  }

  if (patterns.length === 0) return [];

  // choose random pattern
  const idx = Math.floor(Math.random() * patterns.length);
  return patterns[idx];
}

/* ---------------------
   メイン：全体抽選関数
   - 戻り値：
     {
       birthdays: [...],         // 誕生日オブジェクト配列 (level included)
       events: [...],            // イベントオブジェクト配列 (level included, _displayTitle present)
       topics: [...],            // 選ばれた通常お題配列（空の場合もあり）
       scores: { birthday, events, topics, total } // 各得点
     }
   --------------------- */
async function drawAllTopics(today = getToday()) {
  // ensure data loaded
  await loadAllData();

  // 1) birthdays & events
  const bdays = getBirthdaysForToday(today).map(b => ({ ...b, level: b.level || "unique" }));
  const evs = getEventsForToday(today);

  // compute base scores
  const birthdayScore = bdays.reduce((s, b) => s + getScore(b.level), 0);
  const eventScore = evs.reduce((s, e) => s + getScore(e.level), 0);
  const baseScore = birthdayScore + eventScore;

  // determine how many topics allowed by rule
  const maxCount = computeNormalCountByBaseScore(baseScore);

  // compute needed score to reach total 4
  let needed = 4 - baseScore;
  if (needed <= 0) {
    // no topics needed or baseScore >=4
    return {
      birthdays: bdays,
      events: evs,
      topics: [],
      scores: {
        birthday: birthdayScore,
        events: eventScore,
        topics: 0,
        total: birthdayScore + eventScore
      }
    };
  }

  // If maxCount = 0 then we cannot pick topics even if needed >0 (per rules)
  if (maxCount <= 0) {
    return {
      birthdays: bdays,
      events: evs,
      topics: [],
      scores: {
        birthday: birthdayScore,
        events: eventScore,
        topics: 0,
        total: birthdayScore + eventScore
      }
    };
  }

  // pick topics to meet needed score while respecting maxCount
  const picked = pickTopicsToMeetScore(needed, maxCount, today); // returns [] or [t] or [t1,t2]

  // compute topics score
  const topicsScore = picked.reduce((s, t) => s + getScore(t.level), 0);

  // Final return (note: we DO NOT mutate usedTopics here; leave saving to UI layer or caller)
  return {
    birthdays: bdays,
    events: evs,
    topics: picked,
    scores: {
      birthday: birthdayScore,
      events: eventScore,
      topics: topicsScore,
      total: birthdayScore + eventScore + topicsScore
    }
  };
}

/* ---------------------
   Utility export (for sub.js / UI)
   - expose functions and data for UI to call
   --------------------- */
window.main_drawAllTopics = drawAllTopics;
window.main_loadAllData = loadAllData;
window.main_getAvailableTopicsForToday = getAvailableTopicsForToday;
window.main_getEventsForToday = getEventsForToday;
window.main_getBirthdaysForToday = getBirthdaysForToday;
window.main_usedTopics = usedTopics; // UI may update and then write back
window.main_saveUsedTopics = function() {
  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));
};

/* ---------------------
   End of main.js
   --------------------- */