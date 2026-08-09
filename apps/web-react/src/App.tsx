// import MyPageView from '@my-page/myPagesView.tsx'
// import { useState } from 'react'
// import Avatar from '@components/Avatar'
// import Sidebar from '@components/Sidebar'
// import Toast from '@components/Toast'
// import ConfirmDialog from '@components/ConfirmDialog'
// import UserTable from '@features/admin/components/UserTable'
// import RoomTable from '@features/admin/components/RoomTable'
// import LogTable from '@features/admin/components/LogTable'
// import AddUserModal from '@features/admin/components/AddUserModal'
// import type { AdminUser, AdminRoom, AdminLog } from '@features/admin/types'

import { Routes, Route } from "react-router"
import LoginView from "./features/login/components/LoginView"
import MyPageView, { type MyPageViewProps } from '@my-page/myPagesView.tsx'

// const MOCK_USERS: AdminUser[] = [
//   { id: 1, username: 'user_01', name: '김지수', email: 'jisoo@company.com', role: 'user', joinDate: '2025-01-15', status: 'active' },
//   { id: 2, username: 'user_02', name: '박민준', email: 'minjun@company.com', role: 'user', joinDate: '2025-02-03', status: 'suspended' },
//   { id: 3, username: 'admin', name: '관리자', email: 'admin@company.com', role: 'admin', joinDate: '2024-12-01', status: 'active' },
// ]

// const MOCK_ROOMS: AdminRoom[] = [
//   { id: 1, name: '디자인 팀', owner: 'user_01', members: 3, createdAt: '2025-06-01' },
//   { id: 2, name: '개발팀 백엔드', owner: 'user_02', members: 7, createdAt: '2025-06-05' },
// ]

// const MOCK_LOGS: AdminLog[] = [
//   { id: 1, chat_room_id: 1, sender_user_id: 'user_01', content: '스프린트 리뷰 슬라이드 준비됐나요?', created_at: '2025-06-16 10:02' },
//   { id: 2, chat_room_id: 2, sender_user_id: 'user_02', content: 'API 문서 업데이트 완료했어요', created_at: '2025-06-16 14:20' },
// ]



function App() {
//   const [confirmOpen, setConfirmOpen] = useState(false)
//   const [addUserOpen, setAddUserOpen] = useState(false)

const myPageProps : MyPageViewProps = {
  username: 'user_01',
  displayName: '김지수',
  email: 'jisoo@company.com',
  role: 'user',
  joinDate: '2025-01-15',
  onLogout: () => console.log('로그아웃'),
}

  return (
    <div>
		<Routes>
			<Route path="/" element={<LoginView />} />
			<Route path="/my-page" element={<MyPageView  {...myPageProps} />} />
			{/* <Route path="/my-page" element={<MyPageView username="user_01" displayName="김지수" ... />} /> */}

		</Routes>
		{/* <LoginView /> */}
    </div>
  )
}

export default App
