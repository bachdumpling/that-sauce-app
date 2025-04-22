import dotenv from "dotenv";

dotenv.config();
export const NODE_ENV = process.env.NODE_ENV;

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT;

export const SERVER_URL = process.env.SERVER_URL;
export const CLIENT_URL = process.env.CLIENT_URL;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
