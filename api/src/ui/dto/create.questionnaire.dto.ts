import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateQuestionnaireDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens only' })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  introTitle?: string;

  @IsOptional()
  @IsString()
  introDescription?: string;

  @IsOptional()
  @IsString()
  introImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  introImageScale?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  completionTitle?: string;

  @IsOptional()
  @IsString()
  completionDescription?: string;

  @IsOptional()
  @IsString()
  completionImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  showConfetti?: boolean;
}
