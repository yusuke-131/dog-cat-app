document.getElementById("image-file").addEventListener("change", () => {
  clearImageResult();
  const file = document.getElementById("image-file").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => document.getElementById("image-display").src = e.target.result;
    reader.readAsDataURL(file);
  }
});

let chart = null;

function drawChart(labels, scores) {
  const ctx = document.getElementById('result-chart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '確信度 (%)',
        data: scores.map(x => Math.round(x * 100)),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function clearImageResult() {
  document.getElementById("image-result").innerHTML = "";
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

// 通常の画像選択時
document.getElementById("image-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  clearImageResult();

  const fileInput = document.getElementById('image-file');
  const file = fileInput.files[0];
  if (!file) {
    alert("ファイルを選択してください");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch('/classify/image', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error("分類に失敗しました"); // ← レスポンスチェック

    const data = await response.json();
    document.getElementById('image-display').src = data.image_path;

    const topIndex = data.scores.indexOf(Math.max(...data.scores));
    const resultLabel = data.labels[topIndex];
    const confidence = data.scores[topIndex];

    document.getElementById('image-result').innerHTML =
      `分類結果は「<strong>${resultLabel}</strong>」です`;

    drawChart(data.labels, data.scores);

    // awaitで待って、失敗したらエラー表示
    await saveResultToServer(file.name, resultLabel, confidence);

  } catch (err) {
    // 画面にエラーを表示
    document.getElementById('image-result').innerHTML =
      `<span style="color:red;">エラー: ${err.message}</span>`;
    console.error(err);
  }
});

// サンプル画像選択用
async function useSampleImage(fileName) {
  clearImageResult();
  const imagePath = `/static/samples/${fileName}`;
  try {
    const res = await fetch(imagePath);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: blob.type });
    const input = document.getElementById('image-file');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    document.getElementById("image-display").src = imagePath;
  } catch (err) {
    console.error("サンプル画像読み込みエラー:", err);
  }
}

// 分類結果をサーバーに保存
async function saveResultToServer(imageName, result, confidence) {
  try {
    const res = await fetch("/save_history", {
      method : "POST",
      headers : {"Content-Type" : "application/json"},
      body : JSON.stringify({ image_name : imageName, result, confidence})
    });
    const data = await res.json();
    console.log("履歴保存完了：", data);
    renderHistory(data);
  } catch (err) {
    console.error("履歴保存エラー：", err);
  }
}

// 履歴をHTMLに表示する
function renderHistory(historyData) {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";  

  historyData.forEach(entry => {
    const item = document.createElement("div");
    item.innerHTML = `
      <div style="padding: 6px 0; border-bottom: 1px solid #ccc;">
        <strong>${entry.time}</strong> - 
        <em>${entry.image_name}</em> → 
        <span style="color: #4a4;">${entry.result}</span> 
        (${(entry.confidence * 100).toFixed(1)}%)
      </div>`;
    historyDiv.appendChild(item);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/get_history");
    const data = await res.json();
    renderHistory(data);
  } catch (err) {
    console.error("履歴取得エラー:", err);
  }
});

async function clearHistory() {
  try {
    const res = await fetch("/clear_history", { method: "POST" });
    const data = await res.json();
    console.log(data.message);
    renderHistory([]);
  } catch (err) {
    console.error("履歴削除エラー:", err);
  }
}