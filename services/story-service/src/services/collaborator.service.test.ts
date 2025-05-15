import { describe, it, expect, beforeEach, vi } from 'vitest'
import { collaboratorService } from './collaborator.service'
import { prisma } from '../prisma'

// Мок для prisma
vi.mock('../prisma', () => {
    return {
        prisma: {
            storyCollaborator: {
                findMany: vi.fn(),
                findFirst: vi.fn(),
                create: vi.fn(),
            },
        },
    }
})

describe('collaboratorService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getStoryCollaborators', () => {
        it('должен возвращать список соавторов истории', async () => {
            const mockCollaborators = [
                { id: '1', userId: 'user1', storyId: 'story1', role: 'ADMIN' },
                { id: '2', userId: 'user2', storyId: 'story1', role: 'USER' },
            ]

            ;(prisma.storyCollaborator.findMany as any).mockResolvedValue(
                mockCollaborators
            )

            const result = await collaboratorService.getStoryCollaborators(
                'story1'
            )

            expect(prisma.storyCollaborator.findMany).toHaveBeenCalledWith({
                where: { storyId: 'story1' },
            })

            expect(result).toEqual([
                { id: '1', userId: 'user1', role: 'ADMIN' },
                { id: '2', userId: 'user2', role: 'USER' },
            ])
        })
    })

    describe('addCollaboratorInStory', () => {
        it('должен добавлять нового соавтора, если он не существует', async () => {
            ;(prisma.storyCollaborator.findFirst as any).mockResolvedValue(null)

            const newCollaborator = {
                id: '3',
                userId: 'user3',
                storyId: 'story1',
                role: 'USER',
            }

            ;(prisma.storyCollaborator.create as any).mockResolvedValue(
                newCollaborator
            )

            const result = await collaboratorService.addCollaboratorInStory(
                'story1',
                'user3'
            )

            expect(prisma.storyCollaborator.findFirst).toHaveBeenCalledWith({
                where: {
                    storyId: 'story1',
                    userId: 'user3',
                },
            })

            expect(prisma.storyCollaborator.create).toHaveBeenCalledWith({
                data: {
                    storyId: 'story1',
                    userId: 'user3',
                },
            })

            expect(result).toEqual(newCollaborator)
        })

        it('должен возвращать существующего соавтора, если он уже существует', async () => {
            const existingCollaborator = {
                id: '2',
                userId: 'user2',
                storyId: 'story1',
                role: 'USER',
            }

            ;(prisma.storyCollaborator.findFirst as any).mockResolvedValue(
                existingCollaborator
            )

            const result = await collaboratorService.addCollaboratorInStory(
                'story1',
                'user2'
            )

            expect(prisma.storyCollaborator.findFirst).toHaveBeenCalledWith({
                where: {
                    storyId: 'story1',
                    userId: 'user2',
                },
            })

            expect(prisma.storyCollaborator.create).not.toHaveBeenCalled()

            expect(result).toEqual(existingCollaborator)
        })
    })
})
