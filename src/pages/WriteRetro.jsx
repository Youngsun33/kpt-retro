import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateKPT } from '../lib/claude'
import { useParams, useNavigate } from 'react-router-dom'

function WriteRetro({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rawInput, setRawInput] = useState('')
  const [kptResult, setKptResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setLoading(true)
    try {
      const result = await generateKPT(rawInput)
      setKptResult(result)
    } catch (e) {
      alert('AI 분석 실패: ' + e.message)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!kptResult) return
    setSaving(true)

    const { error } = await supabase.from('retrospectives').insert({
      project_id: id,
      user_id: session.user.id,
      raw_input: rawInput,
      kpt_result: kptResult,
      retro_date: new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\. /g, '-').replace('.', '')    })

    if (error) {
      alert('저장 실패: ' + error.message)
      setSaving(false)
      return
    }

    navigate(`/project/${id}`)
  }

  const updateKptItem = (type, index, value) => {
    setKptResult(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }))
  }

  const addKptItem = (type) => {
    setKptResult(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }))
  }

  const removeKptItem = (type, index) => {
    setKptResult(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← 뒤로</button>
        <h1 className="text-xl font-bold">오늘 회고 작성</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* 입력 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold mb-2">오늘 뭘 했어?</h2>
          <p className="text-sm text-gray-400 mb-4">자유롭게 써줘. AI가 KPT로 정리해줄게!</p>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder="오늘 한 일, 느낀 점, 문제점 등 자유롭게 작성해봐..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-black"
            rows={6}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !rawInput.trim()}
            className="mt-4 w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 disabled:opacity-40 transition"
          >
            {loading ? 'AI가 분석 중...' : 'AI로 KPT 정리하기'}
          </button>
        </div>

        {/* KPT 결과 */}
        {kptResult && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="font-semibold mb-4">KPT 결과 (수정 가능해!)</h2>

            {[
              { key: 'keep', label: 'Keep', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { key: 'problem', label: 'Problem', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
              { key: 'try', label: 'Try', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            ].map(({ key, label, color, bg, border }) => (
              <div key={key} className={`${bg} ${border} border rounded-xl p-4 mb-4`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`font-semibold ${color}`}>{label}</span>
                  <button
                    onClick={() => addKptItem(key)}
                    className={`text-xs ${color} hover:opacity-70`}
                  >
                    + 추가
                  </button>
                </div>
                {kptResult[key].map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={e => updateKptItem(key, i, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <button
                      onClick={() => removeKptItem(key, i)}
                      className="text-gray-300 hover:text-red-400 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-black text-white rounded-xl py-3 font-medium hover:bg-gray-800 disabled:opacity-40 transition"
            >
              {saving ? '저장 중...' : '회고 저장하기'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default WriteRetro