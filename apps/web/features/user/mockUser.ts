// TODO(API): 세션/서버에서 로그인된 유저 정보를 받아와야 함 - 지금은 mock.
// Header와 마이페이지가 "같은 로그인 유저"를 보여줘야 해서 하나로 공유한다.
export const MOCK_USER = {
  username: 'user_01',
  displayName: '김지수',
  email: 'jisoo@company.com',
  role: 'user' as const,
  joinDate: '2025-01-15',
};
