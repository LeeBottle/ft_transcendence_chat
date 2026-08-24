import { z } from 'zod';

export const createdAtSchema = z.iso.datetime();
export const updatedAtSchema = z.iso.datetime();
export const deletedAtSchema = z.iso.datetime().nullable();

export const baseTimestampsSchema = z.object({
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema,
});

export const softDeleteTimestampsSchema = baseTimestampsSchema.extend({
  deletedAt: deletedAtSchema,
});
