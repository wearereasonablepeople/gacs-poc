import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsIn(['owner', 'admin', 'tenant_owner', 'tenant_admin'], {
    message: 'role must be one of: owner, admin, tenant_owner, tenant_admin',
  })
  role: string;
}
