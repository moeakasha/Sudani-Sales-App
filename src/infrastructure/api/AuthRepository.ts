import type { User } from '../../domain/entities/User';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials';
import type { IAuthRepository } from '../../application/interfaces/IAuthRepository';
import { supabase } from '../supabase/client';

export class AuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Sign in with email and password using Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid credentials');
      }

      if (!data.user) {
        throw new Error('Login failed. No user data returned.');
      }

      // Get user metadata
      const userMetadata = data.user.user_metadata;
      const name = userMetadata?.full_name || userMetadata?.name || data.user.email?.split('@')[0] || 'User';

      return {
        id: data.user.id,
        email: data.user.email || credentials.email,
        name: name,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message || 'Logout failed');
      }
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during logout');
    }
  }
}

