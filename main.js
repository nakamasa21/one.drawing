let topics = [];
let usedTopics = JSON.parse(localStorage.getItem("usedTopics") || "[]");

async function loadJSON() {

  const res = await fetch("topics.json");
  const data = await res.json();
  topics = data.topics;
alert(topics.length);
  // 使用済みを除外
  topics = topics.filter(t => !usedTopics.some(u => u.title === t.title));

  updateHistory();
}

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

function updateHistory() {
  const ul = document.getElementById("history");
  ul.innerHTML = "";

  usedTopics.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.title}（${t.category}）`;
    ul.appendChild(li);
  });
}

loadJSON();
