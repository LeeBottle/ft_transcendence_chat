'use client';

import { use, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { io, type Socket } from 'socket.io-client';

import type { ChatMessageResponse } from '@repo/schemas/chat';

import {
  createMockJwtToken,
  DEFAULT_USER,
  getStoredActiveUser,
  getStoredMessages,
  getStoredRooms,
  saveStoredActiveUser,
  saveStoredMessages,
  saveStoredRooms,
  TEMP_USERS,
  type ChatMessage,
  type ChatRoom,
  type ChatRoomMember,
  type BannedMember,
  type MemberRole,
  type TempUser,
} from '../types';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function ChatRoomDetailPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<TempUser>(DEFAULT_USER);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inviteUserId, setInviteUserId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [apiLog, setApiLog] = useState<string>('');
  const [useRealApi, setUseRealApi] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(true);
  const [isLoadingPagination, setIsLoadingPagination] = useState<boolean>(false);
  const [lastFetchedCount, setLastFetchedCount] = useState<number | null>(null);

  const messageBoxRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTo({
        top: messageBoxRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  const logApi = (action: string, data: unknown) => {
    const timestamp = new Date().toLocaleTimeString();

    setApiLog((prev) => `[${timestamp}] ${action}\n${JSON.stringify(data, null, 2)}\n\n${prev}`);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryUser =
        searchParams.get('userId') || searchParams.get('loginId') || searchParams.get('user');

      if (queryUser) {
        const found = TEMP_USERS.find(
          (u) => u.id === queryUser || u.loginId === queryUser,
        );

        if (found) {
          setSelectedUser(found);
          saveStoredActiveUser(found);
        } else {
          setSelectedUser(getStoredActiveUser());
        }
      } else {
        setSelectedUser(getStoredActiveUser());
      }
    } else {
      setSelectedUser(getStoredActiveUser());
    }

    setRooms(getStoredRooms());
    setMessages(getStoredMessages());
  }, []);

  // 0. 채팅방 정보 백엔드 API 조회 및 폴백 보장
  useEffect(() => {
    if (!roomId) {
      return;
    }

    void (async () => {
      let roomObj: ChatRoom | null = null;

      try {
        const token = createMockJwtToken(selectedUser);
        const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const backendRoom = (await response.json()) as any;

          logApi('GET /api/chat/rooms/:roomId (방 상세 응답)', backendRoom);

          roomObj = {
            id: backendRoom.id,
            title: backendRoom.title,
            topic: backendRoom.topic ?? null,
            type: backendRoom.type,
            hostId: backendRoom.creatorUserId,
            creatorUserId: backendRoom.creatorUserId,
            members: Array.isArray(backendRoom.members)
              ? backendRoom.members.map((m: any) => {
                  const matchedUser = TEMP_USERS.find(
                    (u) =>
                      u.id === m.userId ||
                      u.loginId === m.loginId ||
                      u.loginId === m.user?.loginId,
                  );

                  return {
                    userId: m.userId,
                    loginId: m.loginId ?? m.user?.loginId ?? matchedUser?.loginId ?? m.userId,
                    name: m.name ?? m.user?.name ?? matchedUser?.name ?? `사용자 ${m.userId}`,
                    role:
                      m.role === 'FOUNDER' ||
                      m.role === 'OWNER' ||
                      m.role === 'HOST' ||
                      m.userId === backendRoom.creatorUserId
                        ? ('FOUNDER' as const)
                        : m.role === 'OPERATOR' || m.role === 'MANAGER'
                          ? ('OPERATOR' as const)
                          : ('USER' as const),
                  };
                })
              : [],
            createdAt: backendRoom.createdAt,
            closedAt: backendRoom.closedAt,
          };
        } else if (response.status === 403) {
          logApi('방 상세 조회 실패 (403 Forbidden - 차단됨)', { status: 403 });
          alert('차단(Ban)되거나 접근 권한이 없어 해당 채팅방에서 퇴장합니다.');
          router.push('/chat');
          return;
        }
      } catch (error) {
        logApi(
          '방 상세 정보 API 조회 실패 (로컬/폴백 모드)',
          error instanceof Error ? error.message : '알 수 없는 오류',
        );
      }

      setRooms((prev) => {
        const exists = prev.find((r) => r.id === roomId);

        if (roomObj) {
          const updated = prev.map((r) => {
            if (r.id === roomObj!.id) {
              const memberMap = new Map<string, ChatRoomMember>();

              for (const m of r.members || []) {
                memberMap.set(m.userId, m);

                if (m.loginId) {
                  memberMap.set(m.loginId, m);
                }
              }

              for (const m of roomObj!.members || []) {
                memberMap.set(m.userId, m);

                if (m.loginId) {
                  memberMap.set(m.loginId, m);
                }
              }

              return {
                ...roomObj!,
                members: Array.from(new Set(memberMap.values())),
              };
            }

            return r;
          });

          if (!prev.some((r) => r.id === roomObj!.id)) {
            updated.push(roomObj!);
          }

          saveStoredRooms(updated);

          return updated;
        }

        if (!exists) {
          const existingStored = getStoredRooms().find((r) => r.id === roomId);

          const fallbackRoom: ChatRoom = existingStored ?? {
            id: roomId,
            title: '채팅방',
            hostId: selectedUser.id,
            members: TEMP_USERS.map((u) => ({
              userId: u.id,
              loginId: u.loginId,
              name: u.name,
              role: u.id === selectedUser.id ? 'FOUNDER' : 'USER',
            })),
            createdAt: new Date().toISOString(),
          };

          const updated = [...prev, fallbackRoom];

          saveStoredRooms(updated);

          return updated;
        }

        return prev;
      });
    })();
  }, [roomId, selectedUser.id, apiUrl]);

  // 1. 이전 메시지 이력 DB/Redis 조회
  useEffect(() => {
    if (!roomId) {
      return;
    }

    void (async () => {
      try {
        const token = createMockJwtToken(selectedUser);
        const response = await fetch(`${apiUrl}/api/chat/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const historyMsgs = (await response.json()) as ChatMessageResponse[];

          logApi('GET /api/chat/rooms/:roomId/messages (이전 이력 응답)', historyMsgs);

          const formatted: ChatMessage[] = historyMsgs.map((msg) => ({
            id: msg.id,
            roomId: msg.chatRoomId,
            senderId: msg.senderUserId,
            senderName: msg.senderName ?? '알 수 없음',
            content: msg.content ?? '',
            createdAt: msg.sentAt,
          }));

          // 정렬 (과거순)
          formatted.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();

            for (const msg of formatted) {
              map.set(msg.id, msg);
            }

            for (const msg of prev) {
              if (!map.has(msg.id)) {
                map.set(msg.id, msg);
              }
            }

            const merged = Array.from(map.values());

            merged.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );

            saveStoredMessages(merged);

            // 방 진입 시 대화창 최하단으로 즉시 이동
            setTimeout(() => scrollToBottom(false), 100);

            return merged;
          });
        }
      } catch (error) {
        logApi(
          '이전 메시지 이력 조회 실패 (로컬 데이터 사용)',
          error instanceof Error ? error.message : '알 수 없는 오류',
        );
      }
    })();
  }, [roomId, selectedUser.id, apiUrl]);

  // 2. Socket.IO 실시간 연결 및 이벤트 핸들링
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const token = createMockJwtToken(selectedUser);
    const socket: Socket = io(`${apiUrl}/chat`, {
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
    });

    setSocketInstance(socket);

    const emitJoinRoom = () => {
      socket.emit('join_room', { roomId });
      logApi('join_room 이벤트 전송', { roomId, userId: selectedUser.id });
    };

    socket.on('connect', () => {
      setSocketConnected(true);
      logApi('소켓 실시간 연결 성공 (connect)', {
        socketId: socket.id,
        userId: selectedUser.id,
        loginId: selectedUser.loginId,
      });

      emitJoinRoom();
    });

    if (socket.connected) {
      setSocketConnected(true);
      emitJoinRoom();
    }

    socket.on('disconnect', (reason: string) => {
      setSocketConnected(false);
      logApi('소켓 연결 끊김 (disconnect)', { reason });
    });

    socket.on('exception', (error: any) => {
      const msg = typeof error === 'string' ? error : error?.message || '소켓 요청 처리 실패';
      logApi('소켓 예외 발생 (exception)', error);
      alert(`[소켓 권한/오류] ${msg}`);
    });

    socket.on('error', (error: any) => {
      const msg = typeof error === 'string' ? error : error?.message || '소켓 에러 발생';
      logApi('소켓 에러 발생 (error)', error);
    });

    socket.on('new_message', (msg: ChatMessageResponse) => {
      logApi('실시간 새 메시지 수신 (new_message)', msg);

      const targetRoomId = msg.chatRoomId || (msg as unknown as { roomId?: string }).roomId || roomId;
      const senderName =
        msg.senderName ??
        TEMP_USERS.find((u) => u.id === msg.senderUserId)?.name ??
        `사용자 ${msg.senderUserId}`;

      const incomingMsg: ChatMessage = {
        id: msg.id || `msg-${Date.now()}`,
        roomId: targetRoomId,
        senderId: msg.senderUserId,
        senderName,
        content: msg.content ?? '',
        createdAt: msg.sentAt || new Date().toISOString(),
      };

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === incomingMsg.id);

        if (exists) {
          return prev;
        }

        const filteredPrev = prev.filter(
          (m) =>
            !(
              m.id.startsWith('local-msg-') &&
              m.senderId === incomingMsg.senderId &&
              m.content === incomingMsg.content
            ),
        );

        const updated = [...filteredPrev, incomingMsg];

        saveStoredMessages(updated);

        if (incomingMsg.senderId === selectedUser.id) {
          setTimeout(() => scrollToBottom(true), 50);
        } else if (messageBoxRef.current) {
          const target = messageBoxRef.current;
          const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 80;

          if (isNearBottom) {
            setTimeout(() => scrollToBottom(true), 50);
          }
        }

        return updated;
      });
    });

    socket.on('user_joined', (data: unknown) => {
      logApi('실시간 유저 입장 알림 (user_joined)', data);
    });

    socket.on('user_left', (data: unknown) => {
      logApi('실시간 유저 퇴장 알림 (user_left)', data);
    });

    socket.on('user_kicked', (data: unknown) => {
      logApi('실시간 유저 강퇴 알림 (user_kicked)', data);

      const payload = data as { roomId?: string; targetUserId?: string };
      const targetId = payload?.targetUserId;

      const isTargetMe =
        Boolean(targetId) &&
        (targetId === selectedUser.id ||
          targetId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.id === targetId)?.loginId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.loginId === targetId)?.id === selectedUser.id);

      if (isTargetMe) {
        alert('채팅방에서 강퇴당하셨습니다.');
        router.push('/chat');
        return;
      }

      if (targetId) {
        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === (payload.roomId ?? roomId)) {
              return {
                ...r,
                members: r.members.filter((m) => m.userId !== targetId),
              };
            }
            return r;
          });

          saveStoredRooms(updated);
          return updated;
        });
      }
    });

    socket.on('user_banned', (data: unknown) => {
      logApi('실시간 유저 차단(Ban) 알림 (user_banned)', data);

      const payload = data as { roomId?: string; targetUserId?: string };
      const targetId = payload?.targetUserId;

      const isTargetMe =
        Boolean(targetId) &&
        (targetId === selectedUser.id ||
          targetId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.id === targetId)?.loginId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.loginId === targetId)?.id === selectedUser.id);

      if (isTargetMe) {
        alert('해당 채팅방에서 차단(Ban) 처리되어 채팅방 목록으로 이동합니다.');
        router.push('/chat');
        return;
      }

      if (targetId) {
        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === (payload.roomId ?? roomId)) {
              const bannedUser = TEMP_USERS.find((u) => u.id === targetId);
              const newBannedList = [
                ...(r.bannedMembers || []).filter((b) => b.userId !== targetId),
                {
                  userId: targetId,
                  loginId: bannedUser?.loginId ?? targetId,
                  name: bannedUser?.name ?? `사용자 ${targetId}`,
                  bannedAt: new Date().toISOString(),
                },
              ];

              return {
                ...r,
                members: r.members.filter((m) => m.userId !== targetId),
                bannedMembers: newBannedList,
              };
            }
            return r;
          });

          saveStoredRooms(updated);
          return updated;
        });
      }
    });

    socket.on('user_typing', (data: unknown) => {
      logApi('실시간 입력 중 상태 (user_typing)', data);
    });

    socket.on('read_receipt', (data: unknown) => {
      logApi('실시간 읽음 확인 알림 (read_receipt)', data);
    });

    socket.on('session_ended', (data: unknown) => {
      logApi('실시간 회의 세션 종료 알림 (session_ended)', data);

      const payload = data as { roomId?: string; timestamp?: string };
      const closedTime = payload.timestamp ?? new Date().toISOString();

      setRooms((prevRooms) => {
        const updated = prevRooms.map((r) => {
          if (r.id === (payload.roomId ?? roomId)) {
            return { ...r, closedAt: closedTime };
          }

          return r;
        });

        saveStoredRooms(updated);

        return updated;
      });

      // 회의 세션 종료시 소켓 알림 수신 후 자동으로 채팅방 나가기 (목록 페이지 이동)
      setTimeout(() => {
        router.push('/chat');
      }, 1000);
    });

    socket.on('room_updated', (data: unknown) => {
      logApi('실시간 방 업데이트 알림 (room_updated)', data);

      const payload = data as { roomId?: string; action?: string; targetUserId?: string; topic?: string; hasPassword?: boolean };

      const targetId = payload?.targetUserId;
      const isTargetMe =
        Boolean(targetId) &&
        (targetId === selectedUser.id ||
          targetId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.id === targetId)?.loginId === selectedUser.loginId ||
          TEMP_USERS.find((u) => u.loginId === targetId)?.id === selectedUser.id);

      if ((payload?.action === 'MEMBER_BANNED' || payload?.action === 'MEMBER_REMOVED') && isTargetMe) {
        alert('해당 채팅방에서 차단(Ban) 또는 강퇴 처리되어 채팅방 목록으로 이동합니다.');
        router.push('/chat');
        return;
      }

      if (payload?.action === 'PASSWORD_UPDATED' || payload?.hasPassword !== undefined) {
        const hasPwd = Boolean(payload?.hasPassword);
        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === (payload.roomId ?? roomId)) {
              return { ...r, hasPassword: hasPwd, isPrivate: hasPwd };
            }
            return r;
          });

          saveStoredRooms(updated);
          return updated;
        });
      }

      if (payload?.action === 'TOPIC_UPDATED' || payload?.topic !== undefined) {
        const newTopic = payload?.topic ?? '';

        setRooms((prevRooms) => {
          const updated = prevRooms.map((r) => {
            if (r.id === (payload.roomId ?? roomId)) {
              return { ...r, topic: newTopic };
            }
            return r;
          });

          saveStoredRooms(updated);
          return updated;
        });
      }
    });

    socket.on('room_deleted', (data: unknown) => {
      logApi('실시간 방 폭파/삭제 알림 (room_deleted)', data);

      const payload = data as { roomId?: string };
      const targetId = payload?.roomId ?? roomId;

      setRooms((prevRooms) => {
        const updated = prevRooms.filter((r) => r.id !== targetId);
        saveStoredRooms(updated);
        return updated;
      });

      // 자동으로 채팅방 목록 페이지로 이동
      setTimeout(() => {
        router.push('/chat');
      }, 1000);
    });

    return () => {
      socket.emit('leave_room', { roomId });
      socket.disconnect();
    };
  }, [roomId, selectedUser.id, selectedUser.loginId, apiUrl]);

  const handleUserChange = (user: TempUser) => {
    setSelectedUser(user);
    saveStoredActiveUser(user);
  };

  // 이전 대화 페이징 불러오기 (Cursor-based Pagination & Auto Infinite Scroll)
  const handleLoadOlderMessages = (scrollContainer?: HTMLDivElement | null) => {
    if (!roomId || isLoadingPagination) {
      return;
    }

    setIsLoadingPagination(true);
    const roomMsgs = messages.filter(
      (m) => m.roomId === roomId || (currentRoom && m.roomId === currentRoom.id),
    );
    const oldestMsg = roomMsgs[0];
    const cursorId = oldestMsg ? oldestMsg.id : '';
    const oldScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

    void (async () => {
      logApi(
        `GET /api/chat/rooms/${roomId}/messages?cursor=${cursorId}&limit=10&direction=BEFORE (페이징 요청)`,
        { cursor: cursorId, limit: 10, direction: 'BEFORE' },
      );

      try {
        const token = createMockJwtToken(selectedUser);
        const response = await fetch(
          `${apiUrl}/api/chat/rooms/${roomId}/messages?cursor=${cursorId}&limit=10&direction=BEFORE`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const olderMsgs = (await response.json()) as ChatMessageResponse[];

          logApi('GET 이전 대화 페이징 불러오기 응답', olderMsgs);

          if (Array.isArray(olderMsgs) && olderMsgs.length > 0) {
            setLastFetchedCount(olderMsgs.length);

            const formatted: ChatMessage[] = olderMsgs.map((msg) => ({
              id: msg.id,
              roomId: msg.chatRoomId,
              senderId: msg.senderUserId,
              senderName: msg.senderName ?? '알 수 없음',
              content: msg.content ?? '',
              createdAt: msg.sentAt,
            }));

            setMessages((prev) => {
              const map = new Map<string, ChatMessage>();

              for (const m of formatted) {
                map.set(m.id, m);
              }

              for (const m of prev) {
                map.set(m.id, m);
              }

              const merged = Array.from(map.values());

              merged.sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );

              saveStoredMessages(merged);

              return merged;
            });

            if (olderMsgs.length < 10) {
              setHasMoreOlder(false);
            }

            if (scrollContainer) {
              setTimeout(() => {
                const newScrollHeight = scrollContainer.scrollHeight;

                scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
              }, 50);
            }
          } else {
            setHasMoreOlder(false);
          }
        }
      } catch (error) {
        logApi(
          '이전 대화 불러오기 실패',
          error instanceof Error ? error.message : '알 수 없는 오류',
        );
      } finally {
        setIsLoadingPagination(false);
      }
    })();
  };

  // 상단 스크롤 도달 시 자동 페이징 핸들러 (Auto Infinite Scroll)
  const handleScrollContainer = (e: ChangeEvent<HTMLDivElement> | React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;

    if (target.scrollTop <= 20 && hasMoreOlder && !isLoadingPagination) {
      handleLoadOlderMessages(target);
    }
  };

  const currentRoom = rooms.find((r) => r.id === roomId);

  const isMember =
    currentRoom?.members.some(
      (m) =>
        m.userId === selectedUser.id ||
        m.loginId === selectedUser.loginId ||
        m.name === selectedUser.name,
    ) ?? false;

  const isFounder =
    Boolean(currentRoom?.hostId === selectedUser.id) ||
    Boolean(currentRoom?.creatorUserId === selectedUser.id) ||
    Boolean(
      currentRoom?.members.some(
        (m) =>
          (m.userId === selectedUser.id ||
            m.loginId === selectedUser.loginId ||
            m.name === selectedUser.name) &&
          (m.role === 'FOUNDER' || m.role === 'HOST' || (m as any).role === 'OWNER'),
      ),
    );

  const isOperator =
    isFounder ||
    Boolean(
      currentRoom?.members.some(
        (m) =>
          (m.userId === selectedUser.id ||
            m.loginId === selectedUser.loginId ||
            m.name === selectedUser.name) &&
          (m.role === 'OPERATOR' || (m as any).role === 'MANAGER'),
      ),
    );

  const isClosed = Boolean(currentRoom?.closedAt);

  const uninvitedUsers = currentRoom
    ? TEMP_USERS.filter((u) => !currentRoom.members.some((m) => m.userId === u.id))
    : [];

  // 사용자 초대 처리
  const handleInviteUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inviteUserId || !currentRoom) {
      return;
    }

    const userToInvite = TEMP_USERS.find((u) => u.id === inviteUserId);

    if (!userToInvite) {
      return;
    }

    void (async () => {
      const invitePayload = {
        roomId: currentRoom.id,
        userId: userToInvite.id,
        role: 'USER',
      };

      logApi(`POST /api/chat/rooms/${currentRoom.id}/members (요청)`, invitePayload);

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${currentRoom.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(invitePayload),
          });

          if (response.ok) {
            const resData: unknown = await response.json();

            logApi(`POST /api/chat/rooms/${currentRoom.id}/members (응답 성공)`, resData);
          }
        } catch (error) {
          logApi(
            `POST /api/chat/rooms/${currentRoom.id}/members (백엔드 미연결/임시 초대)`,
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      const newMember: ChatRoomMember = {
        userId: userToInvite.id,
        loginId: userToInvite.loginId,
        name: userToInvite.name,
        role: 'USER',
      };

      const updatedRooms = rooms.map((room) => {
        if (room.id === currentRoom.id) {
          const exists = room.members.some((m) => m.userId === newMember.userId);

          if (exists) {
            return room;
          }

          return { ...room, members: [...room.members, newMember] };
        }

        return room;
      });

      setRooms(updatedRooms);
      saveStoredRooms(updatedRooms);
      setInviteUserId('');
    })();
  };

  // 메시지 전송 처리 (소켓 또는 REST 택1 중복 전송 방지)
  const handleSendMessageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!messageInput.trim()) {
      return;
    }

    const content = messageInput.trim();
    const targetRoomId = currentRoom?.id || roomId;

    setMessageInput('');

    // Slash command /t 또는 /topic 처리
    if (content.startsWith('/t ') || content.startsWith('/topic ') || content === '/t' || content === '/topic') {
      const parts = content.split(' ');
      const newTopic = parts.slice(1).join(' ').trim();

      if (!newTopic) {
        alert('주제(Topic)를 입력해주세요. 예시: /t 오늘의 회의 안건');
        return;
      }

      handleUpdateTopic(newTopic);
      return;
    }

    const payload = {
      roomId: targetRoomId,
      content,
      type: 'TEXT',
    };

    // 화면 UI에 즉시 반영 (낙관적 메시지 추가하여 "메시지가 없습니다" 상태 방지)
    const localMsgId = `local-msg-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: localMsgId,
      roomId: targetRoomId,
      senderId: selectedUser.id,
      senderName: `${selectedUser.name} (${selectedUser.loginId})`,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, optimisticMsg];

      saveStoredMessages(updated);

      // 본인이 메시지 전송 시 즉시 대화창 최하단으로 부드럽게 이동
      setTimeout(() => scrollToBottom(true), 50);

      return updated;
    });

    // 1) 소켓 연결 상태인 경우 소켓 이벤트로 전송
    if (socketInstance) {
      logApi('send_message (실시간 소켓 전송)', payload);
      socketInstance.emit('send_message', payload);

      return;
    }

    // 2) 소켓 연결이 안 되어 있는 경우에만 HTTP REST API 호출
    void (async () => {
      logApi('POST /api/chat/rooms/:roomId/messages (REST 폴백 전송)', payload);

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${targetRoomId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ roomId: targetRoomId, content, type: 'TEXT' }),
          });

          if (response.ok) {
            const resData = (await response.json()) as ChatMessageResponse;

            logApi('REST 메시지 전송 성공 (응답)', resData);

            const newMessage: ChatMessage = {
              id: resData.id,
              roomId: resData.chatRoomId || targetRoomId,
              senderId: resData.senderUserId,
              senderName: `${selectedUser.name} (${selectedUser.loginId})`,
              content: resData.content ?? content,
              createdAt: resData.sentAt,
            };

            setMessages((prev) => {
              const filteredPrev = prev.filter((m) => m.id !== localMsgId);
              const updated = [...filteredPrev, newMessage];

              saveStoredMessages(updated);

              return updated;
            });

            return;
          }
        } catch (error) {
          logApi(
            '메시지 전송 백엔드 미연결 (폴백 모드)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }
    })();
  };

  // 비밀번호 변경/삭제 처리 (FOUNDER 전용)
  const handleUpdatePassword = (newPassword?: string | null) => {
    if (!currentRoom) {
      return;
    }

    if (!isFounder) {
      alert('방장(FOUNDER) 권한만 비밀번호를 수정하거나 삭제할 수 있습니다.');
      return;
    }

    void (async () => {
      const payload = { password: newPassword ?? null };

      logApi(`PATCH /api/chat/rooms/${currentRoom.id}/password (비밀번호 변경 요청)`, payload);

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${currentRoom.id}/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const resData = await response.json();
            logApi('비밀번호 변경/삭제 성공 (응답)', resData);
            alert(resData?.message ?? '비밀번호가 성공적으로 변경되었습니다.');
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            alert(errData?.message ?? '비밀번호 처리 실패');
            return;
          }
        } catch (error) {
          logApi(
            '비밀번호 변경 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const hasPwd = Boolean(newPassword && newPassword.trim().length > 0);
        const updated = prevRooms.map((r) => {
          if (r.id === currentRoom.id) {
            return { ...r, hasPassword: hasPwd, isPrivate: hasPwd };
          }
          return r;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 주제(Topic) 변경 처리 (방장/FOUNDER 및 운영자/OPERATOR만 가능)
  const handleUpdateTopic = (newTopic: string) => {
    if (!currentRoom) {
      return;
    }

    const myMember = currentRoom.members.find(
      (m) =>
        m.userId === selectedUser.id ||
        m.loginId === selectedUser.loginId ||
        m.name === selectedUser.name,
    );

    if (!isFounder && !isOperator) {
      alert('주제(Topic) 변경은 방장(FOUNDER) 및 운영자(OPERATOR)만 가능합니다.');
      logApi('주제 변경 실패 (권한 부족)', { userId: selectedUser.id, role: myMember?.role });
      return;
    }

    void (async () => {
      const payload = { topic: newTopic };

      logApi(`PATCH /api/chat/rooms/${currentRoom.id}/topic (주제 변경 요청)`, payload);

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${currentRoom.id}/topic`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const resData = await response.json();
            logApi('주제(Topic) 변경 성공 (응답)', resData);
          } else {
            logApi(`PATCH /api/chat/rooms/${currentRoom.id}/topic (응답 상태: ${response.status})`, {
              status: response.status,
            });
          }
        } catch (error) {
          logApi(
            '주제 변경 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((r) => {
          if (r.id === currentRoom.id) {
            return { ...r, topic: newTopic };
          }
          return r;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 멤버 강제 퇴장(KICK) 처리
  const handleKickMember = (targetUserId: string) => {
    if (!currentRoom) {
      return;
    }

    const targetMember = currentRoom.members.find((m) => m.userId === targetUserId);
    const targetName = targetMember?.name ?? targetUserId;

    if (!confirm(`${targetName} 님을 채팅방에서 강퇴하시겠습니까?`)) {
      return;
    }

    void (async () => {
      logApi(`DELETE /api/chat/rooms/${currentRoom.id}/members/${targetUserId} (강퇴 요청)`, {
        roomId: currentRoom.id,
        targetUserId,
      });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(
            `${apiUrl}/api/chat/rooms/${currentRoom.id}/members/${targetUserId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const resData = await response.json();
            logApi('DELETE 멤버 강퇴 성공 (응답)', resData);
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            logApi(`DELETE 멤버 강퇴 실패 (상태 코드: ${response.status})`, errData);

            if (errData?.message) {
              alert(errData.message);
              return;
            }
          }
        } catch (error) {
          logApi(
            '멤버 강퇴 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((room) => {
          if (room.id === currentRoom.id) {
            return {
              ...room,
              members: room.members.filter((m) => m.userId !== targetUserId),
            };
          }
          return room;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 멤버 차단(BAN) 처리
  const handleBanMember = (targetUserId: string) => {
    if (!currentRoom) {
      return;
    }

    const targetMember = currentRoom.members.find((m) => m.userId === targetUserId);
    const targetName = targetMember?.name ?? targetUserId;

    if (!confirm(`${targetName} 님을 채팅방에서 차단(Ban) 및 퇴장시키겠습니까?`)) {
      return;
    }

    void (async () => {
      logApi(`POST /api/chat/rooms/${currentRoom.id}/bans/${targetUserId} (차단 요청)`, {
        roomId: currentRoom.id,
        targetUserId,
      });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(
            `${apiUrl}/api/chat/rooms/${currentRoom.id}/bans/${targetUserId}`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const resData = await response.json();
            logApi('POST 멤버 차단(Ban) 성공 (응답)', resData);
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            logApi(`POST 멤버 차단 실패 (상태 코드: ${response.status})`, errData);

            if (errData?.message) {
              alert(errData.message);
              return;
            }
          }
        } catch (error) {
          logApi(
            '멤버 차단 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((room) => {
          if (room.id === currentRoom.id) {
            const bannedUser = TEMP_USERS.find((u) => u.id === targetUserId);
            const newBannedList = [
              ...(room.bannedMembers || []).filter((b) => b.userId !== targetUserId),
              {
                userId: targetUserId,
                loginId: targetMember?.loginId ?? bannedUser?.loginId ?? targetUserId,
                name: targetMember?.name ?? bannedUser?.name ?? `사용자 ${targetUserId}`,
                bannedAt: new Date().toISOString(),
              },
            ];

            return {
              ...room,
              members: room.members.filter((m) => m.userId !== targetUserId),
              bannedMembers: newBannedList,
            };
          }
          return room;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 멤버 차단 해제(UNBAN) 처리
  const handleUnbanMember = (targetUserId: string) => {
    if (!currentRoom) {
      return;
    }

    const bannedMember = currentRoom.bannedMembers?.find((b) => b.userId === targetUserId);
    const targetName = bannedMember?.name ?? targetUserId;

    if (!confirm(`${targetName} 님의 차단을 해제(Unban)하시겠습니까?`)) {
      return;
    }

    void (async () => {
      logApi(`DELETE /api/chat/rooms/${currentRoom.id}/bans/${targetUserId} (차단 해제 요청)`, {
        roomId: currentRoom.id,
        targetUserId,
      });

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(
            `${apiUrl}/api/chat/rooms/${currentRoom.id}/bans/${targetUserId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const resData = await response.json();
            logApi('DELETE 차단 해제(Unban) 성공 (응답)', resData);
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            logApi(`DELETE 차단 해제 실패 (상태 코드: ${response.status})`, errData);

            if (errData?.message) {
              alert(errData.message);
              return;
            }
          }
        } catch (error) {
          logApi(
            '차단 해제 백엔드 연동 실패 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((room) => {
          if (room.id === currentRoom.id) {
            return {
              ...room,
              bannedMembers: (room.bannedMembers || []).filter((b) => b.userId !== targetUserId),
            };
          }
          return room;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 멤버 권한 변경 처리 (FOUNDER / OPERATOR / USER)
  const handleUpdateMemberRole = (targetUserId: string, newRole: MemberRole) => {
    if (!currentRoom) {
      return;
    }

    void (async () => {
      const payload = { role: newRole };

      logApi(`PATCH /api/chat/rooms/${currentRoom.id}/members/${targetUserId}/role (요청)`, payload);

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(
            `${apiUrl}/api/chat/rooms/${currentRoom.id}/members/${targetUserId}/role`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload),
            },
          );

          if (response.ok) {
            const resData = await response.json();
            logApi('PATCH 멤버 권한 변경 성공 (응답)', resData);
          } else {
            const errData = (await response.json().catch(() => ({}))) as any;
            logApi(`PATCH 멤버 권한 변경 실패 (상태 코드: ${response.status})`, errData);

            if (errData?.message) {
              alert(errData.message);
            }
            if (response.status >= 400 && response.status < 500) {
              return;
            }
          }
        } catch (error) {
          logApi(
            '멤버 권한 변경 백엔드 미연결 (폴백 처리)',
            error instanceof Error ? error.message : '알 수 없는 오류',
          );
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((room) => {
          if (room.id === currentRoom.id) {
            const updatedMembers = room.members.map((m) => {
              if (
                newRole === 'FOUNDER' &&
                (m.role === 'FOUNDER' || m.role === 'HOST' || (m as any).role === 'OWNER')
              ) {
                return { ...m, role: 'OPERATOR' as const };
              }
              if (m.userId === targetUserId) {
                return { ...m, role: newRole };
              }
              return m;
            });

            return {
              ...room,
              hostId: newRole === 'FOUNDER' ? targetUserId : room.hostId,
              creatorUserId: newRole === 'FOUNDER' ? targetUserId : room.creatorUserId,
              members: updatedMembers,
            };
          }
          return room;
        });

        saveStoredRooms(updated);
        return updated;
      });
    })();
  };

  // 세션 종료 수동 테스트
  const handleEndSessionClick = () => {
    if (!currentRoom) {
      return;
    }

    void (async () => {
      logApi(`POST /api/chat/rooms/${currentRoom.id}/end-session (요청)`, {
        roomId: currentRoom.id,
      });

      const closedTime = new Date().toISOString();

      if (useRealApi) {
        try {
          const token = createMockJwtToken(selectedUser);
          const response = await fetch(`${apiUrl}/api/chat/rooms/${currentRoom.id}/end-session`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const resData: unknown = await response.json();

            logApi('세션 종료 및 Redis DB Flush 성공 (응답)', resData);
          } else {
            logApi('세션 종료 백엔드 응답 실패', `상태 코드: ${response.status}`);
          }
        } catch (error) {
          logApi('세션 종료 백엔드 호출 실패', error instanceof Error ? error.message : '알 수 없는 오류');
        }
      }

      setRooms((prevRooms) => {
        const updated = prevRooms.map((r) => {
          if (r.id === currentRoom.id) {
            return { ...r, closedAt: closedTime };
          }

          return r;
        });

        saveStoredRooms(updated);

        return updated;
      });

      // 세션 종료 수동 클릭 시에도 목록 페이지로 자동 나가기
      setTimeout(() => {
        router.push('/chat');
      }, 1000);
    })();
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
        color: '#000',
        background: '#fff',
      }}
    >
      <header
        style={{ borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '20px' }}
      >
        <div style={{ marginBottom: '8px' }}>
          <Link
            href="/chat"
            style={{ fontSize: '13px', color: '#000', textDecoration: 'underline' }}
          >
            채팅방 목록으로 이동
          </Link>
        </div>

        <h1 style={{ margin: '0 0 12px 0', fontSize: '22px' }}>
          {currentRoom ? currentRoom.title : `채팅방 [${roomId}]`}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #000',
            padding: '8px 12px',
          }}
        >
          <label
            htmlFor="user-select-detail"
            style={{ fontSize: '14px' }}
          >
            접속 계정 선택:
          </label>
          <select
            id="user-select-detail"
            value={selectedUser.loginId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const u = TEMP_USERS.find((user) => user.loginId === e.target.value);

              if (u) {
                handleUserChange(u);
              }
            }}
            style={{ padding: '4px 8px', fontSize: '14px', border: '1px solid #000' }}
          >
            {TEMP_USERS.map((user) => (
              <option
                key={user.id}
                value={user.loginId}
              >
                {user.name} ({user.loginId})
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#444', marginLeft: 'auto' }}>
            소켓 상태: {socketConnected ? '연결됨 (ON)' : '연결 해제 (OFF)'} |{' '}
            {isMember ? '방 참여자' : '비참여자'}
          </span>
        </div>
      </header>

      {currentRoom ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            {/* 방 정보 및 멤버 초대 영역 */}
            <section style={{ border: '1px solid #000', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                방 유형: {currentRoom.type} | FOUNDER:{' '}
                {TEMP_USERS.find((u) => u.id === currentRoom.hostId)?.name ?? currentRoom.hostId}
              </div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                참여 멤버: {currentRoom.members.map((m) => `${m.name}(${m.role})`).join(', ')}
              </div>

              {/* 사용자 초대 폼 */}
              <form
                onSubmit={handleInviteUserSubmit}
                style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}
              >
                <label
                  htmlFor="invite-user-select"
                  style={{ fontSize: '13px' }}
                >
                  사용자 초대:
                </label>
                <select
                  id="invite-user-select"
                  value={inviteUserId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setInviteUserId(e.target.value);
                  }}
                  style={{ padding: '4px 6px', fontSize: '13px', border: '1px solid #000' }}
                >
                  <option value="">초대할 계정 선택</option>
                  {uninvitedUsers.map((u) => (
                    <option
                      key={u.id}
                      value={u.id}
                    >
                      {u.name} ({u.loginId})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!inviteUserId}
                  style={{
                    padding: '4px 10px',
                    fontSize: '13px',
                    background: '#fff',
                    border: '1px solid #000',
                    cursor: inviteUserId ? 'pointer' : 'default',
                  }}
                >
                  초대
                </button>
              </form>

              {/* 세션 종료 테스트 버튼 (FOUNDER 전용) */}
              {isFounder ? (
                <button
                  type="button"
                  onClick={handleEndSessionClick}
                  disabled={isClosed}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    background: isClosed ? '#eee' : '#fff',
                    border: '1px solid #000',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isClosed ? '회의 세션 종료됨 (Read-only)' : '회의 세션 종료 (Redis DB Flush & AI 트리거)'}
                </button>
              ) : (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                  ※ 회의 세션 종료는 방장(FOUNDER) 계정만 수행할 수 있습니다.
                </div>
              )}
            </section>

            {/* 메시지 이력 영역 */}
            <section style={{ border: '1px solid #000', padding: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '15px' }}>실시간 메시지</h3>
                <span style={{ fontSize: '11px', color: '#444' }}>
                  총{' '}
                  {
                    messages.filter(
                      (m) => m.roomId === roomId || (currentRoom && m.roomId === currentRoom.id),
                    ).length
                  }
                  개 표시 중 (상단 스크롤 시 10개씩 자동 페이징)
                  {lastFetchedCount !== null && ` (+${lastFetchedCount}개 불러옴)`}
                </span>
              </div>

              {/* 채팅방 주제 (Topic) 영역: 실시간 메시지 총 N개 표시 중 바로 밑에 위치 */}
              <div
                style={{
                  padding: '8px 12px',
                  marginBottom: '10px',
                  background: '#f4f6f8',
                  border: '1px solid #000',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <strong>📌 Topic (주제):</strong>{' '}
                  <span>{currentRoom?.topic ? currentRoom.topic : '설정된 주제가 없습니다. (/t [토픽내용] 으로 설정)'}</span>
                </div>
                {(isFounder || isOperator) && (
                  <button
                    type="button"
                    onClick={() => {
                      const input = prompt('새로운 채팅방 주제(Topic)를 입력하세요:', currentRoom?.topic ?? '');
                      if (input !== null && input.trim() !== '') {
                        handleUpdateTopic(input.trim());
                      }
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      background: '#fff',
                      border: '1px solid #000',
                      cursor: 'pointer',
                    }}
                  >
                    주제 수정
                  </button>
                )}
              </div>

              {/* 메시지 스크롤 박스 (상단 스크롤 도달 시 자동 페이징 & 본인 메시지 전송 시 하단 이동) */}
              <div
                ref={messageBoxRef}
                onScroll={handleScrollContainer}
                style={{
                  height: '240px',
                  overflowY: 'auto',
                  border: '1px solid #000',
                  padding: '8px',
                  marginBottom: '12px',
                }}
              >
                {messages.filter((m) => m.roomId === roomId || (currentRoom && m.roomId === currentRoom.id)).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#666' }}>메시지가 없습니다.</div>
                ) : (
                  messages
                    .filter((m) => m.roomId === roomId || (currentRoom && m.roomId === currentRoom.id))
                    .map((msg) => (
                      <div
                        key={msg.id}
                        style={{ marginBottom: '8px', fontSize: '13px' }}
                      >
                        <strong>{msg.senderName}:</strong> {msg.content}
                        <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                )}
              </div>

              {/* 회의 세션 종료 시 읽기 전용 안내 */}
              {isClosed && (
                <div
                  style={{
                    marginBottom: '8px',
                    padding: '6px',
                    background: '#fff0f0',
                    border: '1px solid #f00',
                    fontSize: '12px',
                    color: '#c00',
                  }}
                >
                  ⚠️ 회의/채팅 세션이 종료된 방입니다. (신규 메시지 전송 제한 - Read Only)
                </div>
              )}

              {/* 메시지 입력 폼 */}
              <form
                onSubmit={handleSendMessageSubmit}
                style={{ display: 'flex', gap: '6px' }}
              >
                <input
                  type="text"
                  value={messageInput}
                  disabled={isClosed}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setMessageInput(e.target.value);
                  }}
                  placeholder={isClosed ? '종료된 회의방입니다.' : `${selectedUser.name} (으)로 메시지 입력...`}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #000',
                    background: isClosed ? '#eee' : '#fff',
                  }}
                />
                <button
                  type="submit"
                  disabled={isClosed}
                  style={{
                    padding: '4px 12px',
                    background: isClosed ? '#eee' : '#fff',
                    border: '1px solid #000',
                    cursor: isClosed ? 'not-allowed' : 'pointer',
                  }}
                >
                  전송
                </button>
              </form>
            </section>
          </div>

          {/* 우측 네비게이션바 (채팅방 설정 및 멤버 권한 부여) */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 설정 네비게이션바 섹션 */}
            <section style={{ border: '1px solid #000', padding: '12px', background: '#fafafa' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>
                ⚙️ 채팅방 설정 & 권한 네비게이션
              </h3>

              {/* 멤버 권한 부여 및 지정 섹션 */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#333' }}>
                  👥 참여 멤버 권한 부여 및 수정
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentRoom.members.map((member) => {
                    const isTargetFounder =
                      member.role === 'FOUNDER' ||
                      member.role === 'HOST' ||
                      member.role === 'OWNER' ||
                      member.userId === currentRoom.creatorUserId;

                    const isTargetOperator =
                      !isTargetFounder && (member.role === 'OPERATOR' || member.role === 'MANAGER');

                    const displayRoleLabel = isTargetFounder
                      ? 'FOUNDER (방장)'
                      : isTargetOperator
                        ? 'OPERATOR (운영자)'
                        : 'USER (일반)';

                    const isSelf = member.userId === selectedUser.id;

                    return (
                      <div
                        key={member.userId}
                        style={{
                          border: '1px solid #ccc',
                          padding: '8px',
                          background: '#fff',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {member.name} ({member.loginId}) {isSelf && '(나)'}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              border: '1px solid #000',
                              background: isTargetFounder ? '#ffeeee' : isTargetOperator ? '#eef6ff' : '#f0f0f0',
                            }}
                          >
                            {displayRoleLabel}
                          </span>
                        </div>

                        {/* 권한 관리 및 제재 2행 버튼 그룹 (FOUNDER 및 OPERATOR 관리) */}
                        {(isFounder || isOperator) && !isSelf && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                            {/* 1행: 권한 변경 (FOUNDER 위임, OPERATOR 지정, USER 변경) */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {isFounder && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateMemberRole(member.userId, 'FOUNDER')}
                                  style={{
                                    flex: 1,
                                    fontSize: '10px',
                                    padding: '2px 4px',
                                    background: '#fff',
                                    border: '1px solid #000',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  방장(FOUNDER) 위임
                                </button>
                              )}

                              {!isTargetFounder && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMemberRole(member.userId, 'OPERATOR')}
                                    disabled={isTargetOperator}
                                    style={{
                                      flex: 1,
                                      fontSize: '10px',
                                      padding: '2px 4px',
                                      background: isTargetOperator ? '#eee' : '#fff',
                                      border: '1px solid #000',
                                      cursor: isTargetOperator ? 'default' : 'pointer',
                                    }}
                                  >
                                    OPERATOR 지정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMemberRole(member.userId, 'USER')}
                                    disabled={!isTargetOperator}
                                    style={{
                                      flex: 1,
                                      fontSize: '10px',
                                      padding: '2px 4px',
                                      background: !isTargetOperator ? '#eee' : '#fff',
                                      border: '1px solid #000',
                                      cursor: !isTargetOperator ? 'default' : 'pointer',
                                    }}
                                  >
                                    USER 변경
                                  </button>
                                </>
                              )}
                            </div>

                            {/* 2행: 제재 액션 (KICK 강퇴, BAN 차단) */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleKickMember(member.userId)}
                                disabled={!isFounder && (isTargetFounder || isTargetOperator)}
                                style={{
                                  flex: 1,
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  background: !isFounder && (isTargetFounder || isTargetOperator) ? '#eee' : '#fff',
                                  border: '1px solid #c00',
                                  color: '#c00',
                                  fontWeight: 'bold',
                                  cursor: !isFounder && (isTargetFounder || isTargetOperator) ? 'default' : 'pointer',
                                }}
                              >
                                KICK (강퇴)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBanMember(member.userId)}
                                disabled={!isFounder && (isTargetFounder || isTargetOperator)}
                                style={{
                                  flex: 1,
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  background: !isFounder && (isTargetFounder || isTargetOperator) ? '#eee' : '#fff',
                                  border: '1px solid #000',
                                  color: '#000',
                                  fontWeight: 'bold',
                                  cursor: !isFounder && (isTargetFounder || isTargetOperator) ? 'default' : 'pointer',
                                }}
                              >
                                BAN (차단)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 차단된 멤버 목록 (Ban List) 및 Unban 버튼 */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#c00' }}>
                    🚫 차단된 멤버 목록 (Ban List: {(currentRoom.bannedMembers || []).length}명)
                  </h4>

                  {(currentRoom.bannedMembers || []).length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#888' }}>차단된 멤버가 없습니다.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(currentRoom.bannedMembers || []).map((banned) => (
                        <div
                          key={banned.userId}
                          style={{
                            border: '1px dashed #c00',
                            padding: '6px 8px',
                            background: '#fff8f8',
                            fontSize: '11px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#c00' }}>{banned.name}</strong> ({banned.loginId})
                          </div>
                          {(isFounder || isOperator) && (
                            <button
                              type="button"
                              onClick={() => handleUnbanMember(banned.userId)}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                background: '#fff',
                                border: '1px solid #c00',
                                color: '#c00',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                              }}
                            >
                              차단 해제 (Unban)
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 방 비밀번호 관리 섹션 (FOUNDER 전용) */}
                {isFounder && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#333' }}>
                      🔒 방 비밀번호 관리 (FOUNDER 전용)
                    </h4>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                      현재 상태: {(currentRoom.hasPassword || currentRoom.isPrivate) ? '🔒 비밀번호 설정됨 (비공개방)' : '🔓 공개방 (비밀번호 없음)'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const input = prompt('새로운 비밀번호를 입력하세요 (최대 12자리):');
                          if (input !== null) {
                            if (input.trim() === '') {
                              alert('비밀번호를 삭제하려면 [비밀번호 삭제] 버튼을 눌러주세요.');
                              return;
                            }
                            handleUpdatePassword(input.trim().slice(0, 12));
                          }
                        }}
                        style={{
                          flex: 1,
                          fontSize: '10px',
                          padding: '4px 6px',
                          background: '#fff',
                          border: '1px solid #000',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        비밀번호 변경
                      </button>
                      {(currentRoom.hasPassword || currentRoom.isPrivate) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('비밀번호를 삭제하고 공개방으로 전환하시겠습니까?')) {
                              handleUpdatePassword(null);
                            }
                          }}
                          style={{
                            flex: 1,
                            fontSize: '10px',
                            padding: '4px 6px',
                            background: '#fff',
                            border: '1px solid #c00',
                            color: '#c00',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          비밀번호 삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 실시간 통신 로그 */}
            <section style={{ border: '1px solid #000', padding: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '15px' }}>실시간 통신 로그</h3>
                <label style={{ fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={useRealApi}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setUseRealApi(e.target.checked);
                    }}
                  />
                  실제 백엔드 연동
                </label>
              </div>
              <textarea
                readOnly
                value={apiLog || '소켓 및 API 통신 로그가 여기에 출력됩니다.'}
                style={{
                  width: '100%',
                  height: '280px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: '8px',
                  boxSizing: 'border-box',
                  border: '1px solid #000',
                  background: '#f8f8f8',
                  color: '#000',
                }}
              />
            </section>
          </aside>
        </div>
      ) : (
        <div style={{ fontSize: '14px' }}>존재하지 않거나 삭제된 채팅방입니다.</div>
      )}
    </div>
  );
}
