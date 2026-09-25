export interface Merchant {
  readonly id: string;
  readonly mid: string;
  readonly isActive: boolean;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
