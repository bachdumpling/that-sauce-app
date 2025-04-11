import { SearchClientWrapper } from "./components/search-client-wrapper";
import { createClient } from "@/utils/supabase/client";

const EXAMPLE_QUERIES = [
  "high fashion photographers with female models in fashion, in studio",
  "graphic designer with glitchy vaporwave aesthetics",
  "photographers experienced in film street style, cityscapes, architecture",
  "landscape photographer in the mountains",
  "product photographer in a studio",
];

const TALENT_ROLES = [
  "Director",
  "Photographer",
  "Cinematographer",
  "Motion Designer",
  "Illustrator",
  "Graphic Designer",
  "Video Editor",
  "VFX Artist",
  "3D Artist",
  "UI/UX Designer",
  "Art Director",
  "Creative Director",
  "Web Designer",
  "Product Designer",
  "Animator",
  "Sound Designer",
  "Fashion Designer",
  "Stylist",
  "Makeup Artist",
  "Set Designer",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; content_type?: string; role?: string };
}) {
  // Ensure searchParams is properly awaited
  const params = await Promise.resolve(searchParams);
  const initialQuery = params.q || "";
  const initialContentType =
    params.content_type === "videos" ? "videos" : "all";
  const initialRole = params.role || "";

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
  } catch (error) {
    console.error("Error checking if user is owner:", error);
  }

  return (
    <div className="container">
      <SearchClientWrapper
        initialQuery={initialQuery}
        initialContentType={initialContentType as "all" | "videos"}
        initialRole={initialRole}
        exampleQueries={EXAMPLE_QUERIES}
        talentRoles={TALENT_ROLES}
      />
    </div>
  );
}
