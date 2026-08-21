import { prisma } from "@/core/prisma/prisma.client";
import { injectable } from "inversify";
import { Project } from "../entity/project.entity";
import { Prisma } from "@/generated/prisma";

@injectable()
export default class ProjectRepository {
  private readonly db = prisma;

  async create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
    return this.db.project.create({ data });
  }

  async findById(id: string): Promise<Project | null> {
    return this.db.project.findUnique({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Project[]> {
    return this.db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.db.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Project> {
    return this.db.project.delete({ where: { id } });
  }
}
