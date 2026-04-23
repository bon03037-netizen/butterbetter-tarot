export default async function handler(req, res) {
  const { past, present, future } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  // 1. API 키가 아예 없을 때의 에러
  if (!API_KEY) {
    console.error("❌ 에러: GEMINI_API_KEY가 없습니다. .env.local 파일을 확인하세요.");
    return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
  }

  const prompt = `
당신은 감성 소품샵 '버터베러(Butter Better)'의 다정하고 통찰력 있는 타로 리더입니다. 
고객이 뽑은 3장의 카드(과거: ${past}, 현재: ${present}, 미래: ${future})를 바탕으로 운명의 흐름을 읽어주세요.

1. 유기적인 스토리텔링: 과거의 경험이 어떻게 현재의 상황을 만들었고, 이것이 미래로 어떻게 나아갈지 단절되지 않은 '하나의 자연스러운 이야기'로 연결하세요.
2. 공감과 위로: 누구나 자신의 이야기처럼 공감할 수 있도록 따뜻한 위로의 말을 건네주세요. 
3. 가독성 최적화: 스마트폰 화면에서 읽기 편하도록 3~4개의 짧은 문단으로 구성하세요.
4. 조언 중심의 미래: 막연한 예언보다는 앞으로 어떤 마음가짐을 가지면 좋을지에 대한 '다정한 조언'에 집중하세요.
5. 럭키 키링(부적) 추천: 리딩의 마지막 문단은 반드시 "✨ 지금 당신에게 가장 필요한 기운은 [카드명]입니다." 형태로 시작하여 아래 12종 중 1장을 추천하세요.
(The Sun, The Moon, The Star, The Lovers, The Magician, The World, Temperance, Strength, The Chariot, Justice, The Hermit, Judgement)
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    // 2. 제미나이가 거절했을 때의 상세 에러
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Gemini API 거절 상세 이유:", JSON.stringify(errorData, null, 2));
      return res.status(response.status).json({ error: "Gemini API 오류", details: errorData });
    }

    const data = await response.json();
    const story = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ story });
  } catch (error) {
    // 3. 인터넷 끊김 등 서버 자체 에러
    console.error("❌ 서버 내부 에러:", error);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
}