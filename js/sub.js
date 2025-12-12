// =====================================================
// sub.js  UI / 表示 / コピー
// =====================================================

// -----------------------------
// 初期イベント設定
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("drawBtn").addEventListener("click", drawTopicUI);
  document.getElementById("resetBtn").addEventListener("click", resetHistoryUI);

  document.getElementById("copyBtn").addEventListener("click", copyTopic);
  document.getElementById("birthdayCopyBtn").addEventListener("click", copyTodayBirthday);
  document.getElementById("monthBirthdayCopyBtn").addEventListener("click", copyMonthBirthday);

  loadAllJSONs().then(() => {
    showBirthday();
    showMonthBirthday();
    updateHistory();
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
  parts.push("#イナイレ版ワンドロ勝負");

  document.getElementById("topicArea").innerHTML = parts.join("<br>");

  // usedTopics 保存
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
    const idx = topics.findIndex(x => x.title === t.title);
    if (idx !== -1) topics.splice(idx, 1);
  });

  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));
  updateHistory();
}

// =====================================================
// 履歴表示
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

  loadAllJSONs().then(() => {
    document.getElementById("topicArea").innerHTML = "ここにお題が表示されます";
    updateHistory();
  });
}

// =====================================================
// 誕生日UI
// =====================================================
async function showBirthday() {
  await loadAllJSONs();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const area = document.getElementById("birthdayArea");
  const list = birthdayMap[mm]?.filter(p => p.day === dd) || [];

  area.innerHTML = list.length
    ? list.map(p => `・${p.name}（${p.kana}）<br>`).join("")
    : "本日誕生日のキャラクターはいません。";
}

async function showMonthBirthday() {
  await loadAllJSONs();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const area = document.getElementById("monthBirthdayArea");
  const list = birthdayMap[mm] || [];

  area.innerHTML = list.length
    ? list.map(p => `・${p.name}（${p.kana}） …… ${mm}/${p.day}<br>`).join("")
    : "今月誕生日のキャラクターはいません。";
}

// =====================================================
// コピー機能
// =====================================================
async function copyTopic() {
  const text = document.getElementById("topicArea").innerText;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  flashCopied("copyBtn");
}

function copyTodayBirthday() {
  navigator.clipboard.writeText(
    document.getElementById("birthdayArea").innerText
  );
  flashCopied("birthdayCopyBtn");
}

function copyMonthBirthday() {
  navigator.clipboard.writeText(
    document.getElementById("monthBirthdayArea").innerText
  );
  flashCopied("monthBirthdayCopyBtn");
}

function flashCopied(btnId) {
  const btn = document.getElementById(btnId);
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}