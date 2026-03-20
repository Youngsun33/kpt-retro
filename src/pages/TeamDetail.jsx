import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'

function TeamDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')

  useEffect(() => {
    fetchTeamData()
  }, [id])

  const fetchTeamData = async () => {
    const { data: teamData } = await supabase
      .from('teams')
      .select()
      .eq('id', id)
      .single()

    const { data: projectData } = await supabase
      .from('projects')
      .select()
      .eq('team_id', id)
      .order('created_at', { ascending: false })

    const { data: memberData } = await supabase
      .from('team_members')
      .select('role, users(id, name, email, avatar_url)')
      .eq('team_id', id)

    setTeam(teamData)
    setProjects(projectData || [])
    setMembers(memberData || [])
    setLoading(false)
  }

  const createProject = async () => {
    if (!projectName.trim()) return

    const { error } = await supabase
      .from('projects')
      .insert({
        team_id: id,
        name: projectName,
        description: projectDesc,
      })

    if (error) return alert('프로젝트 생성 실패: ' + error.message)

    setProjectName('')
    setProjectDesc('')
    setShowCreateModal(false)
    fetchTeamData()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">← 뒤로</button>
          <h1 className="text-xl font-bold">{team?.name}</h1>
        </div>
        <span className="text-sm text-gray-400">초대 코드: {team?.invite_code}</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* 멤버 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">팀원</h2>
          <div className="flex gap-3 flex-wrap">
            {members.map(m => (
              <div key={m.users.id} className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2">
                {m.users.avatar_url && <img src={m.users.avatar_url} className="w-6 h-6 rounded-full" />}
                <span className="text-sm">{m.users.name || m.users.email}</span>
                {m.role === 'owner' && <span className="text-xs text-gray-400">팀장</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 프로젝트 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">프로젝트</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white rounded-xl px-4 py-2 text-sm hover:bg-gray-800"
          >
            프로젝트 만들기
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">아직 프로젝트가 없어요</p>
            <p className="text-sm">프로젝트를 만들고 회고를 시작해보세요</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {project.description && <p className="text-sm text-gray-400 mt-1">{project.description}</p>}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {project.status === 'active' ? '진행 중' : '완료'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-3">{project.start_date} 시작</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 프로젝트 만들기 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">프로젝트 만들기</h3>
            <input
              type="text"
              placeholder="프로젝트 이름"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <textarea
              placeholder="프로젝트 설명 (선택)"
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm">취소</button>
              <button onClick={createProject} className="flex-1 bg-black text-white rounded-xl py-3 text-sm">만들기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamDetail