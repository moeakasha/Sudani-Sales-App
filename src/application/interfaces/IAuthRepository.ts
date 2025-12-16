import type { User } from '../../domain/entities/User';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<User>;
  logout(): Promise<void>;
}

