import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/core';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy validating payload:', payload);
    
    if (!payload.sub) {
      console.error('Missing sub (user id) in JWT payload');
      return null;
    }
    
    const user = await this.em.findOne(User, { id: payload.sub });
    
    if (!user) {
      console.error(`User with id ${payload.sub} not found`);
      return null;
    }
    
    console.log('User found from token:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return user;
  }
}