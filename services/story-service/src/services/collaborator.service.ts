import { prisma } from '../prisma'

export const collaboratorService = {
    async getStoryCollaborators(storyId: string) {
        return prisma.storyCollaborator.findMany({
            where: { storyId },
        })
    },

    async addCollaboratorInStory(storyId: string, collaboratorId: string) {
        const findUser = await prisma.storyCollaborator.findFirst({
            where: {
                storyId,
                userId: collaboratorId,
            },
        })

        if (!findUser) {
            return prisma.storyCollaborator.create({
                data: {
                    storyId,
                    userId: collaboratorId,
                },
            })
        } else {
            return findUser
        }
    },
}
