export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export type AuthRequestContext = {
  ip?: string;
  userAgent?: string;
};

export type AuthPasswordUser = AuthUser & {
  passwordHash: string;
};
