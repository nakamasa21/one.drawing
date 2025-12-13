// =====================================================
// sub.js  UI / 表示 / コピー / ツイート
// =====================================================

const TWEET_HASHTAG = "#イナイレ版ワンドロ勝負";
let currentTweetBtnId = null;

// -----------------------------
// 初期イベント設定
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  drawBtn.addEventListener("click", drawTopicUI);
  resetBtn.addEventListener("click", resetHistoryUI);

  copyBtn.addEventListener("click", copyTopic);
  tweetBtn.addEventListener("click", tweetTopic);

  birthdayCopyBtn.addEventListener("click", copyTodayBirthday);
  birthdayTweetBtn.addEventListener("click", tweetTodayBirthday);

  monthBirthdayCopyBtn.addEventListener("click", copyMonthBirthday);
  monthBirthdayTweetBtn.addEventListener("click", tweetMonthBirthday);

  loadAllJSONs().then(() => {
    showBirthday();
    showMonthBirthday();
    updateHistory();
    updateAllButtons();
  });
});

// =====================================================
// ツイート共通処理
// =====================================================
function buildTweetText(baseText) {
  if (!baseText.trim()) return "";
  if (baseText.includes(TWEET_HASHTAG)) return baseText;
  return `${baseText}\n${TWEET_HASHTAG}`;
}

function updateTweetCounter(baseText) {
  const counter = document.getElementById("tweetCounter");
  const tweetText = buildTweetText(baseText);
  const len = tweetText.length;

  counter.textContent = `${len} / 280`;
  counter.classList.toggle("over", len > 280);

  return len;
}

function startTweet(text) {
  const tweetText = buildTweetText(text);
  const len = updateTweetCounter(text);
  if (!tweetText || len > 280) return;

  sessionStorage.setItem("tweetPendingBtn", currentTweetBtnId);

  window.location.href =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(tweetText);
}

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    sessionStorage.getItem("tweetPendingBtn")
  ) {
    flashActionDone(sessionStorage.getItem("tweetPendingBtn"), "ツイート完了");
    sessionStorage.removeItem("tweetPendingBtn");
  }
});

// =====================================================
// 抽選UI
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

  topicArea.innerHTML = parts.join("<br>");

  updateTweetCounter(topicArea.innerText);
  updateAllButtons();
  updateHistory();
}

// =====================================================
// コピー
// =====================================================
async function copyTopic() {
  await navigator.clipboard.writeText(topicArea.innerText);
  flashActionDone("copyBtn", "コピー完了");
}

function copyTodayBirthday() {
  navigator.clipboard.writeText(birthdayArea.innerText);
  flashActionDone("birthdayCopyBtn", "コピー完了");
}

function copyMonthBirthday() {
  navigator.clipboard.writeText(monthBirthdayArea.innerText);
  flashActionDone("monthBirthdayCopyBtn", "コピー完了");
}

// =====================================================
// ツイート
// =====================================================
function tweetTopic() {
  currentTweetBtnId = "tweetBtn";
  startTweet(topicArea.innerText);
}

function tweetTodayBirthday() {
  currentTweetBtnId = "birthdayTweetBtn";
  startTweet(birthdayArea.innerText);
}

function tweetMonthBirthday() {
  currentTweetBtnId = "monthBirthdayTweetBtn";
  startTweet(monthBirthdayArea.innerText);
}

// =====================================================
// 共通UX
// =====================================================
function flashActionDone(btnId, text) {
  const btn = document.getElementById(btnId);
  const before = btn.textContent;

  btn.textContent = text;
  btn.classList.add("action-done");

  setTimeout(() => {
    btn.textContent = before;
    btn.classList.remove("action-done");
  }, 1200);
}

function updateAllButtons() {
  const topicLen = updateTweetCounter(topicArea.innerText);

  copyBtn.disabled = !topicArea.innerText.trim();
  tweetBtn.disabled = !topicArea.innerText.trim() || topicLen > 280;

  birthdayCopyBtn.disabled = !birthdayArea.innerText.trim();
  birthdayTweetBtn.disabled = !birthdayArea.innerText.trim();

  monthBirthdayCopyBtn.disabled = !monthBirthdayArea.innerText.trim();
  monthBirthdayTweetBtn.disabled = !monthBirthdayArea.innerText.trim();
}