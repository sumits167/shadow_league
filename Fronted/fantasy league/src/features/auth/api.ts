import { api } from "@/services/api";
import type {
  ApiResponse,
  AuthSuccessData,
  CheckUniqueUserNamePayload,
  CheckUsernameResponse,
  LoginPayload,
  RegisterPayload,
  RegisterSuccessData,
  User,
  VerifyCodePayload
} from "./types";

export const authApi = {
  me: (): Promise<ApiResponse<User>> =>
    api.get("/api/v1/auth/me"),

  login: (payload: LoginPayload): Promise<ApiResponse<AuthSuccessData>> =>
    api.post("/api/v1/auth/login", payload),

  register: (payload: RegisterPayload): Promise<ApiResponse<RegisterSuccessData>> =>
    api.post("/api/v1/auth/register", payload),

  checkUniqueUserName: (payload: CheckUniqueUserNamePayload): Promise<ApiResponse<CheckUsernameResponse>> =>
    api.post("/api/v1/auth/checkUniqueUserName", payload),

  checkEmailUnique: (payload: { email: string }): Promise<ApiResponse<{ isAvailable: boolean }>> =>
    api.post("/api/v1/auth/checkEmailUnique", payload),

  verifyCode: (payload: VerifyCodePayload): Promise<ApiResponse<object>> =>
    api.post("/api/v1/auth/verifyCode", payload),

  logout: (): Promise<ApiResponse<object>> =>
    api.post("/api/v1/auth/logout", {}),
};