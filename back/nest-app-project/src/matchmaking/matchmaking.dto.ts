import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class GameSettingsDto
{
  @IsString()
  @IsNotEmpty()
  @IsIn(['no_powerup', 'powerup_powerfist', 'powerup_dash'])
  powerup: string;

  constructor(powerup: string)
  {
    this.powerup = powerup;
  }
}
