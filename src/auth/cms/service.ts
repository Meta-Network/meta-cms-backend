import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CMSAuthenticationService {
  constructor(private readonly jwtService: JwtService) {}

  public async managementJWTSign(user: string): Promise<{ token: string }> {
    const payload = { sub: user };
    const token = this.jwtService.sign(payload);
    return { token };
  }
}
