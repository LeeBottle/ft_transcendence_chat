import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class CreateAuditBase {
  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  readonly createdAt!: string;
}

export abstract class MutableAuditBase extends CreateAuditBase {
  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  readonly updatedAt!: string;
}

export abstract class SoftDeleteAuditBase extends MutableAuditBase {
  @DeleteDateColumn({ type: 'datetime', name: 'deleted_at', nullable: true, default: null })
  readonly deletedAt!: string | null;
}
