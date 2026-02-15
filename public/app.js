const form = document.getElementById('searchForm');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderResults(items) {
  if (!items.length) {
    resultsEl.innerHTML = '<p>候補が見つかりませんでした。</p>';
    return;
  }

  resultsEl.innerHTML = items
    .map((item) => {
      const papers = item.papers
        .map(
          (paper) =>
            `<li><a href="${escapeHtml(paper.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(paper.title)}</a> (${paper.year})</li>`
        )
        .join('');

      const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');

      return `
        <article class="card">
          <h2>#${item.rank} <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h2>
          <p class="meta">関連度: ${item.relevanceScore} / 100 | 形式: ${escapeHtml(item.datasetFormat)}</p>
          <p>${escapeHtml(item.description)}</p>
          <h3>関連論文</h3>
          <ul>${papers}</ul>
          <h3>推薦理由</h3>
          <ul>${reasons}</ul>
        </article>
      `;
    })
    .join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resultsEl.innerHTML = '';

  const query = document.getElementById('query').value.trim();
  const topK = Number(document.getElementById('topK').value || 5);

  if (!query) {
    statusEl.textContent = '入力してください。';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = '検索中...';

  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API error');
    }

    statusEl.textContent = `${data.results.length}件の候補を表示しています。`;
    renderResults(data.results);
  } catch (error) {
    statusEl.textContent = `エラー: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
