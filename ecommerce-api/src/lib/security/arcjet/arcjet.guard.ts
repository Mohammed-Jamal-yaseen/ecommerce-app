import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ArcjetGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    void context;
    return true;
  }
}
