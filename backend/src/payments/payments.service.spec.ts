/* eslint-disable @typescript-eslint/no-var-requires */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Package } from './entities/package.entity';
import { Transaction, TransactionStatus, PaymentMethod } from './entities/transaction.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../scheduling/entities/appointment.entity';

// ---------------------------------------------------------------------------
// Mock Stripe
// ---------------------------------------------------------------------------

const mockStripeInstance = {
  products: {
    create: jest.fn(),
    update: jest.fn(),
  },
  prices: {
    create: jest.fn(),
    update: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  const StripeMock = jest.fn().mockImplementation(() => mockStripeInstance);
  return { __esModule: true, default: StripeMock };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUser(overrides: Partial<User> & { role: UserRole }): User {
  const u = {
    id: 'user-' + Math.random().toString(36).slice(2, 8),
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashed',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as User;
  (u as any).fullName = `${u.firstName} ${u.lastName}`;
  return u;
}

function createMockPackage(overrides?: Partial<Package>): Package {
  return {
    id: 'pkg-1',
    name: '10 Hour Pack',
    description: '10 hours of Spanish lessons',
    hours: 10,
    priceUsd: 250,
    isActive: true,
    stripeProductId: 'prod_123',
    stripePriceId: 'price_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Package;
}

function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  const student = createMockUser({ id: 'stu-1', role: UserRole.STUDENT });
  return {
    id: 'txn-1',
    student,
    amountUsd: 250,
    hours: 10,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    status: TransactionStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as Transaction;
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

const mockRepository = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

const mockEntityManager = () => ({
  persistAndFlush: jest.fn(),
  flush: jest.fn(),
  removeAndFlush: jest.fn(),
  assign: jest.fn((entity, dto) => Object.assign(entity, dto)),
  find: jest.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PaymentsService', () => {
  let service: PaymentsService;
  let packageRepo: ReturnType<typeof mockRepository>;
  let transactionRepo: ReturnType<typeof mockRepository>;
  let userRepo: ReturnType<typeof mockRepository>;
  let em: ReturnType<typeof mockEntityManager>;

  beforeEach(async () => {
    // Reset all Stripe mock calls between tests
    jest.clearAllMocks();

    packageRepo = mockRepository();
    transactionRepo = mockRepository();
    userRepo = mockRepository();
    em = mockEntityManager();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Package), useValue: packageRepo },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // Package CRUD
  // -----------------------------------------------------------------------

  describe('findAllPackages', () => {
    it('should return all packages ordered by price', async () => {
      const packages = [createMockPackage()];
      packageRepo.findAll.mockResolvedValue(packages);

      const result = await service.findAllPackages();
      expect(result).toEqual(packages);
      expect(packageRepo.findAll).toHaveBeenCalledWith({
        orderBy: { priceUsd: 'ASC' },
      });
    });
  });

  describe('findActivePackages', () => {
    it('should return only active packages', async () => {
      const packages = [createMockPackage({ isActive: true })];
      packageRepo.find.mockResolvedValue(packages);

      const result = await service.findActivePackages();
      expect(result).toEqual(packages);
      expect(packageRepo.find).toHaveBeenCalledWith(
        { isActive: true },
        { orderBy: { priceUsd: 'ASC' } },
      );
    });
  });

  describe('findPackageById', () => {
    it('should return package when found', async () => {
      const pkg = createMockPackage();
      packageRepo.findOne.mockResolvedValue(pkg);

      const result = await service.findPackageById('pkg-1');
      expect(result).toEqual(pkg);
    });

    it('should throw NotFoundException when not found', async () => {
      packageRepo.findOne.mockResolvedValue(null);
      await expect(service.findPackageById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPackage', () => {
    it('should create a package with Stripe product and price', async () => {
      mockStripeInstance.products.create.mockResolvedValue({ id: 'prod_new' });
      mockStripeInstance.prices.create.mockResolvedValue({ id: 'price_new' });

      const dto = {
        name: '5 Hour Pack',
        description: '5 hours of lessons',
        hours: 5,
        priceUsd: 125,
      };

      const result = await service.createPackage(dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('5 Hour Pack');
      expect(mockStripeInstance.products.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: '5 Hour Pack' }),
      );
      expect(mockStripeInstance.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product: 'prod_new',
          unit_amount: 12500,
          currency: 'usd',
        }),
      );
      expect(em.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('updatePackage', () => {
    it('should update package and Stripe product', async () => {
      const pkg = createMockPackage();
      packageRepo.findOne.mockResolvedValue(pkg);
      mockStripeInstance.products.update.mockResolvedValue({});

      const result = await service.updatePackage('pkg-1', { name: 'Updated Pack' });
      expect(em.assign).toHaveBeenCalledWith(pkg, { name: 'Updated Pack' });
      expect(mockStripeInstance.products.update).toHaveBeenCalledWith(
        'prod_123',
        expect.anything(),
      );
      expect(em.flush).toHaveBeenCalled();
    });

    it('should create a new Stripe price when priceUsd changes', async () => {
      const pkg = createMockPackage();
      packageRepo.findOne.mockResolvedValue(pkg);
      mockStripeInstance.products.update.mockResolvedValue({});
      mockStripeInstance.prices.create.mockResolvedValue({ id: 'price_new' });
      mockStripeInstance.prices.update.mockResolvedValue({});

      await service.updatePackage('pkg-1', { priceUsd: 300 });
      expect(mockStripeInstance.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product: 'prod_123',
          unit_amount: 30000,
        }),
      );
      // Old price deactivated
      expect(mockStripeInstance.prices.update).toHaveBeenCalledWith(
        'price_123',
        { active: false },
      );
    });
  });

  describe('removePackage', () => {
    it('should deactivate Stripe product/price and remove package', async () => {
      const pkg = createMockPackage();
      packageRepo.findOne.mockResolvedValue(pkg);
      mockStripeInstance.products.update.mockResolvedValue({});
      mockStripeInstance.prices.update.mockResolvedValue({});

      const result = await service.removePackage('pkg-1');
      expect(result).toEqual({ id: 'pkg-1', deleted: true });
      expect(mockStripeInstance.products.update).toHaveBeenCalledWith('prod_123', { active: false });
      expect(mockStripeInstance.prices.update).toHaveBeenCalledWith('price_123', { active: false });
      expect(em.removeAndFlush).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Transaction CRUD
  // -----------------------------------------------------------------------

  describe('findAllTransactions', () => {
    it('should return all transactions', async () => {
      const txns = [createMockTransaction()];
      transactionRepo.findAll.mockResolvedValue(txns);

      const result = await service.findAllTransactions();
      expect(result).toEqual(txns);
      expect(transactionRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          populate: ['student', 'package'],
          orderBy: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findTransactionsByStudent', () => {
    it('should filter by student id', async () => {
      transactionRepo.find.mockResolvedValue([]);
      await service.findTransactionsByStudent('stu-1');
      expect(transactionRepo.find).toHaveBeenCalledWith(
        { student: 'stu-1' },
        expect.objectContaining({ populate: ['student', 'package'] }),
      );
    });
  });

  describe('findTransactionById', () => {
    it('should return transaction when found', async () => {
      const txn = createMockTransaction();
      transactionRepo.findOne.mockResolvedValue(txn);
      const result = await service.findTransactionById('txn-1');
      expect(result).toEqual(txn);
    });

    it('should throw NotFoundException when not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.findTransactionById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTransaction', () => {
    const student = createMockUser({ id: 'stu-1', role: UserRole.STUDENT });

    it('should create a transaction', async () => {
      userRepo.findOne.mockResolvedValue(student);
      packageRepo.findOne.mockResolvedValue(createMockPackage());

      const dto = {
        studentId: 'stu-1',
        packageId: 'pkg-1',
        amountUsd: 250,
        hours: 10,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        notes: 'test',
      };

      const result = await service.createTransaction(dto);
      expect(result).toBeDefined();
      expect(result.amountUsd).toBe(250);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should create transaction without package', async () => {
      userRepo.findOne.mockResolvedValue(student);

      const dto = {
        studentId: 'stu-1',
        amountUsd: 50,
        hours: 2,
        paymentMethod: PaymentMethod.MANUAL,
      };

      const result = await service.createTransaction(dto);
      expect(result).toBeDefined();
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when student not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createTransaction({
          studentId: 'bad',
          amountUsd: 50,
          hours: 2,
          paymentMethod: PaymentMethod.MANUAL,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when packageId provided but not found', async () => {
      userRepo.findOne.mockResolvedValue(student);
      packageRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createTransaction({
          studentId: 'stu-1',
          packageId: 'bad-pkg',
          amountUsd: 50,
          hours: 2,
          paymentMethod: PaymentMethod.MANUAL,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction fields', async () => {
      const txn = createMockTransaction();
      transactionRepo.findOne.mockResolvedValue(txn);

      const result = await service.updateTransaction('txn-1', { notes: 'updated' });
      expect(em.assign).toHaveBeenCalledWith(txn, { notes: 'updated' });
      expect(em.flush).toHaveBeenCalled();
    });
  });

  describe('removeTransaction', () => {
    it('should remove transaction and return confirmation', async () => {
      const txn = createMockTransaction();
      transactionRepo.findOne.mockResolvedValue(txn);

      const result = await service.removeTransaction('txn-1');
      expect(result).toEqual({ id: 'txn-1', deleted: true });
      expect(em.removeAndFlush).toHaveBeenCalledWith(txn);
    });
  });

  // -----------------------------------------------------------------------
  // Stripe Checkout
  // -----------------------------------------------------------------------

  describe('createStripeCheckoutSession', () => {
    const student = createMockUser({
      id: 'stu-1',
      role: UserRole.STUDENT,
      email: 'stu@test.com',
      firstName: 'Stu',
      lastName: 'Dent',
    });
    const pkg = createMockPackage();

    const dto = {
      studentId: 'stu-1',
      packageId: 'pkg-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(student);
      packageRepo.findOne.mockResolvedValue(pkg);
    });

    it('should create a checkout session for existing Stripe customer', async () => {
      (student as any).stripeCustomerId = 'cus_existing';

      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/cs_test',
      });

      const result = await service.createStripeCheckoutSession(dto);
      expect(result.sessionId).toBe('cs_test');
      expect(result.sessionUrl).toBe('https://checkout.stripe.com/cs_test');
      expect(result.transactionId).toBeDefined();
      expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
    });

    it('should create a new Stripe customer when none exists', async () => {
      (student as any).stripeCustomerId = undefined;

      mockStripeInstance.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test2',
        url: 'https://checkout.stripe.com/cs_test2',
      });

      const result = await service.createStripeCheckoutSession(dto);
      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'stu@test.com' }),
      );
      expect(result.sessionId).toBe('cs_test2');
    });

    it('should throw NotFoundException when student not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.createStripeCheckoutSession(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when package not found', async () => {
      packageRepo.findOne.mockResolvedValue(null);
      await expect(service.createStripeCheckoutSession(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when package is inactive', async () => {
      packageRepo.findOne.mockResolvedValue(createMockPackage({ isActive: false }));
      await expect(service.createStripeCheckoutSession(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------------------
  // Webhook handling
  // -----------------------------------------------------------------------

  describe('handleStripeWebhook', () => {
    it('should handle checkout.session.completed and mark transaction completed', async () => {
      const txn = createMockTransaction({ id: 'txn-1', status: TransactionStatus.PENDING });
      transactionRepo.findOne.mockResolvedValue(txn);

      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { transactionId: 'txn-1' },
            invoice: 'inv_123',
          },
        },
      });

      const result = await service.handleStripeWebhook('sig', Buffer.from('body'));
      expect(result).toEqual({ success: true });
      expect(txn.status).toBe(TransactionStatus.COMPLETED);
      expect(txn.invoiceUrl).toBe('inv_123');
      expect(em.flush).toHaveBeenCalled();
    });

    it('should handle payment_intent.succeeded', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      const result = await service.handleStripeWebhook('sig', Buffer.from('body'));
      expect(result).toEqual({ success: true });
    });

    it('should handle payment_intent.payment_failed', async () => {
      const txn = createMockTransaction({ id: 'txn-2', status: TransactionStatus.PENDING });
      transactionRepo.findOne.mockResolvedValue(txn);

      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            metadata: { checkout_session_id: 'cs_123' },
            last_payment_error: { message: 'Card declined' },
          },
        },
      });

      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        metadata: { transactionId: 'txn-2' },
      });

      const result = await service.handleStripeWebhook('sig', Buffer.from('body'));
      expect(result).toEqual({ success: true });
      expect(txn.status).toBe(TransactionStatus.FAILED);
      expect(txn.notes).toContain('Card declined');
    });

    it('should return received:true for unhandled event types', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'some.other.event',
        data: { object: {} },
      });

      const result = await service.handleStripeWebhook('sig', Buffer.from('body'));
      expect(result).toEqual({ received: true });
    });

    it('should throw BadRequestException when signature verification fails', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleStripeWebhook('bad-sig', Buffer.from('body')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------------------
  // Complete manual payment
  // -----------------------------------------------------------------------

  describe('completeManualPayment', () => {
    it('should complete a pending transaction', async () => {
      const txn = createMockTransaction({ id: 'txn-1', status: TransactionStatus.PENDING });
      transactionRepo.findOne.mockResolvedValue(txn);

      const result = await service.completeManualPayment('txn-1');
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should throw BadRequestException when transaction is not pending', async () => {
      const txn = createMockTransaction({ id: 'txn-1', status: TransactionStatus.COMPLETED });
      transactionRepo.findOne.mockResolvedValue(txn);

      await expect(service.completeManualPayment('txn-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      transactionRepo.findOne.mockResolvedValue(null);
      await expect(service.completeManualPayment('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // Student balance
  // -----------------------------------------------------------------------

  describe('getStudentBalance', () => {
    it('should calculate balance from transactions and appointments', async () => {
      const student = createMockUser({ id: 'stu-1', role: UserRole.STUDENT });
      userRepo.findOne.mockResolvedValue(student);

      // 2 completed transactions totalling 15 hours
      transactionRepo.find.mockResolvedValue([
        createMockTransaction({ hours: 10, status: TransactionStatus.COMPLETED }),
        createMockTransaction({ hours: 5, status: TransactionStatus.COMPLETED }),
      ]);

      // 3 completed appointments totalling 3 hours
      em.find.mockResolvedValue([
        {
          startTime: new Date('2026-03-01T10:00:00Z'),
          endTime: new Date('2026-03-01T11:00:00Z'),
          status: AppointmentStatus.COMPLETED,
        },
        {
          startTime: new Date('2026-03-02T10:00:00Z'),
          endTime: new Date('2026-03-02T11:00:00Z'),
          status: AppointmentStatus.COMPLETED,
        },
        {
          startTime: new Date('2026-03-03T10:00:00Z'),
          endTime: new Date('2026-03-03T11:00:00Z'),
          status: AppointmentStatus.COMPLETED,
        },
      ]);

      const result = await service.getStudentBalance('stu-1');
      expect(result.totalHoursPurchased).toBe(15);
      expect(result.hoursUsed).toBe(3);
      expect(result.availableHours).toBe(12);
    });

    it('should return zero balance when no transactions or appointments', async () => {
      const student = createMockUser({ id: 'stu-1', role: UserRole.STUDENT });
      userRepo.findOne.mockResolvedValue(student);
      transactionRepo.find.mockResolvedValue([]);
      em.find.mockResolvedValue([]);

      const result = await service.getStudentBalance('stu-1');
      expect(result.totalHoursPurchased).toBe(0);
      expect(result.hoursUsed).toBe(0);
      expect(result.availableHours).toBe(0);
    });

    it('should throw NotFoundException when student not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getStudentBalance('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // Payment stats
  // -----------------------------------------------------------------------

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      const txn = createMockTransaction({
        status: TransactionStatus.COMPLETED,
        amountUsd: 250,
        hours: 10,
      });

      // recent transactions
      transactionRepo.find.mockResolvedValueOnce([txn]);
      // total count
      transactionRepo.count.mockResolvedValueOnce(5);
      // completed transactions for revenue
      transactionRepo.find.mockResolvedValueOnce([txn]);
      // this month transactions
      transactionRepo.find.mockResolvedValueOnce([txn]);
      // packages for average
      packageRepo.findAll.mockResolvedValue([
        createMockPackage({ priceUsd: 200 }),
        createMockPackage({ priceUsd: 400 }),
      ]);

      const result = await service.getPaymentStats();
      expect(result.totalPayments).toBe(5);
      expect(result.totalRevenue).toBe(250);
      expect(result.totalHours).toBe(10);
      expect(result.revenueThisMonth).toBe(250);
      expect(result.averagePackageValue).toBe(300);
      expect(result.recentTransactions).toHaveLength(1);
    });

    it('should handle zero packages for average', async () => {
      transactionRepo.find.mockResolvedValue([]);
      transactionRepo.count.mockResolvedValue(0);
      packageRepo.findAll.mockResolvedValue([]);

      const result = await service.getPaymentStats();
      expect(result.averagePackageValue).toBe(0);
    });
  });
});
