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
고객이 뽑은 3장의 카드는 다음과 같습니다.
- 과거: ${past}
- 현재: ${present}
- 미래: ${future}

[작성 가이드 및 필수 조건]
1. 전문적인 방향 해석: 카드가 '정방향'인지 '역방향'인지 반드시 고려하여 해석하세요. 단, 역방향이더라도 절망적이거나 무서운 해석은 절대 피하고, "조금 쉬어갈 타이밍", "내면을 더 들여다볼 기회" 등 버터베러 특유의 따뜻하고 희망적인 조언으로 순화하세요.
2. 유기적인 스토리텔링: 과거-현재-미래를 단절시키지 말고 '하나의 자연스러운 이야기'로 연결하여 3~4문단으로 작성하세요.

3. 카드를 개별적으로 끊어서 해석하지 말고, 다음의 '타로 전문가 로직'에 따라 분석하세요.
1) 인과관계: [과거]의 에너지가 원인이 되어 어떻게 [현재]의 상황을 만들었는지 인과관계를 설명하세요.
2) 역방향의 재해석: 역방향 카드가 있다면 무서운 예언을 하지 마세요. 대신 에너지가 '내면으로 향하고 있거나', '잠시 지연되고 있는 상태'로 해석하여 성장을 위한 조언으로 순화하세요.
3) 대조와 전환 흐름 파악: 예를 들어 정적인 에너지의 카드(달, 은둔자)에서 동적인 에너지의 카드(전차, 태양)로 넘어간다면, '내면의 성찰 끝에 본격적인 행동으로 나아가는 시기'처럼 흐름의 변화를 꼭 짚어주세요.

4. 🍀 럭키 키링 추천 (엄격한 규칙):
리딩의 마지막 문단은 무조건 "✨ 지금 당신에게 가장 필요한 기운은 [카드명]입니다. 이 카드를 부적처럼..." 형식으로 시작하세요.

**주의: [카드명]에는 반드시 아래 12개의 정확한 영문 카드 이름 중 하나만 들어가야 합니다. 절대 리스트에 없는 카드를 지어내지 마세요.**
[허용된 카드 리스트 12종]: The Sun, The Moon, The Star, The Lovers, The Magician, The World, Temperance, Strength, The Chariot, Justice, The Hermit, Judgement
`;

  try {
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
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