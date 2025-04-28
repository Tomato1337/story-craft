import { z } from 'zod'

export const createChapterSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    content: z.string().min(1, 'Содержимое обязательно'),
})
export type CreateChapterInput = z.infer<typeof createChapterSchema>

export const chapterResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    authorId: z.string().uuid(),
    storyId: z.string().uuid(),
    position: z.number(),
    isLastChapter: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})
export type ChapterResponse = z.infer<typeof chapterResponseSchema>

export const proposeChapterSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    content: z.string().min(1, 'Содержимое обязательно'),
})
export type ProposeChapterInput = z.infer<typeof proposeChapterSchema>

export const proposalResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    authorId: z.string().uuid(),
    storyId: z.string().uuid(),
    parentChapterId: z.string().uuid(),
    voteCount: z.number(),
    hasWon: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})
export type ProposalResponse = z.infer<typeof proposalResponseSchema>

export const voteResponseSchema = z.object({
    success: z.boolean(),
})
export type VoteResponse = z.infer<typeof voteResponseSchema>

export const paginatedChapterResponseSchema = z.object({
    items: z.array(chapterResponseSchema),
    totalCount: z.number(),
    totalPages: z.number(),
    page: z.number(),
    pageSize: z.number(),
})

export const paginatedProposalResponseSchema = z.object({
    items: z.array(proposalResponseSchema),
    totalCount: z.number(),
    totalPages: z.number(),
    page: z.number(),
    pageSize: z.number(),
})
