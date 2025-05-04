// src/config/logger.ts
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

// Base logger options
const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || "debug",
  // To ensure error objects are serialized properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
};

// Add transport configuration only in non-production environments
if (!isProd) {
  loggerOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      errorLikeObjectKeys: ["err", "error"],
      translateTime: true,
      ignore: "pid,hostname",
    },
  };
}

const logger = pino(loggerOptions);

export default logger;
