export const AccountTypes = {
  UserProfileRepository: Symbol.for("UserProfileRepository"),
  UserAddressRepository: Symbol.for("UserAddressRepository"),
  ProfileMapper: Symbol.for("ProfileMapper"),
  UserAddressMapper: Symbol.for("UserAddressMapper"),
  ProfileService: Symbol.for("ProfileService"),
  DeleteAccountUsecase: Symbol.for("DeleteAccountUsecase"),
  UserAddressService: Symbol.for("UserAddressService"),
  ProfileController: Symbol.for("ProfileController"),
  ProfileRouter: Symbol.for("ProfileRouter"),
  UserAddressController: Symbol.for("UserAddressController"),
  UserAddressRouter: Symbol.for("UserAddressRouter"),
  UserAddressContract: Symbol.for("UserAddressContract"),
} as const;
