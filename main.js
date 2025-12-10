let topics = [];
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

// -----------------------------------------------------
// 初期処理：DOM 読み込み完了後に実行
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {

  // ボタンイベント登録
  document.getElementById("drawBtn").addEventListener("click", drawTopic);
  document.getElementById("resetBtn").addEventListener("click", resetHistory);

  // ★ コピー機能
  document.getElementById("copyBtn").addEventListener("click", copyTopic);

  // JSON 読み込み
  loadJSON();
});

// -----------------------------------------------------
// JSON 読み込み
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

  // ▼ HTMLテキストエリア要素なら innerHTML を使う
  document.getElementById("topicArea").innerHTML =
    `本日のお題は<br>
    ・<span class="topic-bold">${topic.title}（${topic.category}）</span><br>
    です。<br><br>
    制限時間は60分（最大120分）、21時より開始いたします。<br>
    ルールをご確認の上ご参加ください。<br>
    <span class="hashtag">#イナイレ版ワンドロ勝負</span>
  `;

  // 使用済みに追加
  usedTopics.push(topic);
  localStorage.setItem("usedTopics", JSON.stringify(usedTopics));

  // topics から削除
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

  // topics.json から再読み込み
  loadJSON();

  // ▼ テキストエリア初期化
  // innerHTML を使っていたので統一
  document.getElementById("topicArea").innerHTML = "ここにお題が表示されます";
}

// -----------------------------------------------------
// ★ コピー処理
// -----------------------------------------------------
async function copyTopic() {

  // innerHTML の内容をコピーしたい → テキスト化してコピー
  const html = document.getElementById("topicArea").innerHTML;
  const text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");

  const btn = document.getElementById("copyBtn");

  if (!text || text === "ここにお題が表示されます") {
    alert("コピーするお題がありません！");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    const before = btn.textContent;
    btn.classList.add("copied");
    btn.textContent = "コピーしました ✓";

    // 1.5秒後に元に戻す
    setTimeout(() => {
      btn.textContent = before;
      btn.classList.remove("copied");
    }, 1500);

  } catch (e) {
    alert("コピーできませんでした");
  }
}

// calendar.json キャッシュ用
let birthdayList = [];

// -----------------------------------------------------
// calendar.json 読み込み
// -----------------------------------------------------
async function loadCalendar() {
  if (birthdayList.length > 0) return birthdayList; // 2回目以降は再読込しない

  try {
    const res = await fetch("calendar.json");
    const data = await res.json();
    birthdayList = data.characters;
    return birthdayList;
  } catch (e) {
    console.error("calendar.json 読み込みエラー：", e);
    return [];
  }
}

// -----------------------------------------------------
// ★ 初期表示：本日 & 今月の誕生日を自動表示
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  showBirthday();        // 本日
  showMonthBirthday();   // 今月
});


// -----------------------------------------------------
// 本日の誕生日を表示（ボタン不要・自動）
// -----------------------------------------------------
async function showBirthday() {
  const list = await loadCalendar();

  // 今日（MM/DD）
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}/${dd}`;

  const area = document.getElementById("birthdayArea");

  // 今日の誕生日のキャラ
  const todayBirth = list.filter(p => p.birthday === today);

  if (todayBirth.length === 0) {
    area.textContent = "本日誕生日のキャラクターはいません。";
    return;
  }

  // 出力
  let output = "";
  todayBirth.forEach(p => {
    output += `・${p.name}（${p.kana}）<br>`;
  });

  area.innerHTML = output;
}

// -----------------------------------------------------
// 今月の誕生日を自動表示
// -----------------------------------------------------
async function showMonthBirthday() {
  const list = await loadCalendar();

  // 今月（MM）
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const area = document.getElementById("monthBirthdayArea");

  // 今月一致
  const monthBirth = list.filter(p => p.birthday.startsWith(mm));

  if (monthBirth.length === 0) {
    area.textContent = "今月誕生日のキャラクターはいません。";
    return;
  }

  // 出力
  let output = "";
  monthBirth.forEach(p => {
    output += `・${p.name}（${p.kana}） …… ${p.birthday}<br>`;
  });

  area.innerHTML = output;
}
// ▼ お題コピー
document.getElementById("copyBtn").addEventListener("click", () => {
  const text = document.getElementById("topicArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("copyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
});


// ▼ 本日の誕生日コピー
document.getElementById("birthdayCopyBtn").addEventListener("click", () => {
  const text = document.getElementById("birthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("birthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
});


// ▼ 今月の誕生日コピー
document.getElementById("monthBirthdayCopyBtn").addEventListener("click", () => {
  const text = document.getElementById("monthBirthdayArea").innerText;
  navigator.clipboard.writeText(text);

  const btn = document.getElementById("monthBirthdayCopyBtn");
  btn.classList.add("copied");
  setTimeout(() => btn.classList.remove("copied"), 800);
});
