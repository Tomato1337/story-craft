import { prisma } from '../prisma'

export const collaboratorService = {
    async getStoryCollaborators(storyId: string) {
        return prisma.storyCollaborator
            .findMany({
                where: { storyId },
            })
            .then((collaborators) => {
                return collaborators.map((collaborator) => ({
                    id: collaborator.id,
                    userId: collaborator.userId,
                    role: collaborator.role,
                }))
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
