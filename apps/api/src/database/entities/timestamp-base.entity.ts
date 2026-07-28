import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class CreateTimestampBase {
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  readonly createdAt!: Date;
}

export abstract class MutableTimestampBase extends CreateTimestampBase {
  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  readonly updatedAt!: Date;
}

export abstract class SoftDeleteTimestampBase extends MutableTimestampBase {
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  readonly deletedAt!: Date | null;
}
