import { Repository } from "typeorm"
import { UserEntity } from "./user.entity"
import * as speakeasy from "speakeasy"

export class SecretPair {
  userId: string;
  secret: string;
  date: number

  constructor(userId: string, secret: string) {
    this.userId = userId
    this.secret = secret
    this.date = new Date().getTime();
  }

  expired() : boolean {
    return new Date().getTime() - this.date > 1000 * 60 * 2
  }
}

export class TwoFAUser {
  userId: string;
  date: number;

  constructor(userId: string) {
    this.userId = userId
    this.date = new Date().getTime();
  }

  expired() : boolean {
    return new Date().getTime() - this.date > 1000 * 60 * 2
  }
}

export class UserStatus {
  userId: string;
  status: string;
  lastRequestTime: number;

  constructor(userId: string, status: string, lastRequestTime: number) {
    this.userId = userId
    this.status = status
    this.lastRequestTime = lastRequestTime
  }
}

export class UserManager {
  public static instance: UserManager = new UserManager()
  public userRepository: Repository<UserEntity>
  public twoFASercrets: SecretPair[] = []
  public twoFAlist: TwoFAUser[] = []
  public disableTwoFAlist: TwoFAUser[] = []
  public onlineUsersStatus: Map<string, UserStatus> = new Map<string, UserStatus>()

  constructor() {
    if (UserManager.instance) {
      throw new Error('Error: Instantiation failed: Use UserManager.instance instead of new.')
    }
    UserManager.instance = this
  }

  addSecret(userId: string, secret: string) {
    this.removeSecret(userId)
    this.twoFASercrets.push(new SecretPair(userId, secret))
  }

  removeSecret(userId: string) {
    const pair = this.twoFASercrets.find(elem => elem.userId == userId)
    if (!pair)
      return;
    this.twoFASercrets.splice(this.twoFASercrets.indexOf(pair), 1)
  }

  async saveSecret(userId: string) : Promise<boolean> {
    const pair = this.twoFASercrets.find(elem => elem.userId == userId)
    if (!pair)
      return false
    const user = await this.userRepository.findOne({ where: { id: userId }})
    if (!user)
      return false
    await this.userRepository.update({ id: user.id }, { has2FA: true, twoFASecret: pair.secret });
    this.removeSecret(user.id)
    return true;
  }

  validateSecret(userId: string, code: string) : boolean {
    const pair = this.twoFASercrets.find(elem => elem.userId == userId && !elem.expired())
    if (!pair)
      return false;

    const valid = speakeasy.totp.verify({
      secret: pair.secret,
      token: code,
    })

    return valid
  }

  validateSecretToLog(user: UserEntity, code: string) : boolean {
    const pair = this.twoFAlist.find(elem => elem.userId == user.id && !elem.expired())
    if (!pair)
      return false;

    const valid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      token: code,
    })

    return valid
  }

  validateSecretToDisable(user: UserEntity, code: string) : boolean {
    const valid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      token: code,
    })

    return valid
  }

  remove2FAUserToLog(userId: string) : void {
    const user = this.twoFAlist.find(elem => elem.userId == userId)
    if (!user)
      return;
    this.twoFAlist.splice(this.twoFAlist.indexOf(user), 1)
  }

  remove2FAUserToDisable(userId: string) : void {
    const user = this.disableTwoFAlist.find(elem => elem.userId == userId)
    if (!user)
      return;
    this.disableTwoFAlist.splice(this.disableTwoFAlist.indexOf(user), 1)
  }
}
