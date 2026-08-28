'use client';

// RoomTable.tsx
// renderRooms() 대체 — 방 추가는 없고 수정/삭제만 제공
// 수정 모달은 features/room 소유의 공용 RoomModal을 그대로 가져다 씀
import { useMemo, useState } from 'react';

import ConfirmDialog from '@/components/ConfirmDialog';
import RoomModal from '@/features/room/components/RoomModal';
import type { RoomFormValues } from '@/features/room/types';

import type { AdminRoom } from '../types';

interface RoomTableProps {
  rooms: AdminRoom[];
  onSaveRoom: (id: number, values: { name: string; owner: string }) => void;
  onDeleteRoom: (id: number) => void;
}

function RoomTable({ rooms, onSaveRoom, onDeleteRoom }: RoomTableProps) {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null);
  const [editTarget, setEditTarget] = useState<AdminRoom | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter((r) => !q || (r.name + r.id).toString().toLowerCase().includes(q));
  }, [rooms, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-gray-900">채팅방 관리</span>
        <span className="text-xs text-gray-400">총 {filtered.length}개</span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="채팅방 이름, ID 검색…"
        className="h-9 w-60 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-purple-400"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">채팅방 ID</th>
              <th className="px-5 py-3 font-medium">채팅방 이름</th>
              <th className="px-5 py-3 font-medium">생성자</th>
              <th className="px-5 py-3 font-medium">멤버 수</th>
              <th className="px-5 py-3 font-medium">생성일</th>
              <th className="px-5 py-3 text-center font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((room) => (
              <tr
                key={room.id}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-5 py-3 text-gray-400">{room.id}</td>
                <td className="px-5 py-3 text-gray-400">#{room.id}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{room.name}</td>
                <td className="px-5 py-3 text-gray-500">{room.owner}</td>
                <td className="px-5 py-3 text-gray-500">{room.members}명</td>
                <td className="px-5 py-3 text-xs text-gray-500">{room.createdAt}</td>
                <td className="px-5 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => setEditTarget(room)}
                    className="h-7 cursor-pointer rounded-md bg-purple-100 px-2.5 text-xs text-purple-600"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setDeleteTarget(room)}
                    className="ml-1 h-7 cursor-pointer rounded-md bg-red-100 px-2.5 text-xs text-red-600"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="채팅방 삭제"
        description={
          deleteTarget
            ? `'${deleteTarget.name}' 채팅방을 삭제할까요? 모든 메시지와 태스크가 삭제돼요.`
            : undefined
        }
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          if (deleteTarget) onDeleteRoom(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <RoomModal
        open={editTarget !== null}
        mode="edit"
        initialValues={
          editTarget
            ? ({
                name: editTarget.name,
                id: String(editTarget.id),
                owner: editTarget.owner,
              } satisfies RoomFormValues)
            : undefined
        }
        onSubmit={(values) => {
          if (editTarget) onSaveRoom(editTarget.id, { name: values.name, owner: values.owner });
          setEditTarget(null);
        }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}

export default RoomTable;
