export interface Merchant {
  readonly id: string;
  readonly userId: string;
  readonly mid: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
