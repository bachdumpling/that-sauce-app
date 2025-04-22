import express from "express";
import { setupCors } from "../src/middleware/cors";
import { setupSecurity } from "../src/middleware/security";
import { PORT } from "../src/config/env";
import logger from "../src/config/logger";
import { supabase } from "../src/lib/supabase";
import { extractUser } from "../src/middleware/extractUser";

// Routes
import searchRouter from "../src/routes/searchRoutes";
import adminRouter from "../src/routes/admin";
import projectRoutes from "../src/routes/projectRoutes";
import creatorsRouter from "../src/routes/creators";
import profileRouter from "../src/routes/profile";
import mediaRoutes from "../src/routes/mediaRoutes";
import portfolioRoutes from "../src/routes/portfolioRoutes";
import organizationRoutes from "../src/routes/organizationRoutes";
import analysisRoutes from "../src/routes/analysisRoutes";

// Add this import
import scraperRoutes from "../src/routes/scraperRoutes";

// Middleware
import { errorHandler } from "../src/middleware/errorHandler";

const app = express();
const port = PORT || 8000;

// Set timeout for long-running requests (10 minutes)
app.use((req, res, next) => {
  // Only set long timeout for media analysis endpoint
  if (req.path.includes("/api/media/analyze")) {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
  }
  next();
});

// Setup middleware
setupCors(app);
setupSecurity(app);
app.use(express.json());

// Apply extractUser middleware globally
app.use(extractUser);

logger.info({
  msg: "Starting server with configuration",
  config: {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    clientUrl: process.env.CLIENT_URL,
    port: process.env.PORT || 8000,
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

// Routes
app.use("/api/search", searchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/projects", projectRoutes);
app.use("/api/creators", creatorsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/media", mediaRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/scraper", scraperRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/analysis", analysisRoutes);
// Error handling middleware
app.use(errorHandler);

try {
  console.log("ENV CHECK", {
    triggerKey: process.env.TRIGGER_API_KEY,
    triggerId: process.env.TRIGGER_CLIENT_ID,
  });

  const result = await tasks.trigger<typeof myTask>("my-task", { url });

  console.log("Triggered:", result);
} catch (error) {
  console.error("Error triggering scraper task:", error);
}

// Start server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
