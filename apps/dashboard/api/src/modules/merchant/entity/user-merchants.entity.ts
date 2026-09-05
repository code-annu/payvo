export interface UserMerchants {
  readonly userId: string;
  readonly merchants: {
    readonly id: string;
    readonly mid: string;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }[];
}
