export interface Route {
  path: string;
  label: string;
  adminOnly?: boolean;
  requiresAuth?: boolean;
  creatorOnly?: boolean;
}

export const mainRoutes: Route[] = [
  {
    path: "/",
    label: "Home",
  },
  {
    path: "/feed",
    label: "Feed",
  },
  {
    path: "/search",
    label: "Search",
  },
];

export const userAuthRoutes: Route[] = [
  {
    path: "/sign-in",
    label: "Log in",
    requiresAuth: false,
  },
  {
    path: "/sign-up",
    label: "Sign up",
    requiresAuth: false,
  },
];

export const adminRoutes: Route[] = [
  {
    path: "/admin",
    label: "Admin",
    adminOnly: true,
  },
  {
    path: "/admin/creators",
    label: "Creator Management",
    adminOnly: true,
  },
  {
    path: "/admin/creators/rejected",
    label: "Rejected Creators",
    adminOnly: true,
  },
];

export const creatorRoutes: Route[] = [
  {
    path: "/{username}",
    label: "My Portfolio",
    creatorOnly: true,
  },
];

export const isAdminEmail = (email: string | undefined): boolean => {
  return email?.includes("ohos.nyc") ?? false;
};
