// src/config/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transport: process.env.NODE_ENV === "development" 
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});

// Test the logger
logger.debug("Logger initialized");
logger.info("Logger ready");
logger.error("Logger error test");

export default logger;