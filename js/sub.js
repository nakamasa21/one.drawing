// =====================================================
// sub.js  UI / 表示 / コピー / ツイート（最終安定版）
// =====================================================

const TWEET_HASHTAG = "#イナイレ版ワンドロ勝負";

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

  // JSON 読み込み完了後に表示
  loadAllJSONs().then(() => {
    showBirthday();
    showMonthBirthday();
    updateHistory();
    updateAllButtonStates();
    updateTweetCounter("");
  });
});

// =====================================================
// 抽選 → UI 表示
// =====================================================
async function drawTopicUI() {
  const result = await drawAllTopics();
  const parts = [];

  if (result.birthdays.length) {
    parts.push("本日の誕生日キャラクター：");
    result.birthdays.forEach(b => parts.push(`・${b.name}（${b.kana}）`));
    parts.push("");
  }

  if (result.events.length) {
    parts.push("本日のイベント：");
    result.events.forEach(ev => parts.push(`・${ev.title}（${ev.level}）`));
    parts.push("");
  }

  if (result.normal.length) {
    parts.push("本日のお題（通常）：");
    result.normal.forEach(t =>
      parts.push(`・${t.title}（${t.category} / ${t.level}）`)
    );
  } else {
    parts.push("本日は通常お題の抽出はありません。");
  }

  parts.push("");
  parts.push("制限時間は60分（最大120分）、21時より開始いたします。");
  parts.push("ルールをご確認の上ご参加ください。");

  const topicArea = document.getElementById("topicArea");
  topicArea.innerHTML = parts.join("<br>");
  
  const today = new Date();
  const todayStr =
    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  result.normal.forEach(t => {
    usedTopics.push({
      title: t.title,
      category: t.category,
      level: t.level,
      date: todayStr
    });
  });

  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));

  updateHistory();
  updateAllButtonStates();
  updateTweetCounter(topicArea.innerText);
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

  document.getElementById("topicArea").innerHTML = "ここにお題が表示されます";
  updateHistory();
  updateAllButtonStates();
  updateTweetCounter("");
}

// =====================================================
// 誕生日表示
// =====================================================
function showBirthday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const area = document.getElementById("birthdayArea");
  const list = birthdayMap[mm]?.filter(p => p.day === dd) || [];

  area.innerHTML = list.length
    ? list.map(p => `・${p.name}（${p.kana}）<br>`).join("")
    : "本日誕生日のキャラクターはいません。";
}

function showMonthBirthday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const area = document.getElementById("monthBirthdayArea");
  const list = birthdayMap[mm] || [];

  area.innerHTML = list.length
    ? list.map(p => `・${p.name}（${p.kana}） …… ${mm}/${p.day}<br>`).join("")
    : "今月誕生日のキャラクターはいません。";
}

// =====================================================
// コピー
// =====================================================
async function copyTopic() {
  const text = document.getElementById("topicArea").innerText.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  flashActionDone("copyBtn", "コピー完了");
}

function copyTodayBirthday() {
  const text = document.getElementById("birthdayArea").innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  flashActionDone("birthdayCopyBtn", "コピー完了");
}

function copyMonthBirthday() {
  const text = document.getElementById("monthBirthdayArea").innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  flashActionDone("monthBirthdayCopyBtn", "コピー完了");
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

// =====================================================
// ツイート復帰フィードバック
// =====================================================
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const btnId = sessionStorage.getItem("tweetPendingBtn");
    if (btnId) {
      sessionStorage.removeItem("tweetPendingBtn");
      flashActionDone(btnId, "ツイート完了");
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