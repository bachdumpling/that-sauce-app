import express from "express";
import { setupCors } from "./middleware/cors";
import { setupSecurity } from "./middleware/security";
import { PORT } from "./config/env";
import logger from "./config/logger";
import supabase from "./lib/supabase";

const app = express();
const port = PORT || 8000;

// Setup middleware
setupCors(app);
setupSecurity(app);
app.use(express.json());

logger.info({
  msg: "Starting server with configuration",
  config: {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    clientUrl: process.env.CLIENT_URL,
    port: process.env.PORT || 4000,
  },
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .limit(2);

    if (error) {
      logger.error("Database connection test failed:", error);
      return res.status(500).json({ error: "Failed to connect to database" });
    }

    logger.info("Successfully connected to database");
    res.json({ message: "Database connection successful", data });
  } catch (error) {
    logger.error("Unexpected error during database test:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
