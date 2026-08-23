import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { SoftDeleteAuditBase } from '#database/entities/audit-base.entity.js';
import { UserEntity } from '#modules/user/entities/user.entity.js';

@Entity({ name: 'calendar_tasks' })
@Check('chk_calendar_tasks_due_after_started', '`due_at` >= `started_at`')
export class CalendarTaskEntity extends SoftDeleteAuditBase {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id!: string;

  @Index('idx_calendar_tasks_user_id')
  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'started_at', type: 'datetime', precision: 3 })
  startedAt!: Date;

  @Column({ name: 'due_at', type: 'datetime', precision: 3 })
  dueAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', precision: 3, nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: 'RESTRICT', onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_calendar_tasks_users_user_id',
  })
  user?: Relation<UserEntity>;
}
