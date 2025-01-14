import { ObjectId } from "mongodb";
import { Timestamp } from "./Base";

// User Types
export interface OnboardingStatus {
  completed: boolean;
  last_updated: Date;
}

export interface User extends Timestamp {
  _id: ObjectId;
  email: string;
  first_name: string;
  last_name: string;
  role: "client" | "creator" | "admin";
  google_id?: string;
  tier: "free" | "pro" | "enterprise";
  search_count: number;
  max_searches: number;
  last_login_at: Date;
  onboarding_status: OnboardingStatus;
}
