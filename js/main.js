// =====================================================
// main.js  データ読込 & 抽選ロジック
// =====================================================

let birthdayMap = {};
let eventsMap = [];
let topics = [];
let levelScores = {};
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");
let tweetConfig = {};

// -----------------------------
// JSON 読込
// -----------------------------
async function loadAllJSONs() {
  const [birthday, events, topicsData, levelJson, tweetJson] = await Promise.all([
    fetch("./data/birthday.json").then(r => r.json()),
    fetch("./data/events.json").then(r => r.json()),
    fetch("./data/topics.json").then(r => r.json()),
    fetch("./data/levels.json").then(r => r.json()),
    fetch("./data/tweet.json").then(r => r.json())
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
  
  tweetConfig = tweetJson;
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
  let count = scoreSum === 0 ? 2 : (scoreSum <= 3 ? 1 : 0);
  if (count === 0) return [];
  
  // score 合計は 「誕生日 + イベント + 通常」で 4 にする必要がある
  const targetScore = 4 - scoreSum;
  // 「誕生日 + イベント」が4以上の場合、通常お題なし
  if (targetScore <= 0) return [];
  
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  // 今月 seasonal 抽出、使用済を除外
  let candidates = topics.filter(t => {
    if (t.months) return t.months.includes(mm);
    return true;
  }).filter(t => !usedTopics.some(u => u.title === t.title));

  const picks = [];
  let remainScore = targetScore;

  // 通常お題選出
  while (picks.length < count && remainScore > 0) {

    let pool = candidates.filter(t => {
      const lv = levelScores[t.level] ?? 1;
      return lv <= remainScore;
    });

    // 最終段階は「一致する level に限定」
    if (remainScore <= 3) {
      const exact = pool.filter(t => {
        const lv = levelScores[t.level] ?? 1;
        return lv === remainScore;
      });
      if (exact.length) pool = exact;
    }

    if (!pool.length) return []; // 失敗

    const t = pool[Math.floor(Math.random() * pool.length)];
    const lv = levelScores[t.level] ?? 1;

    picks.push(t);
    remainScore -= lv;

    candidates = candidates.filter(x => x.title !== t.title);
  }

  return remainScore === 0 ? picks : [];
}
// =====================================================
// 抽選本体（sub から呼ぶ）
// =====================================================
async function drawAllTopics() {

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
// =====================================================
// ★ 外部から使用済みお題を注入するためのAPI
// =====================================================
function setUsedTopics(list) {
  usedTopics = Array.isArray(list) ? list : [];
}