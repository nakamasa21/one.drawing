// =====================================================
// sub.js  UI / 表示 / コピー / ツイート
// =====================================================

let TWEET_HASHTAG = "";
let lastDrawResult = null;


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
  
  // JSON 読み込み完了後に表示
  loadAllJSONs().then(() => {
    showBirthday();
    showMonthBirthday();
    updateHistory();
    updateAllButtonStates();
    updateTweetCounter("");
    TWEET_HASHTAG = tweetConfig.hashtag || "";
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
    alert("お題の抽出に失敗しました。")
    return;
  }

  document.getElementById("topicArea").innerHTML = topicAreaText;
  
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
  flashActionDone("copyBtn", "Copied");
}

function copyTodayBirthday() {
  const text = document.getElementById("birthdayArea").innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  flashActionDone("birthdayCopyBtn", "Copied");
}

function copyMonthBirthday() {
  const text = document.getElementById("monthBirthdayArea").innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  flashActionDone("monthBirthdayCopyBtn", "Copied");
}

function copyAnnounce() {
  const text = document.getElementById("announceArea").innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
  flashActionDone("announceCopyBtn", "Copied");
}

function tweetAnnounce() {
  startTweet(
    document.getElementById("announceArea").innerText,
    "announceTweetBtn"
  );
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
