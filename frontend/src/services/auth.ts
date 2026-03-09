/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import api from '../utils/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  preferences?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.register(data);
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.login(data);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await api.getMe();
    return response.data.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.updateProfile(data);
    return response.data.user;
  }

  /**
   * Logout user (client-side only)
   */
  logout(): void {
    api.removeToken();
  }
}

export const authService = new AuthService();
export default authService;

