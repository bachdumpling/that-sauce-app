// src/config/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      errorLikeObjectKeys: ["err", "error"], // Recognize objects with these keys as errors
      translateTime: true,
      ignore: "pid,hostname", // Hide less useful fields
    },
  },
  // To ensure error objects are serialized properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

// Test the logger
logger.debug("Logger initialized");
logger.info("Logger ready");
logger.error("Logger error test");

// Test with error object
logger.error(new Error("Test error object"));

// Test with detailed object
logger.error({
  msg: "Error with detailed object",
  error: new Error("Nested error message"),
});

export default logger;
