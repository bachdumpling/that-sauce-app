// src/config/logger.ts
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l",
    },
  },
  level: "debug", // Force debug level for now to see all logs
});

// Test the logger
logger.debug("Logger initialized");
logger.info("Logger ready");
logger.error("Logger error test");

export default logger;