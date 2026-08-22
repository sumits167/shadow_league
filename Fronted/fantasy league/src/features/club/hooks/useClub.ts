import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubApi, type CreateClubPayload } from "../api";

export const useMyClubs = () => {
  return useQuery({
    queryKey: ["clubs", "my-clubs"],
    queryFn: async () => {
      const res = await clubApi.getMyClubs();
      return res?.data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
};

export const useClubBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["clubs", slug],
    queryFn: async () => {
      const res = await clubApi.getClubBySlug(slug);
      return res?.data;
    },
    enabled: !!slug,
  });
};

export const useCreateClub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClubPayload) => clubApi.createClub(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", "my-clubs"] });
    },
  });
};

export const useJoinClub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, inviteCode }: { slug: string; inviteCode?: string }) =>
      clubApi.joinClub(slug, inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", "my-clubs"] });
    },
  });
};

export const useClubMembers = (clubId: string) => {
  return useQuery({
    queryKey: ["clubs", clubId, "members"],
    queryFn: async () => {
      if (!clubId) return [];
      const res = await clubApi.getClubMembers(clubId);
      return res?.data || [];
    },
    enabled: !!clubId,
  });
};

export const useRemoveClubMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, targetUserId }: { clubId: string; targetUserId: string }) =>
      clubApi.removeClubMember(clubId, targetUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", variables.clubId, "members"] });
    },
  });
};

export const useUpdateClubMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, targetUserId, role }: { clubId: string; targetUserId: string; role: "admin" | "member" }) =>
      clubApi.updateClubMemberRole(clubId, targetUserId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", variables.clubId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", "my-clubs"] });
    },
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, payload }: { clubId: string; payload: Partial<CreateClubPayload> }) =>
      clubApi.updateClub(clubId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", "my-clubs"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", variables.clubId] });
    },
  });
};

export const useGenerateClubInviteCode = () => {
  return useMutation({
    mutationFn: ({ clubId, expiresInHours }: { clubId: string; expiresInHours?: number }) =>
      clubApi.generateInviteCode(clubId, expiresInHours),
  });
};
