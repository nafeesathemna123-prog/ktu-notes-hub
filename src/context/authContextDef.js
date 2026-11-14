import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  adminProfile: null,
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

