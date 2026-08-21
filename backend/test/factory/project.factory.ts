import { prisma } from "@/core/prisma/prisma.client";

export default abstract class ProjectFactory {
  static async createProject(
    userId: string,
    name: string = "Test Project",
    isActive: boolean = true,
  ) {
    const project = await prisma.project.create({
      data: {
        userId,
        name,
        isActive,
      },
    });
    return project;
  }
}
