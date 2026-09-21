import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// API Router
app.use("/api", router);

// Serve React Frontend (artifacts/nutty-os/dist)
const possibleDistPaths = [
  path.resolve(process.cwd(), "artifacts/nutty-os/dist"),
  path.resolve(process.cwd(), "../nutty-os/dist"),
  path.resolve(__dirname, "../../nutty-os/dist"),
  path.resolve(__dirname, "../../../artifacts/nutty-os/dist"),
];

const frontendDist = possibleDistPaths.find((p) => fs.existsSync(p));

if (frontendDist) {
  logger.info({ frontendDist }, "[Express] Serving React frontend");

  // Serve static assets
  app.use(express.static(frontendDist));

  // SPA Catch-all Fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith(CLERK_PROXY_PATH)) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.warn("[Express] WARNING: Frontend dist directory was not found!");
}

export default app;