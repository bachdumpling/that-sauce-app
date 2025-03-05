import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X, ArrowLeft, ExternalLink } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { fetchCreatorDetails, rejectCreator } from "@/lib/api/admin";
import { VimeoEmbed } from "@/components/VimeoEmbed";
import { toast } from "sonner";

const CreatorDetailPage = ({ params }) => {
  const unwrappedParams = use(params);
  const creatorId = unwrappedParams?.id;
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState(null);
  const router = useRouter();

  // Fetch creator details from API
  useEffect(() => {
    const loadCreatorDetails = async () => {
      if (!creatorId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchCreatorDetails(creatorId);

        if (response.success) {
          setCreator(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch creator details");
        }
      } catch (err) {
        console.error("Error fetching creator details:", err);
        setError(
          err.message || "An error occurred while loading creator details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCreatorDetails();
  }, [creatorId]);

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Rejection reason is required");
      return;
    }

    setRejectError(null);
    setIsRejecting(true);

    try {
      const response = await rejectCreator(creatorId, rejectReason);

      if (response.success) {
        toast("Creator Rejected", {
          description: "The creator has been moved to the rejected list.",
        });

        setRejectDialogOpen(false);
        router.push("/admin/creators");
      } else {
        throw new Error(response.error || "Failed to reject creator");
      }
    } catch (err) {
      console.error("Error rejecting creator:", err);
      setRejectError(
        err.message || "Failed to reject creator. Please try again."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleGoBack = () => {
    router.push("/admin/creators");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <Card>
            <CardHeader className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-video bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Creator not found"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleGoBack}>
          Back to Creators
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleGoBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Creator Profile Review</h1>
        </div>
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Reject Creator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Creator</DialogTitle>
              <DialogDescription>
                This action will remove the creator and all their content from
                the platform. Please provide a reason for the rejection.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Creator</Label>
                <Input id="username" value={creator.username} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a detailed reason for rejecting this creator"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                {rejectError && (
                  <p className="text-sm text-destructive">{rejectError}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{creator.username}</CardTitle>

              <div className="flex flex-col md:flex-row gap-2 text-sm text-muted-foreground mt-2">
                {creator.location && <span>{creator.location}</span>}
                {creator.primary_role && (
                  <span className="md:before:content-['•'] md:before:mx-2 md:before:text-muted-foreground">
                    {creator.primary_role}
                  </span>
                )}
                {creator.years_of_experience && (
                  <span className="md:before:content-['•'] md:before:mx-2 md:before:text-muted-foreground">
                    {creator.years_of_experience} years experience
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {creator.social_links &&
                Object.entries(creator.social_links).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={platform}
                    >
                      <SocialIcon platform={platform} className="h-5 w-5" />
                    </a>
                  );
                })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {creator.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Bio</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {creator.bio}
              </p>
            </div>
          )}

          {creator.creative_fields && creator.creative_fields.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Creative Fields</h3>
              <div className="flex flex-wrap gap-2">
                {creator.creative_fields.map((field) => (
                  <span
                    key={field}
                    className="bg-secondary rounded-md px-3 py-1 text-sm"
                  >
                    {field.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Projects</h2>

      {creator.projects && creator.projects.length > 0 ? (
        <div className="space-y-8">
          {creator.projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.title}</CardTitle>
                    {project.year && (
                      <CardDescription>{project.year}</CardDescription>
                    )}
                  </div>

                  {project.behance_url && (
                    <a
                      href={project.behance_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>

                {project.description && (
                  <p className="text-muted-foreground mt-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                {/* Videos */}
                {project.videos && project.videos.length > 0 && (
                  <div className="space-y-6 mb-6">
                    <h3 className="text-lg font-medium">Videos</h3>
                    <div className="grid grid-cols-1 gap-6">
                      {project.videos.map((video) => (
                        <div key={video.id} className="space-y-2">
                          {video.vimeo_id ? (
                            <VimeoEmbed
                              vimeoId={video.vimeo_id}
                              title={video.title}
                            />
                          ) : video.url ? (
                            <video
                              src={video.url}
                              controls
                              className="w-full rounded-md"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                              <span className="text-muted-foreground">
                                No video available
                              </span>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium">{video.title}</h4>
                            {video.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {project.images && project.images.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.images.map((image) => (
                        <div key={image.id} className="space-y-2">
                          <div className="relative rounded-md overflow-hidden bg-muted">
                            <Image
                              src={image.resolutions?.high_res || image.url}
                              alt={image.alt_text || project.title}
                              width={600}
                              height={400}
                              className="object-cover w-full aspect-[4/3]"
                            />
                          </div>

                          {image.alt_text && (
                            <p className="text-sm text-muted-foreground">
                              {image.alt_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!project.images || project.images.length === 0) &&
                  (!project.videos || project.videos.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground">
                      No media available for this project
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          No projects available for this creator
        </div>
      )}
    </div>
  );
};

export default CreatorDetailPage;
