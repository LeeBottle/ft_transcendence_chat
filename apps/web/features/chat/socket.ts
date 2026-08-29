// 채팅 실시간 통로 — 앱 전체가 공유하는 싱글톤 Socket.IO 클라이언트.
//
// - 현재 오리진의 '/chat' 네임스페이스로 연결 (nginx 가 /socket.io/ 를 백엔드로 프록시)
// - 연결(및 재연결)할 때마다 최신 access token 을 handshake 로 실어 보낸다
//   → 서버 WsJwtGuard 가 첫 메시지에서 검증
// - io() 호출은 이 파일에서만 (전화기를 여러 대 두지 않는다)

import { io, type Socket } from 'socket.io-client';

type TokenProvider = () => string | null;

let socket: Socket | null = null;

function createSocket(getToken: TokenProvider): Socket {
  return io('/chat', {
    // auth 를 함수로 주면 연결/재연결 시점마다 다시 호출된다 → 항상 최신 토큰
    auth: (cb) => {
      cb({ token: getToken() ?? '' });
    },
    autoConnect: false,
    reconnection: true,
  });
}

/** 싱글톤 소켓을 연결하고 반환. 이미 연결돼 있으면 그대로 반환. */
export function connectChatSocket(getToken: TokenProvider): Socket {
  socket ??= createSocket(getToken);
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/** 현재 소켓 (없으면 null). */
export function getChatSocket(): Socket | null {
  return socket;
}

/** access token 이 갱신됐을 때 — 끊었다 다시 연결하면 새 토큰으로 핸드셰이크한다. */
export function reconnectChatSocket(): void {
  if (socket === null) {
    return;
  }
  socket.disconnect().connect();
}

/** 완전 종료 (로그아웃). 다음 연결 시 새 소켓을 만든다. */
export function disconnectChatSocket(): void {
  if (socket === null) {
    return;
  }
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
