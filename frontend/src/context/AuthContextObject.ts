import { createContext } from 'react';
import type { User } from '../services/authApi';

export type SavedAccount = {
  username: string;
  fullName?: string;
  lastLogin: string;
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
  savedAccounts: SavedAccount[];
  switchAccount: (username: string, password: string) => Promise<void>;
  removeAccount: (username: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
