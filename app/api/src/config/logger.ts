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
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
});

export default logger;
