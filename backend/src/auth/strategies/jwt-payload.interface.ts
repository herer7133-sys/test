export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  partyId?: number;
}
