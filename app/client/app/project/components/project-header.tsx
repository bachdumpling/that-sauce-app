"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Edit, Trash2, Globe, MapPin, Plus, MessageCircle } from "lucide-react";
import { Project, Creator } from "@/types";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creator-options";
import { SocialIcon } from "@/components/ui/social-icon";
import { Badge } from "@/components/ui/badge";
import { getOrganizationAction } from "@/actions/organization-actions";
import { BackButton } from "@/components/back-button";
import Link from "next/link";
interface ProjectHeaderProps {
  project: Project;
  creator: Creator;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface OrganizationWithDetails {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProjectHeader({
  project,
  creator,
  onDelete,
}: ProjectHeaderProps) {
  const [clientDetails, setClientDetails] = useState<OrganizationWithDetails[]>(
    []
  );
  const [isLoadingOrgs, setIsLoadingOrgs] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOrganizationDetails() {
      if (!project.client_ids || project.client_ids.length === 0) return;

      setIsLoadingOrgs(true);
      try {
        const orgsWithDetails = await Promise.all(
          project.client_ids.map(async (orgId) => {
            const result = await getOrganizationAction(orgId);
            if (result.success && result.data) {
              return result.data;
            }
            return null;
          })
        );

        setClientDetails(orgsWithDetails);
      } catch (error) {
        console.error("Error fetching organization details:", error);
      } finally {
        setIsLoadingOrgs(false);
      }
    }

    fetchOrganizationDetails();
  }, [project.client_ids]);

  return (
    <div>
      <div className="flex justify-between">
        <BackButton fallbackPath={`/${creator.username}/work`} />
        {creator?.isOwner && (
          <div className="flex space-x-2">
            <Button size="sm" variant="secondary" className="flex-1 px-4 py-2">
              <Edit className="mr-2 mb-1 h-4 w-4" />
              <Link href={`/project/${project.id}/edit`}>Edit</Link>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="flex-1 px-4 py-2"
            >
              <Trash2 className="mr-2 mb-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
      <Card className="mb-8 overflow-hidden border-0 shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            {/* Left: Project Info */}
            <div className="flex-1 space-y-4">
              <div>
                {project.category && (
                  <Badge variant="outline" className="mb-2">
                    {project.category}
                  </Badge>
                )}
                <CardTitle className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                  {project.title}
                </CardTitle>
                {project.description && (
                  <CardDescription className="text-base md:text-lg text-muted-foreground">
                    {project.description}
                  </CardDescription>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Visit website</span>
                  </a>
                )}

                {project.year && (
                  <span className="text-muted-foreground">{project.year}</span>
                )}

                {project.created_at && (
                  <span className="text-muted-foreground">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {project.roles && project.roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              {(clientDetails.length > 0 || isLoadingOrgs) && (
                <div className="flex flex-col space-y-1 mt-2">
                  <p className="text-sm font-medium">Clients:</p>
                  <div className="flex flex-wrap gap-3">
                    {isLoadingOrgs ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    ) : (
                      clientDetails.map((org) => (
                        <div key={org.id} className="flex items-center gap-2">
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt={org.name}
                              className="w-6 h-6 rounded-full object-contain"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          {org.website ? (
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline"
                            >
                              {org.name}
                            </a>
                          ) : (
                            <span className="text-sm font-medium">
                              {org.name}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Creator Card & Actions */}
            <div className="flex flex-col space-y-4 min-w-[240px]">
              <Card className="border shadow-sm p-4 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage
                      src={creator.avatar_url}
                      alt={creator.first_name}
                    />
                    <AvatarFallback>
                      {creator.first_name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {creator.first_name} {creator.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{creator.username}
                    </p>
                  </div>
                </div>

                {creator.social_links &&
                  Object.keys(creator.social_links).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(creator.social_links)
                        .filter(([platform]) =>
                          SOCIAL_PLATFORMS.some((p) => p.id === platform)
                        )
                        .map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full flex items-center justify-center border hover:bg-gray-100 transition-colors"
                          >
                            <span className="sr-only">{platform}</span>
                            <SocialIcon
                              platform={platform}
                              className="h-4 w-4"
                            />
                          </a>
                        ))}
                    </div>
                  )}

                <div className="flex flex-col gap-2">
                  <Button className="w-full" variant="default" size="sm">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Get in touch
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add to projects
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
