import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens only' })
  slug: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid hex color (e.g. #1A2B3C)' })
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid hex color' })
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;
}
