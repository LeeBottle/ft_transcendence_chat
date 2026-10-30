'use client';

// /styleguide — 디자인 시스템 진열장.
// 색상 토큰 · 글자 크기 · 16개 컴포넌트를 한 페이지에서 확인/데모.
import { useState } from 'react';

import Avatar from '@/components/Avatar';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import Chip from '@/components/ui/Chip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Icon, { type IconName } from '@/components/ui/Icon';
import IconButton from '@/components/ui/IconButton';
import Menu, { MenuItem } from '@/components/ui/Menu';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import StatusDot from '@/components/ui/StatusDot';
import Tabs from '@/components/ui/Tabs';
import { Heading, Text } from '@/components/ui/Text';
import Textarea from '@/components/ui/Textarea';
import TextField from '@/components/ui/TextField';

const ICON_NAMES: IconName[] = [
  'calendar',
  'user',
  'users',
  'message',
  'shield',
  'bell',
  'search',
  'plus',
  'close',
  'check',
  'edit',
  'trash',
  'refresh',
  'logout',
  'more',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'info',
  'check-circle',
  'alert-triangle',
  'x-circle',
  'camera',
  'send',
  'stop',
  'inbox',
  'eye',
  'eye-off',
  'settings',
];

const COLOR_TOKENS = [
  'primary',
  'primary-hover',
  'primary-soft',
  'danger',
  'danger-soft',
  'success',
  'success-soft',
  'warning',
  'warning-soft',
  'info',
  'info-soft',
  'surface-muted',
  'border',
  'border-strong',
  'text',
  'text-muted',
  'text-subtle',
] as const;

type DemoTab = 'form' | 'feedback' | 'overlay';

const DEMO_TABS: ReadonlyArray<{ id: DemoTab; label: string }> = [
  { id: 'form', label: '폼' },
  { id: 'feedback', label: '피드백' },
  { id: 'overlay', label: '오버레이' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 text-text font-semibold">{title}</h2>
      <Card className="flex flex-col gap-4">{children}</Card>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function StyleguidePage() {
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState<DemoTab>('form');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chips, setChips] = useState(['김철수', '이영희', '박민수']);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text font-bold">디자인 시스템</h1>
        <p className="text-body text-text-muted">색상 토큰 · 글자 크기 · 재사용 컴포넌트 16개</p>
      </header>

      <Section title="색상 토큰">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COLOR_TOKENS.map((token) => (
            <div
              key={token}
              className="flex items-center gap-2"
            >
              <span
                className="border-border h-8 w-8 shrink-0 rounded-md border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <code className="text-caption text-text-muted">{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="글자 크기 / 타이포그래피">
        <Heading level={1}>Heading level 1 — text-h1</Heading>
        <Heading level={2}>Heading level 2 — text-h2</Heading>
        <Heading level={3}>Heading level 3 — text-h3</Heading>
        <Text>Text body — 기본 본문 (14px)</Text>
        <Text
          variant="caption"
          tone="muted"
        >
          Text caption + muted — 보조 설명 (12px)
        </Text>
        <Text
          variant="caption"
          tone="subtle"
        >
          Text caption + subtle — 더 흐린 텍스트
        </Text>
      </Section>

      <Section title="아이콘 (직접 만든 세트)">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {ICON_NAMES.map((name) => (
            <div
              key={name}
              className="border-border text-text-muted flex flex-col items-center gap-1 rounded-md border py-2"
            >
              <Icon
                name={name}
                size={20}
              />
              <code className="text-text-subtle text-[10px]">{name}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <Row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button
            loading
            variant="primary"
          >
            Loading
          </Button>
          <Button
            disabled
            variant="primary"
          >
            Disabled
          </Button>
          <Button
            variant="primary"
            leadingIcon={<span aria-hidden>＋</span>}
          >
            아이콘
          </Button>
        </Row>
        <Button fullWidth>Full width</Button>
      </Section>

      <Section title="IconButton">
        <Row>
          <IconButton label="닫기">✕</IconButton>
          <IconButton
            label="더보기"
            variant="outline"
          >
            ⋯
          </IconButton>
          <IconButton
            label="작게"
            size="sm"
          >
            ✎
          </IconButton>
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs
          tabs={DEMO_TABS}
          active={tab}
          onChange={setTab}
        />
        <p className="text-caption text-text-subtle">선택된 탭: {tab}</p>
      </Section>

      {tab === 'form' && (
        <Section title="폼 컴포넌트">
          <TextField
            label="아이디"
            placeholder="영문/숫자"
            hint="4~20자"
          />
          <TextField
            label="비밀번호"
            type="password"
            error="8자 이상이어야 해요"
          />
          <Textarea
            label="자기소개"
            placeholder="한 줄 소개"
          />
          <Select label="권한">
            <option>일반</option>
            <option>운영자</option>
            <option>방장</option>
          </Select>
          <Checkbox
            label="약관에 동의합니다"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
            }}
          />
        </Section>
      )}

      {tab === 'feedback' && (
        <Section title="피드백 컴포넌트">
          <Alert
            variant="info"
            title="안내"
          >
            이것은 정보 메시지예요.
          </Alert>
          <Alert variant="success">저장했어요.</Alert>
          <Alert variant="warning">비밀번호가 곧 만료돼요.</Alert>
          <Alert
            variant="danger"
            title="오류"
            onClose={() => undefined}
          >
            요청에 실패했어요.
          </Alert>
          <Row>
            <Spinner size="sm" />
            <Spinner
              size="md"
              label="불러오는 중…"
            />
            <Spinner size="lg" />
          </Row>
          <EmptyState
            icon="📭"
            title="아직 아무것도 없어요"
            description="첫 항목을 추가해 보세요."
            action={<Button size="sm">추가하기</Button>}
          />
        </Section>
      )}

      {tab === 'overlay' && (
        <Section title="오버레이 컴포넌트">
          <Row>
            <Button
              onClick={() => {
                setModalOpen(true);
              }}
            >
              Modal 열기
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(true);
              }}
            >
              ConfirmDialog 열기
            </Button>
            <Menu trigger={<Button variant="secondary">메뉴 ▾</Button>}>
              <MenuItem onSelect={() => undefined}>수정</MenuItem>
              <MenuItem onSelect={() => undefined}>복제</MenuItem>
              <MenuItem
                danger
                onSelect={() => undefined}
              >
                삭제
              </MenuItem>
            </Menu>
          </Row>
        </Section>
      )}

      <Section title="Badge">
        <Row>
          <Badge>중립</Badge>
          <Badge variant="primary">방장</Badge>
          <Badge variant="success">활성</Badge>
          <Badge variant="warning">대기</Badge>
          <Badge variant="danger">정지</Badge>
        </Row>
      </Section>

      <Section title="Chip">
        <Row>
          {chips.map((chip) => (
            <Chip
              key={chip}
              onRemove={() => {
                setChips((prev) => prev.filter((c) => c !== chip));
              }}
            >
              {chip}
            </Chip>
          ))}
          {chips.length === 0 && <span className="text-caption text-text-subtle">모두 제거됨</span>}
        </Row>
      </Section>

      <Section title="Avatar / StatusDot">
        <Row>
          <Avatar
            name="김철수"
            size="sm"
          />
          <Avatar
            name="이영희"
            size="md"
          />
          <Avatar
            name="박민수"
            size="lg"
            status="online"
          />
          <Avatar
            name="최지우"
            size="md"
            status="offline"
          />
        </Row>
        <Row>
          <span className="text-caption text-text-muted flex items-center gap-1.5">
            <StatusDot online /> 온라인
          </span>
          <span className="text-caption text-text-muted flex items-center gap-1.5">
            <StatusDot online={false} /> 오프라인
          </span>
        </Row>
      </Section>

      <Section title="Card">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card padding="sm">padding sm</Card>
          <Card padding="md">padding md</Card>
          <Card
            padding="none"
            className="overflow-hidden"
          >
            <div className="bg-primary-soft text-caption p-3">padding none</div>
          </Card>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        title="예시 모달"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setModalOpen(false);
              }}
            >
              확인
            </Button>
          </>
        }
      >
        <p className="text-body text-text-muted">
          ESC 키나 어두운 배경을 클릭해도 닫혀요. 열려 있는 동안 뒤 배경은 스크롤이 잠겨요.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="정말 삭제할까요?"
        description="이 작업은 되돌릴 수 없어요."
        confirmLabel="삭제"
        danger
        onConfirm={() => {
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setConfirmOpen(false);
        }}
      />
    </main>
  );
}
