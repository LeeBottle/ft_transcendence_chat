// Preview.tsx
// 팀원에게 화면을 보여주기 위한 임시 미리보기 스위처.
// 라우팅 없이 탭으로 화면을 전환함. main.tsx의 import를 App 대신 이걸로 바꿔서 띄우면 됨.

import { useState } from 'react'

import LoginView from '@features/login/components/LoginView'
import MyPageView from '@my-page/myPagesView.tsx'

import ChatHeader from '@features/chat/components/ChatHeader'
import MessageList from '@features/chat/components/MessageList'
import InputBar from '@features/chat/components/InputBar'
import TaskPanel from '@features/chat/components/TaskPanel'
import type { Message, Task } from '@features/chat/types'

import CalendarGrid from '@features/calendar/components/CalendarGrid'
import CalendarSidePanel from '@features/calendar/components/CalendarSidePanel'
import type { CalendarTask } from '@features/calendar/types'

import RoomList from '@features/room/components/RoomList'
import CreateRoomForm from '@features/room/components/CreateRoomForm'
import RoomModal from '@features/room/components/RoomModal'
import type { Room } from '@features/room/types'

import UserTable from '@features/admin/components/UserTable'
import RoomTable from '@features/admin/components/RoomTable'
import LogTable from '@features/admin/components/LogTable'
import type { AdminUser, AdminRoom, AdminLog } from '@features/admin/types'

const MESSAGES: Message[] = [
  { id: '1', dateLabel: '2025년 6월 16일', authorName: '김지수', content: '안녕하세요! 오늘 스프린트 리뷰 준비 됐나요?', time: '오전 10:02', isMe: false, avatarLabel: '김', avatarColorClass: 'bg-indigo-100 text-indigo-600' },
  { id: '2', authorName: '나 (방장)', content: '네! 슬라이드 거의 완성했어요 👍', time: '오전 10:05', isMe: true },
  { id: '3', authorName: '박민준', content: '내일까지 API 문서 업데이트 꼭 해야 해요!', time: '오전 10:10', isMe: false, avatarLabel: '박', avatarColorClass: 'bg-teal-100 text-teal-600' },
]

const TASKS: Task[] = [
  { id: 'e1', name: '피그마 최종본 팀 공유', start: '2025-06-15', end: '2025-06-16', done: true, isAi: false, existing: true },
  { id: 'ai1', name: '스프린트 리뷰 발표자료 최종 점검', start: null, end: null, done: false, isAi: true, checked: false },
  { id: 'ai2', name: '디자인 시안 내부 리뷰 요청', start: '2025-06-17', end: '2025-06-18', done: false, isAi: true, checked: true },
]

const SUMMARY = [
  { label: '📋 회의 주요 안건', items: ['스프린트 리뷰 준비 현황 공유', '피그마 최종본 공유 일정 확인'] },
  { label: '✅ 결정 사항', items: ['피그마 최종본 → 오늘(6/16) 오후 4시까지 팀 공유'] },
]

const CAL_TASKS: CalendarTask[] = [
  { id: 'ct1', title: '스프린트 리뷰 슬라이드', start: '2025-06-16', end: '2025-06-16', room: '디자인 팀', color: '#6C63FF' },
  { id: 'ct2', title: '피그마 최종본 공유', start: '2025-06-15', end: '2025-06-16', room: '디자인 팀', color: '#0F6E56' },
  { id: 'ct3', title: 'API 문서 업데이트', start: '2025-06-17', end: '2025-06-19', room: '개발팀', color: '#BA7517' },
]

const ROOMS: Room[] = [
  { id: '1', name: '디자인 팀', avatarLabel: '디', avatarColor: 'indigo', unreadCount: 3 },
  { id: '2', name: '박민준', avatarLabel: '박', avatarColor: 'teal' },
  { id: '3', name: '개발팀 백엔드', avatarLabel: '백', avatarColor: 'orange', unreadCount: 7 },
]

const MOCK_USERS: AdminUser[] = [
  { id: 1, username: 'user_01', name: '김지수', email: 'jisoo@company.com', role: 'user', joinDate: '2025-01-15', status: 'active' },
  { id: 2, username: 'user_02', name: '박민준', email: 'minjun@company.com', role: 'user', joinDate: '2025-02-03', status: 'suspended' },
  { id: 3, username: 'admin', name: '관리자', email: 'admin@company.com', role: 'admin', joinDate: '2024-12-01', status: 'active' },
]

const MOCK_ROOMS: AdminRoom[] = [
  { id: 1, name: '디자인 팀', owner: 'user_01', members: 3, createdAt: '2025-06-01' },
  { id: 2, name: '개발팀 백엔드', owner: 'user_02', members: 7, createdAt: '2025-06-05' },
]

const MOCK_LOGS: AdminLog[] = [
  { id: 1, chat_room_id: 1, sender_user_id: 'user_01', content: '스프린트 리뷰 슬라이드 준비됐나요?', created_at: '2025-06-16 10:02' },
  { id: 2, chat_room_id: 2, sender_user_id: 'user_02', content: 'API 문서 업데이트 완료했어요', created_at: '2025-06-16 14:20' },
]

const TABS = ['login', 'my-page', 'chat', 'calendar', 'room', 'admin'] as const
type Tab = (typeof TABS)[number]

function Preview() {
  const [tab, setTab] = useState<Tab>('chat')
  const [msgValue, setMsgValue] = useState('')
  const [taskTab, setTaskTab] = useState<'task' | 'summary'>('task')
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [adminTab, setAdminTab] = useState<'users' | 'rooms' | 'logs'>('users')

  return (
    <div className="h-screen flex flex-col">
      <div className="flex gap-2 p-2 border-b border-gray-200 shrink-0 bg-white z-10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-8 rounded-lg border text-sm cursor-pointer ${tab === t ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'login' && <LoginView />}

        {tab === 'my-page' && (
          <MyPageView
            username="user_01"
            displayName="김지수"
            email="jisoo@company.com"
            role="user"
            joinDate="2025-01-15"
            onLogout={() => console.log('로그아웃')}
            onSaveInfo={(data) => console.log('save info', data)}
            onChangePassword={(data) => console.log('change password', data)}
          />
        )}

        {tab === 'chat' && (
          <div className="h-full flex">
            <div className="w-56 border-r border-gray-200 p-3">
              <RoomList rooms={ROOMS} activeRoomId="1" onSelectRoom={() => {}} />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <ChatHeader
                avatarLabel="디"
                avatarColorClass="bg-indigo-100 text-indigo-600"
                roomName="디자인 팀"
                subtitle="김지수, 박민준, 이수아 · 3명"
                taskPanelOpen
                onToggleTaskPanel={() => {}}
                meetingEnded={false}
                onEndMeeting={() => {}}
              />
              <MessageList messages={MESSAGES} meetingEnded />
              <InputBar value={msgValue} onChange={setMsgValue} onSend={() => {}} />
            </div>
            <TaskPanel
              open
              activeTab={taskTab}
              onTabChange={setTaskTab}
              taskStatus="done"
              tasks={TASKS}
              onExtractTasks={() => {}}
              onToggleChecked={() => {}}
              onToggleDone={() => {}}
              onDateChange={() => {}}
              canSync={false}
              onSync={() => {}}
              summaryStatus="done"
              summarySections={SUMMARY}
              onExtractSummary={() => {}}
            />
          </div>
        )}

        {tab === 'calendar' && (
          <div className="h-full flex">
            <CalendarGrid
              year={2025}
              month={5}
              monthLabel="2025년 6월"
              tasks={CAL_TASKS}
              selectedDay={16}
              todayDay={16}
              onSelectDay={() => {}}
              onChangeMonth={() => {}}
            />
            <CalendarSidePanel
              selectedLabel="6월 16일"
              tasks={CAL_TASKS.filter((t) => t.start <= '2025-06-16' && t.end >= '2025-06-16')}
              editingTaskId={null}
              onStartEdit={() => {}}
              onCancelEdit={() => {}}
              onSave={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}

        {tab === 'room' && (
          <div className="h-full">
            <CreateRoomForm onCancel={() => {}} onSubmit={() => {}} />
            <button
              onClick={() => setRoomModalOpen(true)}
              className="fixed bottom-6 right-6 px-4 h-9 rounded-lg bg-gray-900 text-white text-sm cursor-pointer"
            >
              RoomModal 열기
            </button>
            <RoomModal
              open={roomModalOpen}
              mode="edit"
              initialValues={{ name: '디자인 팀', id: '1', owner: 'user_01' }}
              onSubmit={() => setRoomModalOpen(false)}
              onCancel={() => setRoomModalOpen(false)}
            />
          </div>
        )}

        {tab === 'admin' && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex gap-2">
              {(['users', 'rooms', 'logs'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAdminTab(v)}
                  className={`px-3 h-8 rounded-lg border text-xs cursor-pointer ${adminTab === v ? 'bg-gray-900 text-white' : 'border-gray-300'}`}
                >
                  {v}
                </button>
              ))}
            </div>

            {adminTab === 'users' && (
              <UserTable
                users={MOCK_USERS}
                onAddUser={(input) => console.log('add', input)}
                onSaveUser={(id, input) => console.log('save', id, input)}
                onSuspendUser={(id) => console.log('suspend', id)}
                onRestoreUser={(id) => console.log('restore', id)}
                onDeleteUser={(id) => console.log('delete', id)}
              />
            )}
            {adminTab === 'rooms' && (
              <RoomTable
                rooms={MOCK_ROOMS}
                onSaveRoom={(id, values) => console.log('save room', id, values)}
                onDeleteRoom={(id) => console.log('delete room', id)}
              />
            )}
            {adminTab === 'logs' && (
              <LogTable logs={MOCK_LOGS} rooms={MOCK_ROOMS.map((r) => ({ id: r.id, name: r.name }))} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Preview
