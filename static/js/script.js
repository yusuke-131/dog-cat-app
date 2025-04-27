
// 画像判定アプリ
document.getElementById('image-form').addEventListener('submit', async function (event) {
  event.preventDefault();
  clearImageResult();

  const fileInput = document.getElementById('image-file');
  const file = fileInput.files[0]; 
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch('http://127.0.0.1:8000/classify/image', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  document.getElementById('image-display').src = data.image_path;

  const topIndex = data.scores.indexOf(Math.max(...data.scores));
  const resultLabel = data.labels[topIndex];
  const confidence = data.scores[topIndex];

  document.getElementById('image-result').innerHTML = `分類結果は「<strong>${data.labels[topIndex]}</strong>」です`;

  drawChart(data.labels, data.scores);

  // 履歴保存処理を追加！
  saveResultToServer(file.name, resultLabel, confidence);
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
document.getElementById("image-file").addEventListener("change", () => {
  clearImageResult();
  const file = document.getElementById("image-file").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => document.getElementById("image-display").src = e.target.result;
    reader.readAsDataURL(file);
  }
});

// サンプル画像選択用
function useSampleImage(fileName) {
  clearImageResult();
  const imagePath = `/static/samples/${fileName}`;
  fetch(imagePath)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], fileName, { type: blob.type });
      const input = document.getElementById('image-file');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      document.getElementById("image-display").src = imagePath;
    });
}

// 分類結果をサーバーに保存
function saveResultToServer(imageName, result, confidence) {
  fetch("/save_history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_name: imageName,
      result: result,
      confidence: confidence
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("履歴保存完了:", data);
    renderHistory(data); 
  })
  .catch(err => console.error("履歴保存エラー:", err));
}

// 履歴をHTMLに表示する
function renderHistory(historyData) {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";  

  historyData.slice().reverse().forEach(entry => {
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

window.addEventListener("DOMContentLoaded", () => {
  fetch("/get_history")
    .then(res => res.json())
    .then(data => {
      renderHistory(data);
    })
    .catch(err => console.error("履歴取得エラー:", err));
});

function clearHistory() {
  fetch("/clear_history", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      console.log(data.message);
      renderHistory([]);  
    })
    .catch(err => console.error("履歴削除エラー:", err));
}