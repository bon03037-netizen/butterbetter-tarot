export default async function handler(req, res) {
  const { past, present, future } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
  }

  // 1. 전체 12종 카드 목록
  const allCards = [
    "The Sun", "The Moon", "The Star", "The Lovers", 
    "The Magician", "The World", "Temperance", "Strength", 
    "The Chariot", "Justice", "The Hermit", "Judgement"
  ];

  // 2. 고객이 뽑은 3장의 카드 이름만 추출 ("The Sun (역방향)" -> "The Sun")
  const cleanName = (name) => name.split(' (')[0];
  const drawnCards = [cleanName(past), cleanName(present), cleanName(future)];

  // 3. 12종 중 고객이 뽑은 3장을 제외한 '나머지 추천 가능 카드' 필터링
  const availableCards = allCards.filter(card => !drawnCards.includes(card));
  const availableCardsStr = availableCards.join(", ");

  // 4. 제미나이에게 전달할 새롭고 정교해진 프롬프트
  const prompt = `
당신은 감성 소품샵 '버터베러(Butter Better)'의 다정하고 통찰력 있는 타로 리더입니다. 
고객이 뽑은 3장의 카드는 다음과 같습니다. (이 3장은 고객이 이미 소장하게 될 매력과 기운을 의미합니다.)
- 과거: ${past}
- 현재: ${present}
- 미래: ${future}

[작성 가이드 및 필수 조건]
1. 전반적인 삶의 흐름 (1~2문단): 카드의 정방향/역방향을 고려하여 과거-현재-미래를 단절되지 않은 하나의 자연스러운 이야기로 연결하세요. 역방향이더라도 다정하고 따뜻한 위로와 성장의 기회로 순화하세요.
2. 분야별 테마 리딩: 전반적인 흐름을 짚어준 뒤, 아래 3가지 테마에 대한 짧고 감성적인 조언을 이모지와 함께 덧붙여주세요.
   - 💰 재물운: (금전 흐름이나 일/사업과 관련된 조언)
   - 💕 사랑운: (연애, 혹은 인간관계에 대한 조언)
   - 🍀 건강운: (신체적 건강이나 마음 챙김 힐링 조언)
3. ✨ 새로운 시너지 키링 추천 (가장 중요한 엄격한 규칙):
고객은 이미 뽑은 3장의 카드를 가지고 있습니다. 따라서 지금의 밸런스를 완벽하게 맞춰줄 '완전히 새로운 기운'을 추천해야 합니다.
반드시 아래 제공된 [추천 가능한 카드 후보] 중에서만 딱 1장을 골라 리딩의 맨 마지막에 작성하세요.
마지막 문단은 무조건 "✨ 지금 당신에게 새롭게 필요한 기운은 [카드명]입니다." 로 시작하세요.

[추천 가능한 카드 후보 (이 안에서만 1개 선택할 것!)]: ${availableCardsStr}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Gemini API 에러:", JSON.stringify(errorData));
      return res.status(response.status).json({ error: "Gemini API 오류" });
    }

    const data = await response.json();
    const story = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ story });
  } catch (error) {
    console.error("❌ 서버 에러:", error);
    res.status(500).json({ error: "서버 내부 오류" });
  }
}