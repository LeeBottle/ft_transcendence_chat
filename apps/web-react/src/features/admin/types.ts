// features/admin/types.ts
// mvp_v5_0706.html 프로토타입의 users/rooms/chatLogs 데이터 구조와 동일

export interface AdminUser {
  id: number
  username: string
  name: string
  email: string
  role: 'user' | 'admin'
  joinDate: string
  status: 'active' | 'suspended'
}

export interface NewAdminUserInput {
  username: string
  password: string
  name: string
  email: string
  role: AdminUser['role']
}

export interface AdminRoom {
  id: number
  name: string
  owner: string
  members: number
  createdAt: string
}

export interface AdminLog {
  id: number
  chat_room_id: number
  sender_user_id: string
  content: string
  created_at: string
}
