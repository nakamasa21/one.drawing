let topics = [];
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

// -----------------------------------------------------
// 初期処理
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("drawBtn").addEventListener("click", drawTopic);
  document.getElementById("resetBtn").addEventListener("click", resetHistory);

  document.getElementById("copyBtn").addEventListener("click", copyTopic);
  document.getElementById("birthdayCopyBtn").addEventListener("click", copyTodayBirthday);
  document.getElementById("monthBirthdayCopyBtn").addEventListener("click", copyMonthBirthday);

  loadJSON();

  showBirthday();        
  showMonthBirthday();   
});

// -----------------------------------------------------
// topics.json 読み込み
// -----------------------------------------------------
async function loadJSON() {
  const res = await fetch("topics.json");
  const data = await res.json();
  topics = data.topics;

  topics = topics.filter(t => !usedTopics.some(u => u.title === t.title));
  updateHistory();
}

// -----------------------------------------------------
// お題抽選
// -----------------------------------------------------
function drawTopic() {

  if (topics.length === 0) {
    alert("もうお題がありません！");
    return;
  }

  const index = Math.floor(Math.random() * topics.length);
  const topic = topics[index];

  document.getElementById("topicArea").innerHTML =
    `本日のお題は<br>
    ・<span class="topic-bold">${topic.title}（${topic.category}）</span><br>
    です。<br><br>
    制限時間は60分（最大120分）、21時より開始いたします。<br>
    ルールをご確認の上ご参加ください。<br>
    <span class="hashtag">#イナイレ版ワンドロ勝負</span>`;

  usedTopics.push(topic);
  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));

  topics.splice(index, 1);

  updateHistory();
}

// -----------------------------------------------------
// 履歴更新
// -----------------------------------------------------
function updateHistory() {
  const ul = document.getElementById("history");
  ul.innerHTML = "";

  usedTopics.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.title}（${t.category}）`;
    ul.appendChild(li);
  });
}

// -----------------------------------------------------
// 履歴リセット
// -----------------------------------------------------
function resetHistory() {
  usedTopics = [];
  localStorage.removeItem("usedTopics");

  loadJSON();
  document.getElementById("topicArea").innerHTML = "ここにお題が表示されます";
}

// -----------------------------------------------------
// コピーボタン
// -----------------------------------------------------
async function copyTopic() {
  const html = document.getElementById("topicArea").innerHTML;
  const text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");

  const btn = document.getElementById("copyBtn");
  if (!text || text === "ここにお題が表示されます") return alert("コピーするお題がありません！");

  await navigator.clipboard.writeText(text);

  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}

// -----------------------------------------------------
// character.json キャッシュ
// -----------------------------------------------------
let birthdayMap = {};  // ← 月ごとのオブジェクト

// -----------------------------------------------------
// 誕生日 json 読み込み
// -----------------------------------------------------
async function loadCharacter() {
  if (Object.keys(birthdayMap).length > 0) return birthdayMap;

  try {
    const res = await fetch("character.json");
    const data = await res.json();

    // 構造： { birthday: { "01": [ ... ], "02": [ ... ] } }
    birthdayMap = data.birthday;

    return birthdayMap;

  } catch (e) {
    console.error("character.json 読み込みエラー：", e);
    return {};
  }
}

// -----------------------------------------------------
// 本日の誕生日
// -----------------------------------------------------
async function showBirthday() {
  const map = await loadCharacter();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");  // "01"
  const dd = String(now.getDate()).padStart(2, "0");       // "05"

  const area = document.getElementById("birthdayArea");

  const list = map[mm] || [];
  const todayBirth = list.filter(p => p.day === dd);

  if (todayBirth.length === 0) {
    area.textContent = "本日誕生日のキャラクターはいません。";
    return;
  }

  area.innerHTML = todayBirth
    .map(p => `・${p.name}（${p.kana}）<br>`)
    .join("");
}

// -----------------------------------------------------
// 今月の誕生日
// -----------------------------------------------------
async function showMonthBirthday() {
  const map = await loadCharacter();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const area = document.getElementById("monthBirthdayArea");

  const list = map[mm] || [];

  if (list.length === 0) {
    area.textContent = "今月誕生日のキャラクターはいません。";
    return;
  }

  area.innerHTML = list
    .map(p => `・${p.name}（${p.kana}） …… ${mm}/${p.day}<br>`)
    .join("");
}

// -----------------------------------------------------
// 今日の誕生日コピー
// -----------------------------------------------------
function copyTodayBirthday() {
  const text = document.getElementById("birthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("birthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}

// -----------------------------------------------------
// 今月の誕生日コピー
// -----------------------------------------------------
function copyMonthBirthday() {
  const text = document.getElementById("monthBirthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("monthBirthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}