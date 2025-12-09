let topics = [];
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

// -----------------------------------------------------
// 初期処理：DOM 読み込み完了後に実行
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {

  // ボタンイベント登録
  document.getElementById("drawBtn").addEventListener("click", drawTopic);
  document.getElementById("resetBtn").addEventListener("click", resetHistory);

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

  // 使用済みを除外
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

  // 表示
  document.getElementById("topic").textContent =
    `${topic.title}（${topic.category}）`;

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

  document.getElementById("topic").textContent = "ここにお題が表示されます";
}