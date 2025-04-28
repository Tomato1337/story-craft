import { z } from 'zod'
import { genreResponseSchema } from './genre.model'

export const initialChapterSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})

export const storyCollaboratorSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['USER', 'ADMIN']),
})

export const storySchema = z.object({
    title: z
        .string()
        .min(3, 'Название должно содержать минимум 3 символа')
        .max(255),
    description: z
        .string()
        .min(10, 'Описание должно содержать минимум 10 символов'),
    genres: z.array(z.string()).min(1, 'Выберите хотя бы один жанр'),
    coverImageUrl: z
        .string()
        .url('Некорректная ссылка на изображение обложки')
        .optional(),
    proposalTime: z.number().default(1000 * 60 * 60),
    votingTime: z.number().default(1000 * 60 * 10),
    isPublic: z.boolean().default(true),
    storyCollaborator: storyCollaboratorSchema.optional(),
    initialChapter: initialChapterSchema,
})
export const createStorySchema = storySchema.omit({
    storyCollaborator: true,
})

// all optional:
export const updateStorySchema = storySchema
    .omit({
        initialChapter: true,
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Должно быть указано хотя бы одно поле для изменения',
    })

export type CreateStoryInput = z.infer<typeof createStorySchema>
export type ChangeStoryInput = z.infer<typeof updateStorySchema>

export const storyResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    coverImageUrl: z.string().nullable(),
    authorId: z.string().uuid(),
    isActive: z.boolean(),
    isPublic: z.boolean(),
    currentPhase: z.enum(['PROPOSAL', 'VOTING']),
    viewCount: z.number(),
    proposalTime: z.number(),
    votingTime: z.number(),
    proposalDeadline: z.string().datetime().nullable(),
    votingDeadline: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    storyCollaborators: z.array(storyCollaboratorSchema),
    genres: z.array(genreResponseSchema),
})

export type StoryResponse = z.infer<typeof storyResponseSchema>

export const paginatedStoryResponseSchema = z.object({
    items: z.array(storyResponseSchema),
    totalCount: z.number(),
    totalPages: z.number(),
    page: z.number(),
    pageSize: z.number(),
})

export type PaginatedStoryResponse = z.infer<
    typeof paginatedStoryResponseSchema
>
