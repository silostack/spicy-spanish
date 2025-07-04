import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Debug logs
    console.log('RolesGuard checking roles:');
    console.log('Required roles:', requiredRoles);
    console.log('User from request:', user);
    
    if (!user) {
      console.log('No user object in request');
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('User has required role:', hasRole);
    
    return hasRole;
  }
}