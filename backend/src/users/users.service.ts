import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async findAll(role?: UserRole) {
    const criteria = role ? { role } : {};
    return this.userRepository.find(criteria, {
      orderBy: { createdAt: 'DESC' },
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
        throw new ConflictException('Email already in use');
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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalStudents, 
      totalTutors, 
      activeStudents,
      newUsersThisMonth
    ] = await Promise.all([
      this.userRepository.count({ role: UserRole.STUDENT }),
      this.userRepository.count({ role: UserRole.TUTOR }),
      this.userRepository.count({ 
        role: UserRole.STUDENT,
        // lastActive: { $gte: thirtyDaysAgo }
      }),
      this.userRepository.count({
        role: UserRole.STUDENT,
        createdAt: { $gte: firstDayOfMonth }
      })
    ]);
    
    return {
      totalStudents,
      totalTutors,
      activeStudents,
      newUsersThisMonth,
      total: totalStudents + totalTutors,
    };
  }
}