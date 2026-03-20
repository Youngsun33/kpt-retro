import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'

function ProjectDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [retros, setRetros] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRetros, setSelectedRetros] = useState([])

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    const { data: projectData } = await supabase
      .from('projects')
      .select()
      .eq('id', id)
      .single()

    const { data: memberData } = await supabase
      .from('team_members')
      .select('role, users(id, name, email, avatar_url)')
      .eq('team_id', projectData.team_id)

    const { data: retroData } = await supabase
      .from('retrospectives')
      .select('*, users(id, name, avatar_url)')
      .eq('project_id', id)
      .order('retro_date', { ascending: false })

    setProject(projectData)
    setMembers(memberData || [])
    setRetros(retroData || [])
    setLoading(false)
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getRetroStatusForDate = (dateStr) => {
    const dayRetros = retros.filter(r => r.retro_date === dateStr)
    if (dayRetros.length === 0) return 'none'
    if (dayRetros.length >= members.length) return 'full'
    return 'partial'
  }

  const handleDateClick = (dateStr) => {
    const dayRetros = retros.filter(r => r.retro_date === dateStr)
    if (dayRetros.length === 0) return
    setSelectedDate(dateStr)
    setSelectedRetros(dayRetros)
  }

  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).replace(/\. /g, '-').replace('.', '')
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const todayRetros = retros.filter(r => r.retro_date === today)
  const wroteToday = todayRetros.some(r => r.user_id === session.user.id)

  const thisWeekRetros = retros.filter(r => {
    const d = new Date(r.retro_date)
    const now = new Date()
    const weekAgo = new Date(now.setDate(now.getDate() - 7))
    return d >= weekAgo
  })

  const weekKeeps = thisWeekRetros.reduce((acc, r) => acc + (r.kpt_result?.keep?.length || 0), 0)
  const weekProblems = thisWeekRetros.reduce((acc, r) => acc + (r.kpt_result?.problem?.length || 0), 0)
  const weekTries = thisWeekRetros.reduce((acc, r) => acc + (r.kpt_result?.try?.length || 0), 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
       <div className="flex items-center gap-3">
  <button
    onClick={() => navigate('/history')}
    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-xl px-4 py-2"
  >
    히스토리
  </button>
  <button
  onClick={() => navigate(`/report/${id}`)}
  className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-xl px-4 py-2"
>
  최종 리포트
</button>
  {!wroteToday && project?.status === 'active' && (
    <button
      onClick={() => navigate(`/write/${id}`)}
      className="bg-black text-white rounded-xl px-4 py-2 text-sm hover:bg-gray-800"
    >
      오늘 회고 작성하기
    </button>
  )}
  {wroteToday && (
    <span className="text-sm text-green-600 font-medium">✅ 오늘 회고 완료!</span>
  )}
</div>
        
        {wroteToday && (
          <span className="text-sm text-green-600 font-medium">✅ 오늘 회고 완료!</span>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* 캘린더 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600">←</button>
              <button onClick={nextMonth} className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status = getRetroStatusForDate(dateStr)
              const isToday = dateStr === today

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition
                    ${isToday ? 'ring-2 ring-black' : ''}
                    ${status === 'full' ? 'bg-green-100 hover:bg-green-200' : ''}
                    ${status === 'partial' ? 'bg-yellow-100 hover:bg-yellow-200' : ''}
                    ${status === 'none' ? 'hover:bg-gray-50' : ''}
                  `}
                >
                  <span className={`font-medium ${isToday ? 'text-black' : 'text-gray-700'}`}>{day}</span>
                  {status === 'full' && <span className="text-xs text-green-600">●</span>}
                  {status === 'partial' && <span className="text-xs text-yellow-500">◐</span>}
                </div>
              )
            })}
          </div>

          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span>🟢 전원 작성</span>
            <span>🟡 일부 작성</span>
            <span>⚪ 미작성</span>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-gray-400 mb-3">오늘 작성 현황</p>
            {members.map(m => {
              const wrote = todayRetros.some(r => r.user_id === m.users.id)
              return (
                <div key={m.users.id} className="flex items-center gap-2 mb-2">
                  <span>{wrote ? '✅' : '❌'}</span>
                  <span className="text-sm">{m.users.name || m.users.email}</span>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-gray-400 mb-3">이번 주 KPT</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">Keep</span>
                <span>{weekKeeps}개</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-500 font-medium">Problem</span>
                <span>{weekProblems}개</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Try</span>
                <span>{weekTries}개</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-gray-400 mb-3">누적 통계</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 회고</span>
                <span className="font-medium">{retros.length}회</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">참여 인원</span>
                <span className="font-medium">{members.length}명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">시작일</span>
                <span className="font-medium">{project?.start_date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 날짜 클릭 시 회고 목록 */}
        {selectedDate && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{selectedDate} 회고</h3>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {selectedRetros.map(retro => (
              <div key={retro.id} className="border rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  {retro.users.avatar_url && <img src={retro.users.avatar_url} className="w-6 h-6 rounded-full" />}
                  <span className="font-medium text-sm">{retro.users.name || retro.users.email}</span>
                </div>
                {retro.kpt_result && (
                  <div className="space-y-2">
                    {retro.kpt_result.keep?.map((k, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-blue-600 font-medium w-14 shrink-0">Keep</span>
                        <span className="text-gray-700">{k}</span>
                      </div>
                    ))}
                    {retro.kpt_result.problem?.map((p, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-red-500 font-medium w-14 shrink-0">Problem</span>
                        <span className="text-gray-700">{p}</span>
                      </div>
                    ))}
                    {retro.kpt_result.try?.map((t, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-green-600 font-medium w-14 shrink-0">Try</span>
                        <span className="text-gray-700">{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 최근 회고 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">최근 회고</h3>
          {retros.length === 0 ? (
            <p className="text-center text-gray-400 py-8">아직 회고가 없어요</p>
          ) : (
            <div className="space-y-3">
              {retros.slice(0, 10).map(retro => (
                <div key={retro.id} className="flex items-center justify-between border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    {retro.users.avatar_url && <img src={retro.users.avatar_url} className="w-7 h-7 rounded-full" />}
                    <div>
                      <span className="text-sm font-medium">{retro.users.name || retro.users.email}</span>
                      <span className="text-xs text-gray-400 ml-2">{retro.retro_date}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="text-blue-600">K {retro.kpt_result?.keep?.length || 0}</span>
                    <span className="text-red-500">P {retro.kpt_result?.problem?.length || 0}</span>
                    <span className="text-green-600">T {retro.kpt_result?.try?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProjectDetail