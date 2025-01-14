import { UserModel } from "../models/UserModel";
import { User } from "@repo/types/User";

export class AuthService {
  async findOrCreateUser(email: string, googleId?: string): Promise<User> {
    let user = await UserModel.findOne({ email });

    if (!user && googleId) {
      user = await UserModel.create({
        email,
        google_id: googleId,
        role: "client",
        tier: "free",
        search_count: 0,
        max_searches: 10,
        onboarding_status: {
          completed: false,
          last_updated: new Date(),
        },
      });
    }

    if (!user) {
      throw new Error("User not found and could not be created");
    }

    return user;
  }

  async getUserById(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
