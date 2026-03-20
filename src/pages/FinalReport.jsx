import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'

function FinalReport({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [report, setReport] = useState(null)
  const [retros, setRetros] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: projectData } = await supabase
      .from('projects')
      .select()
      .eq('id', id)
      .single()

    const { data: reportData } = await supabase
  .from('final_reports')
  .select()
  .eq('project_id', id)
  .maybeSingle()

    const { data: retroData } = await supabase
      .from('retrospectives')
      .select('*, users(id, name, email)')
      .eq('project_id', id)
      .order('retro_date', { ascending: true })

    setProject(projectData)
    setReport(reportData || null)
    setRetros(retroData || [])
    setLoading(false)
  }

const generateReport = async () => {
  if (retros.length === 0) return alert('회고가 없어서 리포트를 생성할 수 없어요')
  setGenerating(true)

  try {
    const { data: reportData, error } = await supabase.functions.invoke('generate-report', {
      body: { retros, projectName: project.name }
    })

    if (error) throw error

    const { data: saved } = await supabase
      .from('final_reports')
      .upsert({ project_id: id, report_data: reportData })
      .select()
      .single()

    setReport(saved)
  } catch (e) {
    alert('리포트 생성 실패: ' + e.message)
  }

  setGenerating(false)
}

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← 뒤로</button>
          <h1 className="text-xl font-bold">{project?.name} — 최종 리포트</h1>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="bg-black text-white rounded-xl px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-40"
        >
          {generating ? '분석 중...' : report ? '리포트 재생성' : '리포트 생성하기'}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {!report ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-2xl mb-3">📊</p>
            <p className="text-lg mb-2">아직 최종 리포트가 없어요</p>
            <p className="text-sm">위 버튼을 눌러 AI가 프로젝트 전체 회고를 분석해줄 거야</p>
            <p className="text-sm mt-1">총 {retros.length}개의 회고를 분석할 예정이야</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 요약 */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-3">📝 프로젝트 요약</h2>
              <p className="text-gray-700 leading-relaxed">{report.report_data?.summary}</p>
            </div>

            {/* 성장 포인트 */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">🌱 팀의 성장 포인트</h2>
              <ul className="space-y-3">
                {report.report_data?.growth?.map((g, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700">{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 이슈 타임라인 */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">🔥 주요 이슈 & 해결 흐름</h2>
              <div className="space-y-4">
                {report.report_data?.issues?.map((issue, i) => (
                  <div key={i} className="border-l-2 border-red-200 pl-4">
                    <p className="font-medium text-sm text-red-500 mb-1">{issue.date} — 이슈</p>
                    <p className="text-gray-700 text-sm mb-2">{issue.problem}</p>
                    {issue.solution && (
                      <p className="text-green-600 text-sm">→ {issue.solution}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 배운 것들 */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">💡 이 프로젝트에서 배운 것들</h2>
              <ul className="space-y-3">
                {report.report_data?.lessons?.map((l, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                    <span className="text-gray-700">{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 통계 */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">📈 프로젝트 통계</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-black">{retros.length}</p>
                  <p className="text-sm text-gray-400 mt-1">총 회고 횟수</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {retros.reduce((acc, r) => acc + (r.kpt_result?.keep?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">총 Keep</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {retros.reduce((acc, r) => acc + (r.kpt_result?.try?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">총 Try</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400">
              생성일: {new Date(report.generated_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default FinalReport