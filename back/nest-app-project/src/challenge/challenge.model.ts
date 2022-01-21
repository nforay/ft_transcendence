export class ChallengeData {
  public to: string = "";
  public expireDate: number;

  constructor(to: string) {
    this.to = to;
    this.expireDate = new Date().getTime() + (1000 * 60);
  }

  expired() {
    return new Date().getTime() > this.expireDate;
  }
}

export class ChallengeManager {
  public static instance: ChallengeManager = new ChallengeManager()

  public pendingRequests: Map<string, ChallengeData> = new Map<string, ChallengeData>()

  constructor() {
    if (ChallengeManager.instance)
      throw new Error("Error: Instantiation failed: Use ChallengeManager.instance instead of new.")
  }

  public addChallenge(from: string, to: string) {
    this.pendingRequests.set(from, new ChallengeData(to))
  }

  public removeChallenge(from: string) {
    this.pendingRequests.delete(from)
  }

  public clearAllChallenges(user: string) {
    let pendingdelete: string[] = []
    this.pendingRequests.forEach((value, key) => {
      if (value.to === user)
        pendingdelete.push(key)
    })
    pendingdelete.forEach(key => this.pendingRequests.delete(key))
    this.pendingRequests.delete(user)
  }

  public rejectRequest(from: string, to: string)
  {
    if (this.pendingRequests.has(from) && this.pendingRequests.get(from).to === to)
      this.pendingRequests.delete(from)
  }
}
