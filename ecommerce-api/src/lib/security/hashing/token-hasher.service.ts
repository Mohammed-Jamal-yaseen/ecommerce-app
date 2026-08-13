import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class TokenHasherService {
  async hash(token: string): Promise<string> {
    return argon2.hash(token, {
      type: argon2.argon2id,
      memoryCost: 16_384,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(token: string, tokenHash: string): Promise<boolean> {
    return argon2.verify(tokenHash, token);
  }
}
