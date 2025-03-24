"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Video,
  FilterX,
  Upload,
  Filter,
  ArrowUpRight,
  Sparkles,
  Loader2,
  RotateCcw,
  Info,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { useRouter, useSearchParams } from "next/navigation";
import { search, enhanceSearchPrompt } from "@/lib/api/search";
import { CreatorCard } from "@/components/shared/creator-card";
import { SearchResult } from "@/components/shared/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { DropzoneInput } from "@/components/ui/dropzone-input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import * as React from "react";

interface SearchResults {
  success: boolean;
  data: {
    results: SearchResult[];
    page: number;
    limit: number;
    total: number;
    content_type: "all" | "videos" | "images";
  };
}


interface RefinementQuestion {
  question: string;
  options: string[];
}

interface SearchEnhancement {
  success: boolean;
  data: {
    original_query: string;
    enhancement: RefinementQuestion[];
  };
}

interface SearchClientWrapperProps {
  initialQuery: string;
  initialContentType: "all" | "videos" | "images";
  initialRole: string;
  exampleQueries: string[];
  talentRoles: string[];
}

// Role-specific example prompts
const ROLE_SPECIFIC_PROMPTS: Record<string, string[]> = {
  Director: [
    "minimalist and monochromatic director who specializes in 35mm film cameras",
    "director with experience in narrative-driven commercials with emotional storytelling",
    "experimental film director with a focus on surreal and dreamlike visuals",
  ],
  Photographer: [
    "fashion photographer experienced in high-contrast black and white editorials",
    "documentary photographer with experience capturing authentic moments in remote locations",
    "product photographer specializing in luxury jewelry with dramatic lighting",
  ],
  Cinematographer: [
    "cinematographer with experience in handheld, naturalistic lighting for indie films",
    "cinematographer who specializes in anamorphic lenses and widescreen compositions",
    "cinematographer with experience shooting moody, atmospheric night scenes with minimal lighting",
  ],
  "Motion Designer": [
    "motion designer specializing in bold, geometric animations with vibrant colors",
    "3D motion designer with experience in abstract, fluid simulations",
    "motion designer focusing on typography-driven animations for brand campaigns",
  ],
  "Graphic Designer": [
    "graphic designer with a clean, minimalist aesthetic and strong typography skills",
    "brand identity designer with experience in luxury fashion and beauty industries",
    "editorial graphic designer with a bold, experimental approach to layouts",
  ],
  Illustrator: [
    "illustrator with a whimsical, character-driven style for children's content",
    "digital illustrator specializing in detailed, realistic portraits with vibrant colors",
    "conceptual illustrator with experience in editorial and publishing work",
  ],
  "Art Director": [
    "art director with experience in high-end fashion campaigns and editorial shoots",
    "art director specializing in immersive retail experiences and visual merchandising",
    "art director with a strong background in digital campaigns for luxury brands",
  ],
  "Creative Director": [
    "creative director with experience developing cohesive brand identities for startups",
    "creative director specializing in innovative, sustainable packaging design",
    "creative director with a background in interactive digital experiences and installations",
  ],
  "3D Artist": [
    "3D artist specializing in hyperrealistic product visualizations with dramatic lighting",
    "character-focused 3D artist with a stylized, animated aesthetic",
    "architectural 3D artist with experience in photorealistic interior and exterior renderings",
  ],
  "UI/UX Designer": [
    "UI/UX designer with experience in creating minimal, intuitive interfaces for mobile apps",
    "UI designer specializing in data visualization and complex dashboard design",
    "UX designer focusing on accessibility and inclusive design principles",
  ],
  "Web Designer": [
    "web designer with expertise in responsive, content-first layouts with minimal aesthetics",
    "e-commerce focused web designer with experience in luxury retail websites",
    "interactive web designer specializing in immersive, experimental web experiences",
  ],
  "Fashion Designer": [
    "sustainable fashion designer specializing in upcycled materials and zero-waste patterns",
    "avant-garde fashion designer with architectural, sculptural garment construction",
    "fashion designer focusing on gender-neutral streetwear with artistic prints",
  ],
  "Product Designer": [
    "product designer with experience in minimalist, functional furniture design",
    "consumer tech product designer specializing in sustainable materials and manufacturing",
    "packaging designer focusing on innovative, eco-friendly solutions for food and beverage",
  ],
  "VFX Artist": [
    "VFX artist specializing in photo-realistic environment extensions and set modifications",
    "creature and character VFX artist with experience in motion capture integration",
    "VFX artist focusing on dynamic simulations like fire, water, and destruction effects",
  ],
  "Video Editor": [
    "narrative-driven video editor with experience in documentary and commercial work",
    "fast-paced editor specializing in dynamic social media content with graphic overlays",
    "video editor with expertise in color grading and visual effects integration",
  ],
  "Sound Designer": [
    "sound designer with experience creating immersive audio environments for documentaries",
    "experimental sound designer specializing in abstract, textural soundscapes",
    "sound designer focusing on realistic sound effects and foley for commercials",
  ],
  Animator: [
    "2D animator with a hand-drawn, illustrative style for explainer videos",
    "stop-motion animator specializing in tactile, textural animation with mixed media",
    "character animator with experience in expressive, personality-driven animation",
  ],
  "Production Designer": [
    "production designer with experience in creating stylized, period-accurate sets",
    "minimalist production designer specializing in contemporary, architectural spaces",
    "production designer focusing on immersive, fantastical environments for commercials",
  ],
  "Set Designer": [
    "set designer with experience in creating bold, colorful installations for fashion shoots",
    "architectural set designer specializing in clean, geometric compositions",
    "experiential set designer focusing on interactive, tactile environments",
  ],
  Stylist: [
    "fashion stylist with experience in editorial and high-fashion campaigns",
    "prop stylist specializing in food photography with a clean, minimal aesthetic",
    "wardrobe stylist focusing on sustainable fashion and vintage sourcing",
  ],
  "Makeup Artist": [
    "editorial makeup artist specializing in bold, avant-garde looks for fashion",
    "SFX makeup artist with experience in creature design and prosthetics",
    "beauty makeup artist focusing on natural, glowing skin and subtle enhancements",
  ],
  "Storyboard Artist": [
    "storyboard artist with experience in dynamic action sequences for commercials",
    "conceptual storyboard artist specializing in visual storytelling for brand narratives",
    "detailed storyboard artist focusing on mood and lighting for cinematic directors",
  ],
};

// Default prompts for any role not specifically defined
const DEFAULT_PROMPTS = [
  "creative with a minimal, monochromatic style who specializes in brand identity",
  "experienced professional focusing on vibrant, colorful compositions with bold typography",
  "innovative artist with a focus on sustainable and eco-friendly project approaches",
];

// Subject categories for refinement
const SUBJECT_CATEGORIES = [
  "Fashion",
  "Editorial",
  "Commercial",
  "Documentary",
  "Product",
  "Portrait",
  "Wedding",
  "Travel",
  "Landscape",
  "Food",
  "Sports",
  "Architecture",
];

export function SearchClientWrapper({
  initialQuery,
  initialContentType,
  initialRole,
  exampleQueries,
  talentRoles,
}: SearchClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideosOnly, setShowVideosOnly] = useState(
    initialContentType === "videos"
  );
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [filesUploaded, setFilesUploaded] = useState<File[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [isRefinementOpen, setIsRefinementOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [isRefinementLoading, setIsRefinementLoading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [refinementEnhancement, setRefinementEnhancement] = useState<
    RefinementQuestion[]
  >([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Perform initial search if query and role are provided
  useEffect(() => {
    if (initialQuery && initialRole) {
      performSearch(initialQuery, initialContentType, initialRole);
    }
  }, [initialQuery, initialContentType, initialRole]);

  const handleExampleClick = (query: string) => {
    setSearchQuery(query);
  };

  const performSearch = async (
    query: string,
    contentType: "all" | "videos" | "images",
    role: string,
    subjects: string[] = []
  ) => {
    if (!query.trim() || !role) return;

    setIsLoading(true);
    try {
      const data = await search({
        q: query,
        contentType,
        limit,
        page,
        role,
        subjects,
      });
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrl = (
    query: string,
    contentType: "all" | "videos" | "images",
    role: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    params.set("role", role);

    if (contentType === "videos") {
      params.set("content_type", "videos");
    } else if (contentType === "images") {
      params.set("content_type", "images");
    } else {
      params.delete("content_type");
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = () => {
    if (selectedRole && searchQuery.trim()) {
      // Instead of performing search directly, navigate to results page
      const params = new URLSearchParams();
      params.set("q", searchQuery);
      params.set("role", selectedRole);

      // Set content type
      if (mediaFilter !== "all") {
        params.set("content_type", mediaFilter);
      }

      // Add selected subjects if any
      if (selectedSubjects.length > 0) {
        params.set("subjects", selectedSubjects.join(","));
      }

      // Add selected styles if any
      if (selectedStyles.length > 0) {
        params.set("styles", selectedStyles.join(","));
      }

      // Add documentation info if any
      if (filesUploaded.length > 0) {
        params.set("has_docs", "true");
        params.set("docs_count", filesUploaded.length.toString());
      }

      params.set("limit", limit.toString());
      params.set("page", "1");

      router.push(`/search/results?${params.toString()}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults(null);
    router.push("/search");
  };

  const handleToggleVideosOnly = (pressed: boolean) => {
    setShowVideosOnly(pressed);
    if (searchQuery && selectedRole) {
      performSearch(searchQuery, pressed ? "videos" : "all", selectedRole);
      updateUrl(searchQuery, pressed ? "videos" : "all", selectedRole);
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);

    // Clear refinements and prepare for new search with selected role
    setSelectedSubjects([]);
    setShowVideosOnly(false);
    setMediaFilter("all");
    setFilesUploaded([]);
    setSearchQuery("");
    setResults(null);
    setIsRefining(false);

    // Update URL to reflect the role change without any query
    const params = new URLSearchParams();
    params.set("role", role);
    router.push(`/search?${params.toString()}`);
  };

  const handleFilesSelected = (files: File[]) => {
    setFilesUploaded(files);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...filesUploaded];
    newFiles.splice(index, 1);
    setFilesUploaded(newFiles);
  };

  const handleLimitChange = (newLimit: string) => {
    const limitValue = parseInt(newLimit, 10);
    setLimit(limitValue);
    if (searchQuery && selectedRole) {
      performSearch(
        searchQuery,
        showVideosOnly ? "videos" : "all",
        selectedRole
      );
    }
  };

  const handleMediaFilterChange = (newMediaFilter: string) => {
    setMediaFilter(newMediaFilter);
    if (searchQuery && selectedRole) {
      performSearch(
        searchQuery,
        newMediaFilter === "videos" ? "videos" : "all",
        selectedRole
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (searchQuery && selectedRole) {
      performSearch(
        searchQuery,
        showVideosOnly ? "videos" : "all",
        selectedRole
      );
    }
  };

  // Get example prompts for the selected role
  const getRoleExamples = (role: string) => {
    return ROLE_SPECIFIC_PROMPTS[role] || DEFAULT_PROMPTS;
  };

  const handleRefinementClick = async () => {
    if (!searchQuery.trim()) return;

    setIsRefinementLoading(true);
    try {
      const response = await enhanceSearchPrompt({ query: searchQuery });

      if (response.success && response.data.enhancement) {
        setRefinementEnhancement(response.data.enhancement);
        setIsRefining(true);

        // Reset selected options instead of initializing with first option
        setSelectedOptions({});
        // Reset styles to ensure we don't have any previous selections
        setSelectedStyles([]);
      }
    } catch (error) {
      console.error("Error enhancing search prompt:", error);
    } finally {
      setIsRefinementLoading(false);
    }
  };

  const handleOptionSelect = (question: string, option: string) => {
    let newOptions = { ...selectedOptions };

    // Check if the option is already selected
    if (selectedOptions[question] === option) {
      // If selected, unselect it
      delete newOptions[question];
    } else {
      // If not selected or different option selected, select it
      newOptions = {
        ...newOptions,
        [question]: option,
      };
    }

    setSelectedOptions(newOptions);

    // Automatically apply refinements when options are selected/deselected
    const styles = Object.values(newOptions);
    setSelectedStyles(styles);
  };

  const handleNextQuestion = () => {
    if (refinementEnhancement.length > currentQuestionIndex + 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Cycle back to the first question
      setCurrentQuestionIndex(0);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleResetSubjects = () => {
    setSelectedSubjects([]);
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          What kind of talent are you looking for?
        </h2>
        <div className="flex flex-wrap gap-2">
          {talentRoles.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => handleRoleSelect(role)}
              className={selectedRole === role ? "bg-black text-white" : ""}
            >
              {role}
            </Button>
          ))}
          <Button variant="outline" className="gap-1">
            More <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <div className="space-y-4">
        <div className="relative">
          <h2 className="text-xl font-semibold mb-3">Tell us the specifics</h2>
          <div className="relative">
            <textarea
              className="w-full pl-6 pr-6 py-4 h-28 border rounded-md resize-none text-base"
              placeholder={
                selectedRole
                  ? getRoleExamples(selectedRole)[0]
                  : "Select a role first"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedRole}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Display selected refinement options */}
          {selectedStyles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-500 mr-1">Refinements:</span>
              {selectedStyles.map((style, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  size="sm"
                  className="bg-gray-100 hover:bg-gray-200 text-sm font-normal h-7 px-2 py-0 rounded-full"
                  onClick={() => {
                    // Find and remove the corresponding option
                    const questionToRemove = Object.entries(
                      selectedOptions
                    ).find(([_, value]) => value === style);
                    if (questionToRemove) {
                      const newOptions = { ...selectedOptions };
                      delete newOptions[questionToRemove[0]];
                      setSelectedOptions(newOptions);
                      setSelectedStyles(Object.values(newOptions));
                    }
                  }}
                >
                  {style} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedStyles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 py-0 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setSelectedOptions({});
                    setSelectedStyles([]);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}

          <div className="absolute right-0 -top-2 flex items-center gap-2">
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    filesUploaded.length > 0
                      ? "border-blue-500 text-blue-500 hover:text-blue-600 hover:border-blue-600"
                      : ""
                  }
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {filesUploaded.length > 0
                    ? `${filesUploaded.length} document${filesUploaded.length > 1 ? "s" : ""}`
                    : "Add Inspo"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Inspiration</DialogTitle>
                  <DialogDescription>
                    Upload documents or images that will help us understand your
                    creative needs better.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-sm">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">What we can process:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Images in JPG, PNG format (.jpg, .jpeg, .png)</li>
                        <li>PDF documents (.pdf)</li>
                        <li>Word documents (.doc, .docx)</li>
                        <li>Maximum 5 files, up to 5MB each</li>
                      </ul>
                    </div>
                  </div>

                  {filesUploaded.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">
                        Currently Uploaded ({filesUploaded.length}/5):
                      </h4>
                      <ul className="space-y-2 max-h-32 overflow-y-auto bg-muted/20 rounded-md p-2">
                        {filesUploaded.map((file, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center text-sm p-1.5 bg-white rounded border"
                          >
                            <div className="flex items-center overflow-hidden">
                              <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                              <span className="truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">
                                Remove {file.name}
                              </span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <DropzoneInput
                    onFilesSelected={handleFilesSelected}
                    acceptedFileTypes={{
                      "image/jpeg": [".jpg", ".jpeg"],
                      "image/png": [".png"],
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        [".docx"],
                    }}
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant="default"
                      disabled={filesUploaded.length === 0}
                      onClick={() => {
                        // Here you could also trigger processing of the files
                      }}
                    >
                      Apply{" "}
                      {filesUploaded.length > 0 && `(${filesUploaded.length})`}
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Refinement Section */}
        {isRefining && searchQuery && (
          <div className="mt-6 bg-slate-50 rounded-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Refining your search{" "}
                <span className="inline-block ml-1">✨</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRefining(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {refinementEnhancement.length > 0 ? (
              <div>
                <h4 className="text-base font-medium mb-3">
                  {refinementEnhancement[currentQuestionIndex].question}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {refinementEnhancement[currentQuestionIndex].options.map(
                    (option) => (
                      <Button
                        key={option}
                        variant={
                          selectedOptions[
                            refinementEnhancement[currentQuestionIndex].question
                          ] === option
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleOptionSelect(
                            refinementEnhancement[currentQuestionIndex]
                              .question,
                            option
                          )
                        }
                        className={
                          selectedOptions[
                            refinementEnhancement[currentQuestionIndex].question
                          ] === option
                            ? "bg-black text-white"
                            : ""
                        }
                      >
                        {option}
                        {selectedOptions[
                          refinementEnhancement[currentQuestionIndex].question
                        ] === option && <X className="h-4 w-4 ml-2" />}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed"
                    onClick={handleNextQuestion}
                  >
                    Another question <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        {searchQuery && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2 px-4"
              disabled={isRefinementLoading}
              onClick={handleRefinementClick}
            >
              {isRefinementLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Refining...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Refine Search
                </>
              )}
            </Button>

            <Button
              onClick={handleSearch}
              className="px-6 bg-black"
              disabled={isLoading || !searchQuery.trim() || !selectedRole}
            >
              {isLoading ? "Searching..." : "Search Now (over 180+ creators)"}
            </Button>
          </div>
        )}
      </div>

      {/* Example Queries for Selected Role */}
      {selectedRole && !searchQuery && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground px-1">
            Try searching for:
          </p>
          <div className="flex flex-wrap gap-2">
            {getRoleExamples(selectedRole).map((query, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-sm bg-secondary/50"
                onClick={() => handleExampleClick(query)}
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
