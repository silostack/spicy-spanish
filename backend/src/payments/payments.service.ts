import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Package } from './entities/package.entity';
import { Transaction, TransactionStatus, PaymentMethod } from './entities/transaction.entity';
import { User, UserRole } from '../users/entities/user.entity';
import Stripe from 'stripe';

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

interface StripeCheckoutDto {
  packageId: string;
  studentId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CryptoCheckoutDto {
  packageId: string;
  studentId: string;
  successUrl: string;
  walletAddress?: string;
}

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: EntityRepository<Package>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    });
  }

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
    
    // Create a corresponding Stripe product and price
    const stripeProduct = await this.stripe.products.create({
      name: pkg.name,
      description: pkg.description,
      metadata: {
        hours: pkg.hours.toString(),
        packageId: pkg.id,
      },
    });
    
    const stripePrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(pkg.priceUsd * 100), // Convert to cents
      currency: 'usd',
    });
    
    // Store Stripe IDs in the package
    pkg['stripeProductId'] = stripeProduct.id;
    pkg['stripePriceId'] = stripePrice.id;
    
    await this.em.persistAndFlush(pkg);
    return pkg;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const pkg = await this.findPackageById(id);
    this.em.assign(pkg, updatePackageDto);
    
    // Update the corresponding Stripe product if it exists
    if (pkg['stripeProductId']) {
      await this.stripe.products.update(pkg['stripeProductId'], {
        name: pkg.name,
        description: pkg.description,
        active: pkg.isActive,
        metadata: {
          hours: pkg.hours.toString(),
        },
      });
      
      // If price changed, create a new price (Stripe doesn't allow updating prices)
      if (updatePackageDto.priceUsd && pkg['stripePriceId']) {
        const newPrice = await this.stripe.prices.create({
          product: pkg['stripeProductId'],
          unit_amount: Math.round(pkg.priceUsd * 100), // Convert to cents
          currency: 'usd',
        });
        
        // Deactivate the old price
        await this.stripe.prices.update(pkg['stripePriceId'], {
          active: false,
        });
        
        // Update the stored price ID
        pkg['stripePriceId'] = newPrice.id;
      }
    }
    
    await this.em.flush();
    return pkg;
  }

  async removePackage(id: string) {
    const pkg = await this.findPackageById(id);
    
    // Deactivate the Stripe product and price if they exist
    if (pkg['stripeProductId']) {
      await this.stripe.products.update(pkg['stripeProductId'], {
        active: false,
      });
    }
    
    if (pkg['stripePriceId']) {
      await this.stripe.prices.update(pkg['stripePriceId'], {
        active: false,
      });
    }
    
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

  // Stripe checkout methods
  async createStripeCheckoutSession(checkoutDto: StripeCheckoutDto) {
    const student = await this.userRepository.findOne({ 
      id: checkoutDto.studentId,
      role: UserRole.STUDENT 
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${checkoutDto.studentId} not found`);
    }
    
    const pkg = await this.packageRepository.findOne({ id: checkoutDto.packageId });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${checkoutDto.packageId} not found`);
    }
    
    if (!pkg.isActive) {
      throw new BadRequestException('This package is no longer available for purchase');
    }
    
    // Create a pending transaction
    const transaction = new Transaction(
      student,
      pkg.priceUsd,
      pkg.hours,
      PaymentMethod.CREDIT_CARD,
      TransactionStatus.PENDING,
      pkg
    );
    
    await this.em.persistAndFlush(transaction);
    
    // Get or create Stripe customer
    let stripeCustomerId = student['stripeCustomerId'];
    
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: student.email,
        name: student.fullName,
        metadata: {
          studentId: student.id,
        },
      });
      
      stripeCustomerId = customer.id;
      student['stripeCustomerId'] = stripeCustomerId;
      await this.em.flush();
    }
    
    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
            unit_amount: Math.round(pkg.priceUsd * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${checkoutDto.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: checkoutDto.cancelUrl,
      metadata: {
        transactionId: transaction.id,
        packageId: pkg.id,
        studentId: student.id,
      },
    });
    
    // Update transaction with session ID
    transaction.stripePaymentId = session.id;
    await this.em.flush();
    
    return {
      sessionId: session.id,
      sessionUrl: session.url,
      transactionId: transaction.id,
    };
  }

  async handleStripeWebhook(signature: string, payload: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      
      // Handle the event based on type
      switch (event.type) {
        case 'checkout.session.completed':
          return this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { received: true };
      }
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const transactionId = session.metadata?.transactionId;
    
    if (transactionId) {
      const transaction = await this.transactionRepository.findOne({ id: transactionId });
      
      if (transaction) {
        transaction.status = TransactionStatus.COMPLETED;
        transaction.invoiceUrl = session.invoice as string;
        await this.em.flush();
      }
    }
    
    return { success: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // This is typically handled via the checkout.session.completed event
    // But you can add additional logic here if needed
    return { success: true };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Find the associated transaction and mark it as failed
    const session = await this.stripe.checkout.sessions.retrieve(
      paymentIntent.metadata?.checkout_session_id
    );
    
    if (session && session.metadata?.transactionId) {
      const transaction = await this.transactionRepository.findOne({ 
        id: session.metadata.transactionId 
      });
      
      if (transaction) {
        transaction.status = TransactionStatus.FAILED;
        transaction.notes = `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`;
        await this.em.flush();
      }
    }
    
    return { success: true };
  }

  // Crypto checkout methods
  async createCryptoCheckout(checkoutDto: CryptoCheckoutDto) {
    const student = await this.userRepository.findOne({ 
      id: checkoutDto.studentId,
      role: UserRole.STUDENT 
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${checkoutDto.studentId} not found`);
    }
    
    const pkg = await this.packageRepository.findOne({ id: checkoutDto.packageId });
    if (!pkg) {
      throw new NotFoundException(`Package with ID ${checkoutDto.packageId} not found`);
    }
    
    if (!pkg.isActive) {
      throw new BadRequestException('This package is no longer available for purchase');
    }
    
    // Create a pending transaction
    const transaction = new Transaction(
      student,
      pkg.priceUsd,
      pkg.hours,
      PaymentMethod.CRYPTO,
      TransactionStatus.PENDING,
      pkg
    );
    
    // Set the wallet address for payment if provided
    const walletAddress = checkoutDto.walletAddress || process.env.DEFAULT_SOLANA_WALLET;
    
    if (walletAddress) {
      transaction.notes = `Payment to wallet: ${walletAddress}`;
    }
    
    await this.em.persistAndFlush(transaction);
    
    // This would be replaced with actual Solana integration
    // For now, return info needed for crypto payment
    return {
      transactionId: transaction.id,
      amountUsd: pkg.priceUsd,
      walletAddress: walletAddress,
      successUrl: `${checkoutDto.successUrl}?transaction_id=${transaction.id}`,
    };
  }

  // Manual payment completion (for crypto and other manual payments)
  async completeManualPayment(transactionId: string, cryptoTransactionId?: string) {
    const transaction = await this.findTransactionById(transactionId);
    
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(`Cannot complete transaction that is not in PENDING state`);
    }
    
    transaction.status = TransactionStatus.COMPLETED;
    
    if (cryptoTransactionId) {
      transaction.cryptoTransactionId = cryptoTransactionId;
    }
    
    await this.em.flush();
    return transaction;
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