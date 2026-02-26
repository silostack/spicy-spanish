import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { EntityManager, EntityRepository } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { User, UserRole } from "./entities/user.entity";
import {
  Transaction,
  TransactionStatus,
} from "../payments/entities/transaction.entity";
import { Appointment } from "../scheduling/entities/appointment.entity";
import * as bcrypt from "bcrypt";

interface StudentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  filter?: "all" | "active" | "inactive" | "new";
  tutorId?: string;
}

interface StudentWithDetails extends User {
  coursesEnrolled: number;
  availableHours: number;
  lastActive?: Date;
  assignedTutor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async findAll(role?: UserRole) {
    const criteria = role ? { role } : {};
    return this.userRepository.find(criteria, {
      orderBy: { createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ email });
  }

  async update(id: string, updateData: Partial<User>) {
    const user = await this.findOne(id);

    // Handle password update
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Handle email update - check for uniqueness
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException("Email already in use");
      }
    }

    this.em.assign(user, updateData);
    await this.em.flush();

    return user;
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.em.removeAndFlush(user);
    return { id, deleted: true };
  }

  async getStudents() {
    return this.findAll(UserRole.STUDENT);
  }

  async getTutors() {
    return this.findAll(UserRole.TUTOR);
  }

  async getAdmins() {
    return this.findAll(UserRole.ADMIN);
  }

  async countUsers() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, totalTutors, activeStudents, newUsersThisMonth] =
      await Promise.all([
        this.userRepository.count({ role: UserRole.STUDENT }),
        this.userRepository.count({ role: UserRole.TUTOR }),
        this.userRepository.count({
          role: UserRole.STUDENT,
        }),
        this.userRepository.count({
          role: UserRole.STUDENT,
          createdAt: { $gte: firstDayOfMonth },
        }),
      ]);

    return {
      totalStudents,
      totalTutors,
      activeStudents,
      newUsersThisMonth,
      total: totalStudents + totalTutors,
    };
  }

  async getStudentsWithPagination(query: StudentListQuery = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      filter = "all",
      tutorId,
    } = query;

    const offset = (page - 1) * limit;

    // Build base criteria
    const criteria: any = { role: UserRole.STUDENT };

    // Apply filters
    if (filter === "active") {
      criteria.isActive = true;
    } else if (filter === "inactive") {
      criteria.isActive = false;
    } else if (filter === "new") {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      criteria.createdAt = { $gte: firstDayOfMonth };
    }

    // Apply search
    if (search) {
      criteria.$or = [
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } },
        { email: { $ilike: `%${search}%` } },
      ];
    }

    // If tutorId is provided, filter by students assigned to that tutor
    let students;
    let total;

    if (tutorId) {
      // Get students that have had appointments with this tutor
      const appointments = await this.em.find(
        Appointment,
        { tutor: tutorId },
        { populate: ["students"] },
      );

      const studentIdSet = new Set<string>();
      for (const apt of appointments) {
        for (const s of apt.students.getItems()) {
          studentIdSet.add(s.id);
        }
      }
      const studentIds = Array.from(studentIdSet);

      if (studentIds.length > 0) {
        criteria.id = { $in: studentIds };
        [students, total] = await this.userRepository.findAndCount(criteria, {
          orderBy: { createdAt: "DESC" },
          limit,
          offset,
        });
      } else {
        students = [];
        total = 0;
      }
    } else {
      [students, total] = await this.userRepository.findAndCount(criteria, {
        orderBy: { createdAt: "DESC" },
        limit,
        offset,
      });
    }

    // Enrich students with additional details
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const [appointmentsCount, transactions, lastAppointment] =
          await Promise.all([
            this.em.count(Appointment, { students: student.id }),
            this.em.find(Transaction, {
              student: student.id,
              status: TransactionStatus.COMPLETED,
            }),
            this.em.findOne(
              Appointment,
              { students: student.id },
              { orderBy: { startTime: "DESC" } },
            ),
          ]);

        // Calculate available hours from transactions
        const availableHours = transactions.reduce(
          (total, t) => total + t.hours,
          0,
        );

        const enriched: StudentWithDetails = {
          ...student,
          coursesEnrolled: appointmentsCount,
          availableHours,
          lastActive: lastAppointment?.startTime,
        };

        return enriched;
      }),
    );

    const result = {
      items: enrichedStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return result;
  }

  async getStudentById(id: string) {
    const student = await this.userRepository.findOne({
      id,
      role: UserRole.STUDENT,
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Get detailed information
    const [transactions, appointments] = await Promise.all([
      this.em.find(Transaction, {
        student: id,
        status: TransactionStatus.COMPLETED,
      }),
      this.em.find(
        Appointment,
        { students: id },
        {
          populate: ["tutor", "course"],
          orderBy: { startTime: "DESC" },
          limit: 5,
        },
      ),
    ]);

    // Calculate hours
    const totalHoursPurchased = transactions.reduce(
      (total, t) => total + t.hours,
      0,
    );
    const hoursUsed = appointments
      .filter((a) => a.status === "completed")
      .reduce((total, a) => {
        const durationMs =
          new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
        return total + durationMs / (1000 * 60 * 60);
      }, 0);
    const availableHours = totalHoursPurchased - hoursUsed;

    return {
      ...student,
      transactions,
      recentAppointments: appointments,
      totalHoursPurchased,
      hoursUsed,
      availableHours,
    };
  }

  async getStudentsByTutorId(tutorId: string, query: StudentListQuery = {}) {
    // Verify tutor exists
    const tutor = await this.userRepository.findOne({
      id: tutorId,
      role: UserRole.TUTOR,
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor with ID ${tutorId} not found`);
    }

    return this.getStudentsWithPagination({ ...query, tutorId });
  }
}
