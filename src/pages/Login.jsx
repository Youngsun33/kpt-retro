import { supabase } from '../lib/supabase'

function Login() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">KPT 회고</h1>
        <p className="text-gray-500 mb-8">매일 5분, 팀의 성장을 기록해요</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-4 py-3 hover:bg-gray-50 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="google" className="w-5 h-5" />
          <span className="text-gray-700 font-medium">Google로 시작하기</span>
        </button>
      </div>
    </div>
  )
}

export default Login