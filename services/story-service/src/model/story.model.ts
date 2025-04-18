import { z } from 'zod'

// Добавляем схему начальной главы
export const initialChapterSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
})

export const createStorySchema = z.object({
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
    isPublic: z.boolean().default(false),
    initialChapter: initialChapterSchema, // новая начальная глава
    // proposalDeadline: z.date().optional(),
    // votingDeadline: z.date().optional(),
})

export type CreateStoryInput = z.infer<typeof createStorySchema>

export const storyResponseSchema = z.object({
    count: z.number(),
    stories: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            coverImageUrl: z.string().optional(),
            isPublic: z.boolean(),
            proposalDeadline: z.date().optional(),
            votingDeadline: z.date().optional(),
            createdAt: z.date(),
            updatedAt: z.date(),
            genres: z.array(z.string()),
        })
    ),
})

export type StoryResponse = z.infer<typeof storyResponseSchema>
