import userRoutes from "./userRoutes";
import creatorRoutes from "./creators";
import projectRoutes from "./projectRoutes";
import mediaRoutes from "./mediaRoutes";
import organizationRoutes from "./organizationRoutes";

export default function registerRoutes(app: Express) {
  app.use("/api/users", userRoutes);
  app.use("/api/creators", creatorRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/organizations", organizationRoutes);

  app.get("/", (req, res) => {
    res.json({ status: "UP", version: process.env.npm_package_version });
  });

  app.use((req, res, next) => {
    res.status(404).json({ error: "Not Found" });
  });
}
