import express from "express";
import { setupCors } from "../src/middleware/cors";
import { setupSecurity } from "../src/middleware/security";
import { PORT } from "../src/config/env";
import logger from "../src/config/logger";
import fileUpload from "express-fileupload";
import { supabase } from "../src/lib/supabase";
import { extractUser } from "../src/middleware/extractUser";

// Routes
import searchRouter from "../src/routes/search";
import mediaAnalysisRouter from "../src/routes/mediaAnalysis";
import adminRouter from "../src/routes/admin";
import projectRoutes from "../src/routes/projectRoutes";
import creatorsRouter from "../src/routes/creators";

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
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

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
app.use("/api/media", mediaAnalysisRouter);
app.use("/api/admin", adminRouter);
app.use("/api/projects", projectRoutes);
app.use("/api/creators", creatorsRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
