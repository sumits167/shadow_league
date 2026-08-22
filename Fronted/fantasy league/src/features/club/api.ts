import { api } from "@/services/api";

export interface CreateClubPayload {
    name: string;
    description?: string;
    logoUrl?: string;
    isPrivate?: boolean;
    settings?: {
        maxLeagues?: number;
        allowPublicJoin?: boolean;
    };
}

export const clubApi = {
    getMyClubs: () => api.get("/api/v1/clubs"),
    getClubBySlug: (slug: string) => api.get(`/api/v1/clubs/${slug}`),
    createClub: (payload: CreateClubPayload) => api.post("/api/v1/clubs", payload),
    joinClub: (slug: string, inviteCode?: string) => api.post(`/api/v1/clubs/${slug}/join`, { inviteCode }),
    getClubMembers: (clubId: string) => api.get(`/api/v1/clubs/${clubId}/members`),
    removeClubMember: (clubId: string, targetUserId: string) => api.delete(`/api/v1/clubs/${clubId}/members/${targetUserId}`),
    updateClubMemberRole: (clubId: string, targetUserId: string, role: "admin" | "member") =>
        api.patch(`/api/v1/clubs/${clubId}/members/${targetUserId}`, { role }),
    updateClub: (clubId: string, payload: Partial<CreateClubPayload>) =>
        api.patch(`/api/v1/clubs/${clubId}`, payload),
    generateInviteCode: (clubId: string, expiresInHours: number = 24) =>
        api.post(`/api/v1/clubs/${clubId}/invite-code`, { expiresInHours }),
};
