// Export all Trigger.dev tasks
import { registerTasks } from "@trigger.dev/sdk/v3";

export { imageAnalysisTask } from "./imageAnalysisTask";
export { videoAnalysisTask } from "./videoAnalysisTask";
export { projectAnalysisTask } from "./projectAnalysisTask";
export { portfolioAnalysisTask } from "./portfolioAnalysisTask";
export { scraperTask } from "./scraperTask";

registerTasks({
  imageAnalysisTask,
  videoAnalysisTask,
  projectAnalysisTask,
  portfolioAnalysisTask,
  scraperTask,
});
