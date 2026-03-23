import {
  getSession,
  handleAuthRequest,
  signOut,
} from "./services/auth-core.service";
import { signInEmail } from "./services/auth-sign-in.service";
import {
  listOwnSessions,
  revokeOtherSessions,
  revokeSession,
} from "./services/auth-session.service";
import { changePassword } from "./services/auth-password.service";
import type { ChangePasswordInput } from "./auth.schema";

export class AuthService {
  static handle(request: Request) {
    return handleAuthRequest(request);
  }

  static async signInEmail(request: Request) {
    return signInEmail(request);
  }

  static async signOut(request: Request) {
    return signOut(request);
  }

  static async getSession(request: Request) {
    return getSession(request);
  }

  static async listOwnSessions(request: Request) {
    return listOwnSessions(request);
  }

  static async revokeOtherSessions(request: Request) {
    return revokeOtherSessions(request);
  }

  static async revokeSession(request: Request) {
    return revokeSession(request);
  }

  static async changePassword(request: Request, payload: ChangePasswordInput) {
    return changePassword(request, payload);
  }
}
