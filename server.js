const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    results: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rank: { type: 'integer' },
          title: { type: 'string' },
          url: { type: 'string' },
          relevanceScore: { type: 'number' },
          datasetFormat: { type: 'string' },
          description: { type: 'string' },
          papers: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                year: { type: 'integer' }
              },
              required: ['title', 'url', 'year']
            }
          },
          reasons: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: [
          'rank',
          'title',
          'url',
          'relevanceScore',
          'datasetFormat',
          'description',
          'papers',
          'reasons'
        ]
      }
    }
  },
  required: ['results']
};

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/recommend', async (req, res) => {
  const { query, topK = 5 } = req.body || {};

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query (string) is required' });
  }

  if (!client) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not set. Please add it to environment variables.'
    });
  }

  try {
    const prompt = [
      'あなたは研究者向けのデータセット推薦アシスタントです。',
      'ユーザーの研究テーマや欲しいデータセット条件を読み取り、関連度順に候補を返してください。',
      '候補には必ず以下を含めること: データセットのタイトル、公式URL、データ形式、説明、利用論文。',
      '利用論文は最低1件、可能なら2〜3件を含めること。',
      'relevanceScoreは0〜100で、関連度の高い順にrankを1から振ること。',
      '不明な情報は推測せず、確認できる範囲の確度が高い情報を返してください。',
      `表示件数は最大${Math.min(Math.max(Number(topK) || 5, 1), 10)}件。`,
      '',
      `ユーザー要望:\n${query}`
    ].join('\n');

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      input: prompt,
      tools: [{ type: 'web_search_preview' }],
      text: {
        format: {
          type: 'json_schema',
          name: 'dataset_recommendations',
          schema: responseSchema,
          strict: true
        }
      }
    });

    const parsed = JSON.parse(response.output_text);

    const normalized = parsed.results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    res.json({ results: normalized });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to fetch recommendations from OpenAI.',
      detail: error?.message || 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
