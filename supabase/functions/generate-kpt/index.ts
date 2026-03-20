import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rawInput } = await req.json()

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      },
      body: JSON.stringify({
       model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
          content: `너는 개발자의 하루를 KPT 회고로 정리해주는 전문가야. 말투는 자연스럽고 친근하게, 개발자 감성으로 써줘.

[오늘 한 일]
${rawInput}

위 내용을 KPT 회고로 정리해줘. 다음을 꼭 지켜줘:
1. 오타나 비문은 자연스럽게 교정해서 반영해
2. "클로드 코드", "Groq" 같은 고유명사는 원문 그대로 정확하게 써줘. 절대 임의로 바꾸지 마
3. Keep: 잘 된 것, 유지할 것. 왜 좋았는지 맥락 포함해서 구체적으로
4. Problem: 불편했던 것, 아쉬운 것. 기술적인 것뿐 아니라 감정, 상황도 포함 가능
5. Try: 다음에 할 구체적인 행동. "~하기" 형태로, 실행 가능하게
6. 각 항목은 간결하되 핵심을 담아줘
7. 너무 딱딱하거나 보고서 같은 말투 금지. 자연스러운 개발자 일기 느낌으로
8. 입력 내용이 많으면 항목도 많이, 적으면 적게
9. 절대로 하나의 배열 항목에 여러 내용을 몰아넣지 마. 아래 예시처럼 항목 하나에 내용 하나만 넣어줘

[좋은 예시]
{"keep":["클로드 코드로 직접 기획부터 개발까지 해보니 생각보다 훨씬 편하고 빠름","이력서 피드백 드디어 반영 완료 - 미루던 거 해치워서 개운함"],"problem":["달력 UI가 미국 시간 기준으로 나와서 날짜가 이상하게 표시됨","회고 프롬프트 결과물이 아직 맘에 안 듦 - 모델 탓인지 프롬프트 탓인지 모르겠음"],"try":["날짜/시간을 한국 시간(KST) 기준으로 수정하기","프롬프트 예시 추가해서 더 구체적인 결과 유도해보기"]}

[나쁜 예시 - 이렇게 하지 마]
{"keep":["클로드 코드로 프로젝트를 해봤는데 좋았고, 이력서도 수정했고, 달력도 바꿨음"],"problem":["시간이 미국 기준이고 프롬프트도 별로임"],"try":["시간 수정하고 프롬프트도 고치기"]}


반드시 아래 JSON 형식으로만 응답해. 다른 말, 마크다운 코드블록 금지.
{"keep":["..."],"problem":["..."],"try":["..."]}`
          }
        ]
      })
    })

    const groqData = await groqRes.json()

    if (!groqRes.ok) {
      throw new Error(`Groq API error: ${JSON.stringify(groqData)}`)
    }

    const text = groqData.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const kpt = JSON.parse(clean)

    return new Response(JSON.stringify(kpt), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})