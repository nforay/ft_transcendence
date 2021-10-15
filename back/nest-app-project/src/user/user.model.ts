import { Repository } from "typeorm"
import { UserEntity } from "./user.entity"
import * as speakeasy from "speakeasy"
import { Logger } from "@nestjs/common";

export class SecretPair {
  userId: string;
  secret: string;

  constructor(userId: string, secret: string) {
    this.userId = userId
    this.secret = secret
  }
}

export class UserManager {
  public static instance: UserManager = new UserManager()
  public userRepository: Repository<UserEntity>
  public twoFASercrets: SecretPair[] = []

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
    const pair = this.twoFASercrets.find(elem => elem.userId == userId)
    if (!pair)
      return false;

    Logger.log(pair.secret);

    const valid = speakeasy.totp.verify({
      secret: pair.secret,
      token: code,
    })

    Logger.log("Valid : " + valid);

    return valid
  }
}
