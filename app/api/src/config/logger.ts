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

export default logger;
