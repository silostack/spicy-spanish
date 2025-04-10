import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async getDashboardStats() {
    // Get stats from all services in parallel
    const [userCounts, paymentStats, courseStats] = await Promise.all([
      this.usersService.countUsers(),
      this.paymentsService.getPaymentStats(),
      this.coursesService.getCourseStats(),
    ]);

    // Return aggregated stats
    return {
      users: userCounts,
      payments: paymentStats,
      courses: courseStats,
    };
  }
}