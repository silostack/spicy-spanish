import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Package } from './entities/package.entity';
import { Transaction, TransactionStatus, PaymentMethod } from './entities/transaction.entity';
import { User, UserRole } from '../users/entities/user.entity';

interface CreatePackageDto {
  name: string;
  description: string;
  hours: number;
  priceUsd: number;
  isActive?: boolean;
}

interface UpdatePackageDto {
  name?: string;
  description?: string;
  hours?: number;
  priceUsd?: number;
  isActive?: boolean;
}

interface CreateTransactionDto {
  studentId: string;
  packageId?: string;
  amountUsd: number;
  hours: number;
  paymentMethod: PaymentMethod;
  status?: TransactionStatus;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: EntityRepository<Package>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  // Package methods
  async findAllPackages() {
    return this.packageRepository.findAll({
      orderBy: { priceUsd: 'ASC' },
    });
  }

  async findActivePackages() {
    return this.packageRepository.find({ isActive: true }, {
      orderBy: { priceUsd: 'ASC' },
    });
  }

  async findPackageById(id: string) {
    const pkg = await this.packageRepository.findOne({ id });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return pkg;
  }

  async createPackage(createPackageDto: CreatePackageDto) {
    const pkg = new Package(
      createPackageDto.name,
      createPackageDto.description,
      createPackageDto.hours,
      createPackageDto.priceUsd,
      createPackageDto.isActive !== undefined ? createPackageDto.isActive : true,
    );
    
    await this.em.persistAndFlush(pkg);
    return pkg;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const pkg = await this.findPackageById(id);
    this.em.assign(pkg, updatePackageDto);
    await this.em.flush();
    return pkg;
  }

  async removePackage(id: string) {
    const pkg = await this.findPackageById(id);
    await this.em.removeAndFlush(pkg);
    return { id, deleted: true };
  }

  // Transaction methods
  async findAllTransactions() {
    return this.transactionRepository.findAll({
      populate: ['student', 'package'],
      orderBy: { createdAt: 'DESC' },
    });
  }

  async findTransactionsByStudent(studentId: string) {
    return this.transactionRepository.find(
      { student: studentId },
      {
        populate: ['student', 'package'],
        orderBy: { createdAt: 'DESC' },
      }
    );
  }

  async findTransactionById(id: string) {
    const transaction = await this.transactionRepository.findOne(
      { id },
      { populate: ['student', 'package'] }
    );
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    
    return transaction;
  }

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    const student = await this.userRepository.findOne({ 
      id: createTransactionDto.studentId,
      role: UserRole.STUDENT 
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${createTransactionDto.studentId} not found`);
    }
    
    let pkg = undefined;
    if (createTransactionDto.packageId) {
      pkg = await this.packageRepository.findOne({ id: createTransactionDto.packageId });
      if (!pkg) {
        throw new NotFoundException(`Package with ID ${createTransactionDto.packageId} not found`);
      }
    }
    
    const transaction = new Transaction(
      student,
      createTransactionDto.amountUsd,
      createTransactionDto.hours,
      createTransactionDto.paymentMethod,
      createTransactionDto.status || TransactionStatus.COMPLETED,
      pkg
    );
    
    if (createTransactionDto.notes) {
      transaction.notes = createTransactionDto.notes;
    }
    
    await this.em.persistAndFlush(transaction);
    return transaction;
  }

  async updateTransaction(id: string, updateData: Partial<Transaction>) {
    const transaction = await this.findTransactionById(id);
    
    this.em.assign(transaction, updateData);
    await this.em.flush();
    
    return transaction;
  }

  async removeTransaction(id: string) {
    const transaction = await this.findTransactionById(id);
    await this.em.removeAndFlush(transaction);
    return { id, deleted: true };
  }

  // Dashboard statistics
  async getPaymentStats() {
    const recentTransactions = await this.transactionRepository.find(
      { status: TransactionStatus.COMPLETED },
      {
        orderBy: { createdAt: 'DESC' },
        limit: 5,
        populate: ['student']
      }
    );
    
    const totalPayments = await this.transactionRepository.count({ status: TransactionStatus.COMPLETED });
    
    // Get total revenue
    const completedTransactions = await this.transactionRepository.find({ 
      status: TransactionStatus.COMPLETED 
    });
    
    let totalRevenue = 0;
    let totalHours = 0;
    
    for (const transaction of completedTransactions) {
      totalRevenue += transaction.amountUsd;
      totalHours += transaction.hours;
    }
    
    // Get data for revenue this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTransactions = await this.transactionRepository.find({ 
      status: TransactionStatus.COMPLETED,
      createdAt: { $gte: firstDayOfMonth } 
    });
    
    let revenueThisMonth = 0;
    for (const transaction of thisMonthTransactions) {
      revenueThisMonth += transaction.amountUsd;
    }
    
    // Calculate average package value
    const packages = await this.packageRepository.findAll();
    let averagePackageValue = 0;
    
    if (packages.length > 0) {
      const totalValue = packages.reduce((sum, pkg) => sum + pkg.priceUsd, 0);
      averagePackageValue = totalValue / packages.length;
    }
    
    return {
      recentTransactions,
      totalPayments,
      totalRevenue,
      totalHours,
      revenueThisMonth,
      averagePackageValue,
    };
  }
}