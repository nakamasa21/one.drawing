let topics = [];
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

// -----------------------------------------------------
// 初期処理：DOM 読み込み完了後に実行
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {

  // ボタンイベント登録
  document.getElementById("drawBtn").addEventListener("click", drawTopic);
  document.getElementById("resetBtn").addEventListener("click", resetHistory);

  // コピー機能
  document.getElementById("copyBtn").addEventListener("click", copyTopic);
  document.getElementById("birthdayCopyBtn").addEventListener("click", copyTodayBirthday);
  document.getElementById("monthBirthdayCopyBtn").addEventListener("click", copyMonthBirthday);

  // お題 JSON 読み込み
  loadJSON();

  // 誕生日表示
  showBirthday();        // 本日
  showMonthBirthday();   // 今月
});

// -----------------------------------------------------
// topics.json 読み込み
// -----------------------------------------------------
async function loadJSON() {
  const res = await fetch("topics.json");
  const data = await res.json();
  topics = data.topics;

  // 使用済みお題を除外
  topics = topics.filter(t => !usedTopics.some(u => u.title === t.title));

  updateHistory();
}

// -----------------------------------------------------
// お題を引く
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
    <span class="hashtag">#イナイレ版ワンドロ勝負</span>
  `;

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
// お題コピー
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
// calendar.json キャッシュ
// -----------------------------------------------------
let birthdayList = [];

// -----------------------------------------------------
// calendar.json 読み込み
// -----------------------------------------------------
async function loadCalendar() {
  if (birthdayList.length > 0) return birthdayList;

  try {
    const res = await fetch("calendar.json");
    const data = await res.json();

    // ▼ 修正：calendar.json のキーは birthday
    birthdayList = data.birthday;
    alert(birthdayList.length);

    return birthdayList;

  } catch (e) {
    console.error("calendar.json 読み込みエラー：", e);
    return [];
  }
}

// -----------------------------------------------------
// 本日の誕生日
// -----------------------------------------------------
async function showBirthday() {
  const list = await loadCalendar();
  
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}/${dd}`;

  const area = document.getElementById("birthdayArea");

  // ▼ 修正：p.date を参照
  const todayBirth = list.filter(p => p.date === today);

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
  const list = await loadCalendar();

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const area = document.getElementById("monthBirthdayArea");

  const monthBirth = list.filter(p => p.date.startsWith(mm));

  if (monthBirth.length === 0) {
    area.textContent = "今月誕生日のキャラクターはいません。";
    return;
  }

  area.innerHTML = monthBirth
    .map(p => `・${p.name}（${p.kana}） …… ${p.date}<br>`)
    .join("");
}

// -----------------------------------------------------
// 誕生日コピー（今日）
// -----------------------------------------------------
function copyTodayBirthday() {
  const text = document.getElementById("birthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("birthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}

// -----------------------------------------------------
// 誕生日コピー（今月）
// -----------------------------------------------------
function copyMonthBirthday() {
  const text = document.getElementById("monthBirthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("monthBirthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
}