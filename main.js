// =======================================
// 抽出上限回数（画面から設定可能）
// =======================================

// localStorage から上限回数を読み込む（無ければ3）
let MAX_COUNT = parseInt(localStorage.getItem("maxCount")) || 3;

// HTML の入力欄に反映
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("maxCountInput").value = MAX_COUNT;
});

document.getElementById("saveMaxCount").addEventListener("click", () => {
  const val = parseInt(document.getElementById("maxCountInput").value);

  if (val >= 1) {
    MAX_COUNT = val;
    localStorage.setItem("maxCount", MAX_COUNT);
    alert(`抽出上限を ${MAX_COUNT} 回に設定しました。`);
  } else {
    alert("1 以上の数字を入力してください。");
  }
});


// =======================================
// ここから元の機能
// =======================================

let topics = [];
let history = JSON.parse(localStorage.getItem("topicHistory") || "[]");

// ページ読み込み時に JSON を読み込む
fetch("topics.json")
  .then(res => res.json())
  .then(data => {
    topics = data.topics;
    updateHistoryUI();
  });

document.getElementById("drawBtn").addEventListener("click", drawTopic);
document.getElementById("resetBtn").addEventListener("click", resetHistory);

// ---------------------------------------
// お題を引く
// ---------------------------------------
function drawTopic() {

  // お題ごとの抽出回数を算出
  const countMap = {};
  history.forEach(entry => {
    countMap[entry.topic] = (countMap[entry.topic] || 0) + 1;
  });

  // 上限回数未満のお題だけ抽出対象にする
  const remaining = topics.filter(t => {
    return (countMap[t] || 0) < MAX_COUNT;
  });

  if (remaining.length === 0) {
    document.getElementById("result").textContent =
      "抽出上限に達しているため、利用可能なお題がありません。";
    return;
  }

  // ランダム抽出
  const random = remaining[Math.floor(Math.random() * remaining.length)];

  // 日付
  const timestamp = new Date().toLocaleString("ja-JP");

  // 履歴に追加
  history.push({
    topic: random,
    date: timestamp
  });

  localStorage.setItem("topicHistory", JSON.stringify(history));

  document.getElementById("result").textContent = `${random}（${timestamp}）`;

  updateHistoryUI();
}

// ---------------------------------------
// 履歴更新
// ---------------------------------------
function updateHistoryUI() {
  const ul = document.getElementById("history");
  ul.innerHTML = "";

  history.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.topic}（${entry.date}）`;
    ul.appendChild(li);
  });
}

// ---------------------------------------
// 履歴リセット
// ---------------------------------------
function resetHistory() {
  history = [];
  localStorage.removeItem("topicHistory");
  updateHistoryUI();
  document.getElementById("result").textContent = "ここにお題が表示されます";
}