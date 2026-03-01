import { IsString, IsUUID } from 'class-validator';

export class HealthResponseDto {
  @IsString()
  status!: string;

  @IsUUID()
  request_id!: string;
}
