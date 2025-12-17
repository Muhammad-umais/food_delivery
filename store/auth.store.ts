import { create } from "zustand";
import { getCurrentUser } from "@/lib/appwrite";
import { AppUser } from "@/type";

type AuthState = {
    isAuthenticated: boolean;
    user: AppUser | null;
    isLoading: boolean;
    fetchAuthenticatedUser: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,

    fetchAuthenticatedUser: async () => {
        set({ isLoading: true });

        try {
            const account = await getCurrentUser();

            if (account) {
                const user: AppUser = {
                    id: account.$id,
                    name: account.name,
                    email: account.email,
                    avatar: account.avatar ?? "",
                };

                set({ isAuthenticated: true, user });
            } else {
                set({ isAuthenticated: false, user: null });
            }
        } catch (e) {
            console.log("fetchAuthenticatedUser error", e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useAuthStore;
