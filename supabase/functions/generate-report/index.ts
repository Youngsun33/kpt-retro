import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  try {
    const { retros, projectName } = await req.json()

    const retroSummary = retros.map((r: any) => `
[${r.retro_date}] ${r.users?.name || r.users?.email}
- Keep: ${r.kpt_result?.keep?.join(', ')}
- Problem: ${r.kpt_result?.problem?.join(', ')}
- Try: ${r.kpt_result?.try?.join(', ')}
`).join('\n')

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
            content: `다음은 "${projectName}" 프로젝트 기간 동안의 팀 KPT 회고 기록이야:

${retroSummary}

위 회고 기록을 분석해서 프로젝트 최종 리포트를 작성해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 말, 마크다운 코드블록 금지.
{
  "summary": "프로젝트 전체를 2~3문장으로 요약. 어떤 프로젝트였고 팀이 어떻게 성장했는지",
  "growth": ["팀이 성장한 점 1", "팀이 성장한 점 2", "팀이 성장한 점 3"],
  "issues": [
    {"date": "날짜", "problem": "주요 이슈 설명", "solution": "어떻게 해결했는지"},
    {"date": "날짜", "problem": "주요 이슈 설명", "solution": "어떻게 해결했는지"}
  ],
  "lessons": ["이 프로젝트에서 배운 것 1", "배운 것 2", "배운 것 3"]
}`
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
    const report = JSON.parse(clean)

    return new Response(JSON.stringify(report), {
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