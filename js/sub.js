// =====================================================
// sub.js  UI / 表示 / コピー / ツイート
// =====================================================

let TWEET_HASHTAG = "";
let lastDrawResult = null;
let TODAY_KEY = "todayDrawResult";
let historyData = { history: [] };

// -----------------------------
// 初期イベント設定
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {

  document.getElementById("drawBtn").addEventListener("click", drawTopicUI);
  document.getElementById("resetBtn").addEventListener("click", resetHistoryUI);

  document.getElementById("copyBtn").addEventListener("click", copyTopic);
  document.getElementById("tweetBtn").addEventListener("click", tweetTopic);

  document.getElementById("birthdayCopyBtn").addEventListener("click", copyTodayBirthday);
  document.getElementById("birthdayTweetBtn").addEventListener("click", tweetTodayBirthday);

  document.getElementById("monthBirthdayCopyBtn").addEventListener("click", copyMonthBirthday);
  document.getElementById("monthBirthdayTweetBtn").addEventListener("click", tweetMonthBirthday);

  document.getElementById("announceCopyBtn").addEventListener("click", copyAnnounce);
  document.getElementById("announceTweetBtn").addEventListener("click", tweetAnnounce);
  
  document.getElementById("redoBtn").addEventListener("click", redoToday);
  
  // JSON 読み込み完了後に表示
  loadAllJSONs()
  .then(async () => {
    await loadHistoryJSON();
    applyUsedTopics();

    showBirthday();
    showMonthBirthday();
    updateHistory();
    updateAllButtonStates();
    updateTweetCounter("");
    TWEET_HASHTAG = tweetConfig.hashtag || "";
    restoreTodayResult();
  })
  .catch(err => {
    console.error("JSON load error", err);
    alert("データの読み込みに失敗しました。" + err);
  });
});

// =====================================================
// 抽選 → UI 表示
// =====================================================
async function drawTopicUI() {
  lastDrawResult = await drawAllTopics();
  const result = lastDrawResult;
  const topicAreaText = buildTopicAreaTextFromResult(lastDrawResult);
  if(topicAreaText == "") {
    alert("お題の抽出に失敗しました。");
    return;
  }

  document.getElementById("topicArea").innerHTML = topicAreaText;
  
  const today = new Date();
  const todayStr =
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  // 履歴保存
  result.normal.forEach(t => {
    usedTopics.push({
      title: t.title,
      category: t.category,
      level: t.level,
      date: todayStr
    });
    historyData.history.push({
      id:t.id,
      title: t.title,
      category: t.category,
      level: t.level,
      date: todayStr
    });
  });
  applyUsedTopics();
  
  // 当日履歴保存
  localStorage.setItem(
    TODAY_KEY,JSON.stringify({
      date: todayStr,
      result: lastDrawResult
    })
  );
  
  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));

  updateHistory();
  updateAllButtonStates();
  updateTweetCounter(document.getElementById("topicArea").innerText);
  document.getElementById("announceArea").innerText =
  buildAnnounceTextFromResult(lastDrawResult);
}
// =====================================================
// お題（誕生日、イベント、通常）
// =====================================================
function buildTopicLinesFromResult(result) {
  const lines = [];

  if (result.birthdays?.length) {
    result.birthdays.forEach(b => {
      lines.push(`・${b.name}（誕生日）`);
    });
  }
  if (result.events?.length) {
    result.events.forEach(e => {
      lines.push(`・${e.title}`);
    });
  }
  if (result.normal?.length) {
    result.normal.forEach(t => {
      lines.push(`・${t.title}（${t.category} / ${t.level}）`);
    });
  }
  return lines.join("\n");
}
// =====================================================
// 履歴
// =====================================================
function updateHistory() {
  const ul = document.getElementById("history");
  ul.innerHTML = "";
  usedTopics.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.title}（${t.category}） — ${t.date}`;
    ul.appendChild(li);
  });
}

function resetHistoryUI() {
  usedTopics.length = 0;
  localStorage.removeItem("usedTopics");

  document.getElementById("topicArea").innerHTML = "ここにお題が表示されます。";
  document.getElementById("announceArea").innerText = "お題を引くとここに開始文が表示されます。"
  updateHistory();
  updateAllButtonStates();
  updateTweetCounter("");
}
// =====================================================
// 当日履歴再表示
// =====================================================
function restoreTodayResult() {
  const saved = localStorage.getItem(TODAY_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  const today = new Date();
  const todayStr =
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  if (data.date !== todayStr) return;

  lastDrawResult = data.result;

  document.getElementById("topicArea").innerHTML =
    buildTopicAreaTextFromResult(lastDrawResult);

  document.getElementById("announceArea").innerText =
    buildAnnounceTextFromResult(lastDrawResult);

  updateAllButtonStates();
  updateTweetCounter(document.getElementById("topicArea").innerText);
}
// =====================================================
// 誕生日表示
// =====================================================
function showBirthday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  let list = birthdayMap[mm]?.filter(p => p.day === dd) || [];
  const text = buildBirthdayText(list, "birthdayToday");

  document.getElementById("birthdayArea").innerText =
    text || "本日誕生日のキャラクターはいません。";
}

function showMonthBirthday() {
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  let list = birthdayMap[mm] || [];

  const text = buildBirthdayText(
    list.map(p => ({ ...p, kana: `${mm}/${p.day}` })),
    "birthdayMonth"
  );

  document.getElementById("monthBirthdayArea").innerText =
    text || "今月誕生日のキャラクターはいません。";
}

// =====================================================
// コピー
// =====================================================
async function copyFromArea(areaId, btnId) {
  const el = document.getElementById(areaId);
  if (!el) return;

  const text = el.innerText.trim();
  if (!text) return;

  await navigator.clipboard.writeText(text);
  flashActionDone(btnId, "Copied");
}
function copyTopic() {
  copyFromArea("topicArea", "copyBtn");
}

function copyTodayBirthday() {
  copyFromArea("birthdayArea", "birthdayCopyBtn");
}

function copyMonthBirthday() {
  copyFromArea("monthBirthdayArea", "monthBirthdayCopyBtn");
}

function copyAnnounce() {
  copyFromArea("announceArea", "announceCopyBtn");
}

// =====================================================
// ツイート
// =====================================================
function buildTweetText(baseText) {
  if (!baseText.trim()) return "";
  return baseText.includes(TWEET_HASHTAG)
    ? baseText
    : `${baseText}\n${TWEET_HASHTAG}`;
}

function startTweet(text, btnId) {
  const tweetText = buildTweetText(text);
  if (tweetText.length > 280) return;

  sessionStorage.setItem("tweetPendingBtn", btnId);
  window.location.href =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(tweetText);
}

function tweetTopic() {
  startTweet(document.getElementById("topicArea").innerText, "tweetBtn");
}

function tweetTodayBirthday() {
  startTweet(document.getElementById("birthdayArea").innerText, "birthdayTweetBtn");
}

function tweetMonthBirthday() {
  startTweet(document.getElementById("monthBirthdayArea").innerText, "monthBirthdayTweetBtn");
}

function tweetAnnounce() {
  startTweet(document.getElementById("announceArea").innerText, "announceTweetBtn");
}

// =====================================================
// ツイート復帰フィードバック
// =====================================================
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const btnId = sessionStorage.getItem("tweetPendingBtn");
    if (btnId) {
      sessionStorage.removeItem("tweetPendingBtn");
      flashActionDone(btnId, "Posted");
    }
  }
});

// =====================================================
// 共通UX
// =====================================================
function flashActionDone(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const before = btn.textContent;
  btn.textContent = text;
  btn.classList.add("action-done");

  setTimeout(() => {
    btn.textContent = before;
    btn.classList.remove("action-done");
  }, 1200);
}

function updateTweetCounter(baseText) {
  const counter = document.getElementById("tweetCounter");
  if (!counter) return 0;

  const len = buildTweetText(baseText).length;
  counter.textContent = `${len} / 280`;
  counter.classList.toggle("over", len > 280);
  return len;
}

function updateAllButtonStates() {
  const topicText = document.getElementById("topicArea").innerText.trim();
  const len = updateTweetCounter(topicText);

  document.getElementById("copyBtn").disabled = !topicText;
  document.getElementById("tweetBtn").disabled = !topicText || len > 280;
}

// =====================================================
// ツイート分作成
// =====================================================
function buildTextFromTemplate(templateLines, vars) {
  return templateLines.map(line => {
    let text = line;
    for (const key in vars) {
      text = text.replaceAll(`{{${key}}}`, vars[key]);
    }
    return text;
  }).join("\n");
}

function buildTopicAreaTextFromResult(result) {
  if (!result) return "";

  const topicsText = buildTopicLinesFromResult(result);

  if (!topicsText) return "";

  return buildTextFromTemplate(
    tweetConfig.templates.topics,
    {
      START: tweetConfig.times.start,
      TOPICS: topicsText
    }
  );
}

function buildAnnounceTextFromResult(result) {
  if (!result) return "";

  const topicsText = buildTopicLinesFromResult(result);

  if (!topicsText) return "";

  return buildTextFromTemplate(
    tweetConfig.templates.announce,
    {
      START: tweetConfig.times.start,
      TOPICS: topicsText,
      POST_FROM: tweetConfig.times.postFrom,
      POST_TO: tweetConfig.times.postTo
    }
  );
}

function buildBirthdayText(list, templateKey) {
  if (!list.length) return "";

  const body = list
    .map(p => `・${p.name}（${p.kana}）`)
    .join("\n");

  return buildTextFromTemplate(
    tweetConfig.templates[templateKey],
    { BIRTHDAYS: body }
  );
}
// =====================================================
// やりなおし
// =====================================================
function redoToday() {
  const today = new Date();
  const todayStr =
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // 当日の通常お題を履歴から削除
  usedTopics = usedTopics.filter(t => t.date !== todayStr);

  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));

  // 当日の抽選結果を削除
  localStorage.removeItem("todayDrawResult");
  lastDrawResult = null;

  updateHistory();

  // 再抽選
  drawTopicUI();
}

// =====================================================
// history 管理
// =====================================================
async function loadHistoryJSON() {
  try {
    const res = await fetch("./history.json");
    historyData = await res.json();
  } catch {
    historyData = { history: [] };
  }
}

function loadLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem("usedTopics") || "[]");
  } catch {
    return [];
  }
}

function mergeHistories(jsonHistory, localHistory) {
  const map = new Map();

  jsonHistory.forEach(h => {
    map.set(h.title, h);
  });

  localHistory.forEach(h => {
    if (!map.has(h.title)) {
      map.set(h.title, {
        title: h.title,
        category: h.category,
        level: h.level,
        date: h.date
      });
    }
  });

  return Array.from(map.values());
}

function applyUsedTopics() {
  const merged = mergeHistories(
    historyData.history,
    loadLocalHistory()
  );

  historyData.history = merged;

  // main.js 側へ注入
  setUsedTopics(merged);
}
// hstory.jsonエクスポート用
function exportHistoryJSON() {
  const blob = new Blob(
    [JSON.stringify({ history: historyData.history }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "history.json";
  a.click();
  URL.revokeObjectURL(url);
}