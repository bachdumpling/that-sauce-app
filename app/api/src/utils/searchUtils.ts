// src/utils/searchUtils.ts
import { CreatorWithContent, MediaContent } from "../models/Search";

/**
 * Group search results by creator
 */
export function groupSearchResultsByCreator(
  results: any[]
): CreatorWithContent[] {
  // Group results by creator
  const creatorMap = new Map<string, CreatorWithContent>();

  results.forEach((item) => {
    const creatorId = item.creator_id;

    if (!creatorMap.has(creatorId)) {
      // Initialize a new creator entry
      creatorMap.set(creatorId, {
        profile: {
          id: item.creator_id,
          username: item.creator_username,
          location: item.creator_location,
          bio: item.creator_bio,
          primary_role: item.creator_primary_role,
          social_links: item.creator_social_links,
          work_email: item.creator_work_email,
        },
        score: item.creator_score,
        content: [],
      });
    }

    // Add content to the creator
    creatorMap.get(creatorId)!.content.push({
      id: item.content_id,
      type: item.content_type,
      url: item.content_url,
      title: item.content_title || "",
      description: item.content_description,
      score: item.content_score,
      project_id: item.project_id,
      project_title: item.project_title,
      youtube_id: item.youtube_id,
      vimeo_id: item.vimeo_id,
    });
  });

  // Convert to array and sort by creator score
  const creatorArray = Array.from(creatorMap.values());

  // Sort creators by their score
  creatorArray.sort((a, b) => b.score - a.score);

  // Sort content within each creator by score
  creatorArray.forEach((creator) => {
    creator.content.sort((a, b) => b.score - a.score);
  });

  return creatorArray;
}
