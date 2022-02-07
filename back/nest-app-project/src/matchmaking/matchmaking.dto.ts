import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class GameSettingsDto
{
  @IsString()
  @IsNotEmpty()
  @IsIn(['no_powerup', 'powerup_powerfist', 'powerup_dash'])
  powerup: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['classic', 'obstacles'])
  map: string;

  constructor(powerup: string, map: string)
  {
    this.powerup = powerup;
    this.map = map;
  }
}
