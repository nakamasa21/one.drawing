// =====================================================
// main.js  データ読込 & 抽選ロジック
// =====================================================

let birthdayMap = {};
let eventsMap = [];
let topics = [];
let levelScores = {};
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

// -----------------------------
// JSON 読込
// -----------------------------
async function loadAllJSONs() {
  const [birthday, events, topicsData, levelJson] = await Promise.all([
    fetch("./data/birthday.json").then(r => r.json()),
    fetch("./data/events.json").then(r => r.json()),
    fetch("./data/topics.json").then(r => r.json()),
    fetch("./data/levels.json").then(r => r.json())
  ]);

  birthdayMap = birthday.month;
  levelScores = levelJson.levels;

  // events.json → 3カテゴリを結合
  eventsMap = [
    ...events.standard.map(e => ({ ...e, category: "standard" })),
    ...events.special.map(e => ({ ...e, category: "special" })),
    ...events.inazumaEleven.map(e => ({ ...e, category: "inazumaEleven" }))
  ];

  // topics.json → categories の中身を全部 flatten
  topics = [];
  for (const cat in topicsData.categories) {
    topicsData.categories[cat].forEach(t => {
      topics.push({
        ...t,
        category: cat
      });
    });
  }
}

// =====================================================
// 誕生日 抽選
// =====================================================
function pickBirthday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return birthdayMap[mm]?.filter(p => p.day === dd) || [];
}

// =====================================================
// イベント日 抽選
// =====================================================
function pickEvents() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const results = [];

  eventsMap.forEach(ev => {
    if (ev.category === "inazumaEleven") {
      if (ev.month === mm && ev.day === dd) {
        const anniv = Number(yyyy) - Number(ev.year);
        results.push({
          ...ev,
          title: `${ev.title}（${anniv}周年）`
        });
      }
      return;
    }

    // 通常イベント
    if (ev.year === "") {
      if (ev.month === mm && ev.day === dd) results.push(ev);
    } else {
      if (ev.year === yyyy && ev.month === mm && ev.day === dd) results.push(ev);
    }
  });

  return results;
}

// =====================================================
// 通常お題 抽選
// =====================================================
function pickNormalTopics(scoreSum) {
  // 通常お題の件数決定
  let count = 0;
  if (scoreSum === 0) count = 2;
  else if (scoreSum >= 1 && scoreSum <= 3) count = 1;
  else count = 0;

  if (count === 0) return [];

  // 今月 seasonal 抽出
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  let available = topics.filter(t => {
    if (t.months) return t.months.includes(mm);
    return true;
  });

  // usedTopics による除外
  available = available.filter(t => {
    return !usedTopics.some(u => u.title === t.title);
  });

  // score 合計は「誕生日 + イベント + 通常」で 4 にする必要がある
  const targetScore = 4 - scoreSum;
  if (targetScore <= 0) return [];

  const picks = [];

  // ランダムに選びつつ targetScore を満たす
  let candidates = [...available];

  while (picks.length < count && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    const t = candidates[idx];

    const lv = levelScores[t.level] ?? 1;

    if (lv <= targetScore) {
      picks.push(t);
      break; // 通常お題は最大でも１つ or 2つしか出ない → 1回で break
    } else {
      candidates.splice(idx, 1);
    }
  }

  return picks;
}

// =====================================================
// 抽選本体（sub から呼ぶ）
// =====================================================
async function drawAllTopics() {
  await loadAllJSONs();

  const birthdays = pickBirthday();
  const events = pickEvents();

  // 誕生日・イベントのスコア合計
  const scoreSum = [
    ...birthdays.map(b => levelScores[b.level]),
    ...events.map(e => levelScores[e.level])
  ].reduce((a, b) => a + b, 0);

  const normal = pickNormalTopics(scoreSum);

  return { birthdays, events, normal };
}