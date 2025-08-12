import { z } from 'zod';

export const idSchema = z.string().uuid();

export const timestampSchema = z.string().datetime();

export const paginationSchema = z.object({
	page: z.number().int().positive().default(1),
	limit: z.number().int().positive().max(100).default(20)
});

export type PaginationInput = z.infer<typeof paginationSchema>;
