export interface Project {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
