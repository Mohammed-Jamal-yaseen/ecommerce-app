import { Injectable } from '@nestjs/common';

@Injectable()
export class ArcjetService {
  check(): Promise<boolean> {
    // await void(),
    return Promise.resolve(true);
  }
}
