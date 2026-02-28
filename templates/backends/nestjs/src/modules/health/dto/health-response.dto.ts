import { IsString } from 'class-validator';

export class HealthResponseDto {
  @IsString()
  status!: string;
}
