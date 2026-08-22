export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "manager" | "admin";
  avatarUrl?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface CheckUniqueUserNamePayload {
  username: string;
}

export interface CheckUsernameResponse {
  isAvailable: boolean;
}

export interface VerifyCodePayload {
  username: string;
  code: string;
}

export interface AuthSuccessData {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface RegisterSuccessData {
  user: User;
  verificationCode?: string;
}
