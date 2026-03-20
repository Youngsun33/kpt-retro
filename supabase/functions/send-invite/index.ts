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
    const { email, teamName, inviteCode, inviterName, appUrl } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'KPT 회고 <onboarding@resend.dev>',
        to: [email],
        subject: `${inviterName}님이 "${teamName}" 팀에 초대했어요!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">KPT 회고 팀 초대</h1>
            <p style="color: #666; margin-bottom: 32px;">매일 5분, 팀의 성장을 기록해요</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              <strong>${inviterName}</strong>님이 <strong>${teamName}</strong> 팀에 초대했어요!
            </p>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #666; font-size: 14px; margin-bottom: 8px;">초대 코드</p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 0;">${inviteCode}</p>
            </div>

            <a href="${appUrl}" style="display: block; background: #000; color: #fff; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
              지금 참여하기 →
            </a>

            <p style="color: #999; font-size: 13px;">
              위 버튼 클릭 후 구글 로그인 → 팀 참여 → 초대 코드 입력하면 돼요!
            </p>
          </div>
        `
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(`Resend error: ${JSON.stringify(data)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
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