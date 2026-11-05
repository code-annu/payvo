export const AccountTypes = {
  UserProfileRepository: Symbol.for("UserProfileRepository"),
  UserPreferencesRepository: Symbol.for("UserPreferencesRepository"),
  UserAddressRepository: Symbol.for("UserAddressRepository"),
  AccountMapper: Symbol.for("AccountMapper"),
  UserAddressMapper: Symbol.for("UserAddressMapper"),
  AccountService: Symbol.for("AccountService"),
  UserAddressService: Symbol.for("UserAddressService"),
  AccountController: Symbol.for("AccountController"),
  AccountRouter: Symbol.for("AccountRouter"),
  UserAddressController: Symbol.for("UserAddressController"),
  UserAddressRouter: Symbol.for("UserAddressRouter"),
} as const;
