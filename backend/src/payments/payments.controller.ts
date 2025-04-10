import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaymentMethod, TransactionStatus } from './entities/transaction.entity';

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

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.ADMIN)
  createPackage(@Body() createPackageDto: CreatePackageDto) {
    return this.paymentsService.createPackage(createPackageDto);
  }

  @Patch('packages/:id')
  @Roles(UserRole.ADMIN)
  updatePackage(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.paymentsService.updatePackage(id, updatePackageDto);
  }

  @Delete('packages/:id')
  @Roles(UserRole.ADMIN)
  removePackage(@Param('id') id: string) {
    return this.paymentsService.removePackage(id);
  }

  // Transaction endpoints
  @Get('transactions')
  @Roles(UserRole.ADMIN)
  findAllTransactions() {
    return this.paymentsService.findAllTransactions();
  }

  @Get('transactions/student/:studentId')
  findTransactionsByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findTransactionsByStudent(studentId);
  }

  @Get('transactions/:id')
  findTransactionById(@Param('id') id: string) {
    return this.paymentsService.findTransactionById(id);
  }

  @Post('transactions')
  @Roles(UserRole.ADMIN)
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.paymentsService.createTransaction(createTransactionDto);
  }

  @Patch('transactions/:id')
  @Roles(UserRole.ADMIN)
  updateTransaction(@Param('id') id: string, @Body() updateData: Partial<CreateTransactionDto>) {
    return this.paymentsService.updateTransaction(id, updateData);
  }

  @Delete('transactions/:id')
  @Roles(UserRole.ADMIN)
  removeTransaction(@Param('id') id: string) {
    return this.paymentsService.removeTransaction(id);
  }

  // Stats
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }
}