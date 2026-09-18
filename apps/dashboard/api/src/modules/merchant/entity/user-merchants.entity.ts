export interface UserMerchants {
  readonly userId: string;
  readonly merchants: {
    readonly id: string;
    readonly isActive: boolean;
    readonly mid: string;
  }[];
}
