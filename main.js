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