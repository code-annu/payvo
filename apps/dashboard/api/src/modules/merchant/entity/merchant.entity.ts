export interface Merchant {
  readonly id: string;
  readonly mid: string;
  readonly userId: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
