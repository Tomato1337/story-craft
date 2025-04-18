import { z } from 'zod'

// Схема для создания новой главы
export const createChapterSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    content: z.string().min(1, 'Содержимое обязательно'),
})
export type CreateChapterInput = z.infer<typeof createChapterSchema>

// Схема для ответа с данными главы
export const chapterResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    authorId: z.string().uuid(),
    storyId: z.string().uuid(),
    position: z.number(),
    isLastChapter: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type ChapterResponse = z.infer<typeof chapterResponseSchema>

// Схема для предложения новой главы
export const proposeChapterSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    content: z.string().min(1, 'Содержимое обязательно'),
})
export type ProposeChapterInput = z.infer<typeof proposeChapterSchema>

// Схема для ответа с данными предложения главы
export const proposalResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    authorId: z.string().uuid(),
    storyId: z.string().uuid(),
    parentChapterId: z.string().uuid(),
    voteCount: z.number(),
    hasWon: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
})
export type ProposalResponse = z.infer<typeof proposalResponseSchema>

// Схема для ответа при голосовании
export const voteResponseSchema = z.object({
    success: z.boolean(),
})
export type VoteResponse = z.infer<typeof voteResponseSchema>
