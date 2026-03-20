import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function History({ session }) {
  const navigate = useNavigate()
  const [retros, setRetros] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('team_id, users(id, name, email, avatar_url), teams(projects(id, name))')
      .eq('user_id', session.user.id)

    const allProjects = memberData?.flatMap(m => m.teams.projects) || []
    const projectIds = allProjects.map(p => p.id)

    const { data: retroData } = await supabase
      .from('retrospectives')
      .select('*, users(id, name, email, avatar_url), projects(id, name)')
      .in('project_id', projectIds)
      .order('retro_date', { ascending: false })

    const { data: allMembers } = await supabase
      .from('team_members')
      .select('users(id, name, email, avatar_url)')
      .in('team_id', memberData?.map(m => m.team_id) || [])

    const uniqueMembers = []
    const seen = new Set()
    allMembers?.forEach(m => {
      if (!seen.has(m.users.id)) {
        seen.add(m.users.id)
        uniqueMembers.push(m.users)
      }
    })

    setProjects(allProjects)
    setRetros(retroData || [])
    setMembers(uniqueMembers)
    setLoading(false)
  }

  const filtered = retros.filter(r => {
    if (selectedProject !== 'all' && r.project_id !== selectedProject) return false
    if (selectedUser !== 'all' && r.user_id !== selectedUser) return false
    return true
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← 뒤로</button>
        <h1 className="text-xl font-bold">히스토리</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* 필터 */}
        <div className="flex gap-3 mb-6">
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="all">전체 프로젝트</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="all">전체 팀원</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name || m.email}</option>
            ))}
          </select>

          <span className="ml-auto text-sm text-gray-400 flex items-center">총 {filtered.length}개</span>
        </div>

        {/* 회고 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">회고가 없어요</p>
            <p className="text-sm">필터를 바꿔보거나 회고를 작성해봐요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(retro => (
              <div key={retro.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* 헤더 */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === retro.id ? null : retro.id)}
                >
                  <div className="flex items-center gap-3">
                    {retro.users.avatar_url && (
                      <img src={retro.users.avatar_url} className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <span className="font-medium text-sm">{retro.users.name || retro.users.email}</span>
                      <span className="text-xs text-gray-400 ml-2">{retro.projects.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{retro.retro_date}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-blue-600">K {retro.kpt_result?.keep?.length || 0}</span>
                      <span className="text-red-500">P {retro.kpt_result?.problem?.length || 0}</span>
                      <span className="text-green-600">T {retro.kpt_result?.try?.length || 0}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{expanded === retro.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 펼쳐지는 KPT 내용 */}
                {expanded === retro.id && retro.kpt_result && (
                  <div className="px-6 pb-6 border-t">
                    <div className="mt-4 space-y-4">
                      {[
                        { key: 'keep', label: 'Keep', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { key: 'problem', label: 'Problem', color: 'text-red-500', bg: 'bg-red-50' },
                        { key: 'try', label: 'Try', color: 'text-green-600', bg: 'bg-green-50' },
                      ].map(({ key, label, color, bg }) => (
                        retro.kpt_result[key]?.length > 0 && (
                          <div key={key} className={`${bg} rounded-xl p-4`}>
                            <p className={`text-xs font-semibold ${color} mb-2`}>{label}</p>
                            <ul className="space-y-1">
                              {retro.kpt_result[key].map((item, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>

                    {/* 원본 입력 */}
                    <div className="mt-4 border-t pt-4">
                      <p className="text-xs text-gray-400 mb-2">원본 입력</p>
                      <p className="text-sm text-gray-500 whitespace-pre-wrap">{retro.raw_input}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default History