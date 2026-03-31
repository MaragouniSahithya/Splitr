import { create } from "zustand";

const useGroupStore = create((set) => ({
  groups: [],
  currentGroup: null,
  invites: [],
  loading: false,

  setGroups: (groups) => set({ groups }),
  setCurrentGroup: (currentGroup) => set({ currentGroup }),
  setInvites: (invites) => set({ invites }),
  setLoading: (loading) => set({ loading }),
}));

export default useGroupStore;
