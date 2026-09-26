import jwt from "jsonwebtoken";

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) ?? "30d",
  });
}

export function verifyToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as { userId: string };
}
