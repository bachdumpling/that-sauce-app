import CreatorWorkCard from "./components/creator-work-card";
import { getRandomCreatorsWithLatestWork } from "@/actions/creator-actions";

export const dynamic = "force-dynamic"; // Make sure this page is not statically generated
export const revalidate = 3600; // Revalidate every hour

export default async function FeedPage() {
  // Fetch random creators with their latest work
  const creatorsWithProjects = await getRandomCreatorsWithLatestWork(50);

  return (
    <div className="">
      <h1 className="text-4xl font-bold mb-6">Browse Latest Work</h1>

      {/* Masonry grid of creator work */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-8 space-y-8">
        {creatorsWithProjects.length > 0 ? (
          creatorsWithProjects.map(({ creator, project }) => (
            <CreatorWorkCard
              key={`${creator.id}-${project.id}`}
              creator={creator}
              project={project}
              isNew={creator.isNew}
            />
          ))
        ) : (
          <p className="text-muted-foreground">
            No creator works found. Check back soon for new content!
          </p>
        )}
      </div>
    </div>
  );
}
