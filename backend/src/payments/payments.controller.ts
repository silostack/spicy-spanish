import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Headers,
  Req,
  RawBodyRequest,
  BadRequestException
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaymentMethod, TransactionStatus } from './entities/transaction.entity';
import { Request } from 'express';

// DTOs
class CreatePackageDto {
  name: string;
  description: string;
  hours: number;
  priceUsd: number;
  isActive?: boolean;
}

class UpdatePackageDto {
  name?: string;
  description?: string;
  hours?: number;
  priceUsd?: number;
  isActive?: boolean;
}

class CreateTransactionDto {
  studentId: string;
  packageId?: string;
  amountUsd: number;
  hours: number;
  paymentMethod: PaymentMethod;
  status?: TransactionStatus;
  notes?: string;
}

class StripeCheckoutDto {
  packageId: string;
  studentId: string;
  successUrl: string;
  cancelUrl: string;
}

class CryptoCheckoutDto {
  packageId: string;
  studentId: string;
  successUrl: string;
  walletAddress?: string;
}

class CompleteManualPaymentDto {
  cryptoTransactionId?: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Package endpoints
  @Get('packages')
  findAllPackages() {
    return this.paymentsService.findAllPackages();
  }

  @Get('packages/active')
  findActivePackages() {
    return this.paymentsService.findActivePackages();
  }

  @Get('packages/:id')
  findPackageById(@Param('id') id: string) {
    return this.paymentsService.findPackageById(id);
  }

  @Post('packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPackage(@Body() createPackageDto: CreatePackageDto) {
    return this.paymentsService.createPackage(createPackageDto);
  }

  @Patch('packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePackage(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.paymentsService.updatePackage(id, updatePackageDto);
  }

  @Delete('packages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removePackage(@Param('id') id: string) {
    return this.paymentsService.removePackage(id);
  }

  // Transaction endpoints
  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllTransactions() {
    return this.paymentsService.findAllTransactions();
  }

  @Get('transactions/student/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findTransactionsByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findTransactionsByStudent(studentId);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findTransactionById(@Param('id') id: string) {
    return this.paymentsService.findTransactionById(id);
  }

  @Post('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.paymentsService.createTransaction(createTransactionDto);
  }

  @Patch('transactions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateTransaction(@Param('id') id: string, @Body() updateData: Partial<CreateTransactionDto>) {
    return this.paymentsService.updateTransaction(id, updateData);
  }

  @Delete('transactions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeTransaction(@Param('id') id: string) {
    return this.paymentsService.removeTransaction(id);
  }

  // Stripe payment endpoints
  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createStripeCheckout(@Body() checkoutDto: StripeCheckoutDto) {
    return this.paymentsService.createStripeCheckoutSession(checkoutDto);
  }

  @Post('stripe/webhook')
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Missing request body');
    }

    return this.paymentsService.handleStripeWebhook(signature, request.rawBody);
  }

  // Crypto payment endpoints
  @Post('crypto/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createCryptoCheckout(@Body() checkoutDto: CryptoCheckoutDto) {
    return this.paymentsService.createCryptoCheckout(checkoutDto);
  }

  @Post('transactions/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  completeManualPayment(
    @Param('id') transactionId: string,
    @Body() completePaymentDto: CompleteManualPaymentDto
  ) {
    return this.paymentsService.completeManualPayment(
      transactionId,
      completePaymentDto.cryptoTransactionId
    );
  }

  // Stats
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }
}