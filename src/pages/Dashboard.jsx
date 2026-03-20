import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function Dashboard({ session }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name, invite_code)')
      .eq('user_id', session.user.id)

    if (!error) setTeams(data.map(d => d.teams))
    setLoading(false)
  }

 const createTeam = async () => {
  if (!teamName.trim()) return

  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { data: team, error } = await supabase
    .from('teams')
    .insert({ name: teamName, created_by: session.user.id, invite_code: inviteCode })
    .select()
    .single()

  if (error) return alert('팀 생성 실패: ' + error.message)

  await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: session.user.id,
    role: 'owner'
  })

  setTeamName('')
  setShowCreateModal(false)
  fetchTeams()
}

  const joinTeam = async () => {
    if (!inviteCode.trim()) return

    const { data: team, error } = await supabase
      .from('teams')
      .select()
      .eq('invite_code', inviteCode.trim())
      .single()

    if (error || !team) return alert('존재하지 않는 초대 코드야')

    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: session.user.id, role: 'member' })

    if (joinError) return alert('이미 참여한 팀이야')

    setInviteCode('')
    setShowJoinModal(false)
    fetchTeams()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">KPT 회고</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{session.user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">내 팀</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm hover:bg-gray-50"
            >
              팀 참여
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white rounded-xl px-4 py-2 text-sm hover:bg-gray-800"
            >
              팀 만들기
            </button>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">아직 팀이 없어요</p>
            <p className="text-sm">팀을 만들거나 초대 코드로 참여해보세요</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {teams.map(team => (
              <div
                key={team.id}
                onClick={() => navigate(`/team/${team.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{team.name}</h3>
                <p className="text-sm text-gray-400 mt-1">초대 코드: {team.invite_code}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 팀 만들기 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">팀 만들기</h3>
            <input
              type="text"
              placeholder="팀 이름"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm">취소</button>
              <button onClick={createTeam} className="flex-1 bg-black text-white rounded-xl py-3 text-sm">만들기</button>
            </div>
          </div>
        </div>
      )}

      {/* 팀 참여 모달 */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">팀 참여</h3>
            <input
              type="text"
              placeholder="초대 코드 입력"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowJoinModal(false)} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm">취소</button>
              <button onClick={joinTeam} className="flex-1 bg-black text-white rounded-xl py-3 text-sm">참여하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard