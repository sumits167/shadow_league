import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import { useAuthStore } from "@/store/authStore";
import type { LoginPayload, RegisterPayload, VerifyCodePayload } from "../types";

export const useMe = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await authApi.me();
      if (res?.data) {
        setUser(res.data);
      }
      return res?.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCheckUsernameAvailability = (debouncedUsername: string) => {
  const isValidLength = debouncedUsername.trim().length >= 2;

  return useQuery({
    queryKey: ["auth", "check-username", debouncedUsername.trim().toLowerCase()],
    queryFn: async () => {
      const res = await authApi.checkUniqueUserName({ username: debouncedUsername.trim() });
      return res?.data?.isAvailable ?? false;
    },
    enabled: isValidLength,
    staleTime: 1000 * 30, // cache availability for 30s
    retry: false,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (res) => {
      if (res?.data?.user) {
        setUser(res.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useVerifyCode = () => {
  return useMutation({
    mutationFn: (payload: VerifyCodePayload) => authApi.verifyCode(payload),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
};
