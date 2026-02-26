import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from "class-validator";
import {
  PaymentMethod,
  TransactionStatus,
} from "../entities/transaction.entity";

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  hours: number;

  @IsNumber()
  @Min(0)
  priceUsd: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  hours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUsd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateTransactionDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsNumber()
  @Min(0)
  amountUsd: number;

  @IsNumber()
  @Min(0)
  hours: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StripeCheckoutDto {
  @IsUUID()
  packageId: string;

  @IsUUID()
  studentId: string;

  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}
