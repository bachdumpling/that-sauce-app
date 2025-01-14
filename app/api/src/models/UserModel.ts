import mongoose from "mongoose";
import { User } from "@repo/types/User";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  role: {
    type: String,
    enum: ["client", "creator", "admin"],
    default: "client",
  },
  google_id: String,
  tier: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  search_count: { type: Number, default: 0 },
  max_searches: { type: Number, default: 10 },
  onboarding_status: {
    completed: { type: Boolean, default: false },
    last_updated: Date,
  },
});

export const UserModel = mongoose.model<User>("User", userSchema);
