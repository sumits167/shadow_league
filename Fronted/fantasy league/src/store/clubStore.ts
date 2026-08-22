import { create } from 'zustand';

export interface Club {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate?: boolean;
  inviteCode?: string;
  userRole?: string;
  ownerId?: string;
  createdAt?: string;
}

interface ClubState {
  activeClub: Club | null;
  setActiveClub: (club: Club | null) => void;
  clearActiveClub: () => void;
}

const STORAGE_KEY = 'shadowleague_active_club';

const getInitialClub = (): Club | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useClubStore = create<ClubState>((set) => ({
  activeClub: getInitialClub(),
  setActiveClub: (club) => {
    try {
      if (club) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(club));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    set({ activeClub: club });
  },
  clearActiveClub: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ activeClub: null });
  },
}));
