import z from 'zod'

export const createGenreSchema = z.object({
    name: z
        .string()
        .min(3, 'Название должно содержать минимум 3 символа')
        .max(255),
})

export type CreateGenreInput = z.infer<typeof createGenreSchema>

export const genreResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
})

export const getAllGenresResponseSchema = z.object({
    count: z.number(),
    genres: z.array(genreResponseSchema),
})
export type GetAllGenresResponse = z.infer<typeof getAllGenresResponseSchema>
