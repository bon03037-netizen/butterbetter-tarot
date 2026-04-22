export default async function handler(req, res) {
  // CORS headers (Vercel handles this, but explicit is fine)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { past, present, future } = req.body ?? {};

  if (!past || !present || !future) {
    return res.status(400).json({ error: '카드 이름 3개(past, present, future)를 모두 보내주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다.' });
  }

  const prompt = `
당신은 감성 소품샵 '버터베러(Butter Better)'의 다정하고 통찰력 있는 타로 리더입니다.
고객이 뽑은 3장의 카드(과거: ${past}, 현재: ${present}, 미래: ${future})를 바탕으로 운명의 흐름을 읽어주세요.

[작성 가이드 및 필수 조건]
1. 유기적인 스토리텔링: 과거의 경험이 어떻게 현재의 상황을 만들었고, 이것이 미래로 어떻게 나아갈지 단절되지 않은 '하나의 자연스러운 이야기'로 연결하세요.
2. 공감과 위로 (바넘 효과): 누구나 자신의 이야기처럼 공감하며 고개를 끄덕일 수 있도록 보편적이면서도 따뜻한 위로의 말을 건네주세요.
3. 가독성 최적화: 스마트폰 화면에서 읽기 편하도록 전체 분량은 3~4개의 짧은 문단으로 구성하고, 문장이 너무 길어지지 않게 호흡을 조절하세요.
4. 조언 중심의 미래: 미래에 대한 막연한 예언보다는, 앞으로 어떤 마음가짐을 가지면 좋을지에 대한 '다정한 조언과 방향성'에 집중하세요.
5. 럭키 키링(부적) 추천: 리딩의 마지막에는 반드시 아래 12종의 카드 중 고객의 현재 상황에 가장 큰 도움이 될 만한 카드 1장을 '추천 키링'으로 제안하세요. (뽑은 3장과 겹쳐도 되고 달라도 됩니다.)
   - 후보 카드: The Sun, The Moon, The Star, The Lovers, The Magician, The World, Temperance, Strength, The Chariot, Justice, The Hermit, Judgement
   - 출력 형식 예시: "✨ 지금 당신에게 가장 필요한 기운은 [The Sun]입니다. 이 카드를 부적처럼 지니고 다니며 매일 아침 밝은 에너지를 채워보세요."
말투는 '~해요', '~할 거예요' 같은 부드럽고 다정한 존댓말을 사용해 주세요.
`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return res.status(502).json({ error: 'Gemini API 호출 실패', detail: errText });
    }

    const geminiData = await geminiRes.json();
    const story =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!story) {
      return res.status(502).json({ error: 'Gemini API에서 빈 응답이 반환되었습니다.' });
    }

    return res.status(200).json({ story });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
