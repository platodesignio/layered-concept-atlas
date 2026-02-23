import { Role, Visibility } from "@prisma/client";

// ─── Role hierarchy ───────────────────────────────────────────────────────────

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  EDITOR: 2,
  PROJECT_OWNER: 3,
  NETWORK_ADMIN: 4,
};

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

// ─── Project-scoped permission checks ────────────────────────────────────────

export function canViewProject(
  visibility: Visibility,
  userRole: Role | null,
  isNetworkMember: boolean,
  isProjectMember: boolean
): boolean {
  switch (visibility) {
    case "PUBLIC":
      return true;
    case "LINK_ONLY":
      return true; // link-only: anyone with the link can view
    case "NETWORK_ONLY":
      return isNetworkMember || (userRole !== null && hasRole(userRole, "NETWORK_ADMIN"));
    case "PROJECT_ONLY":
      return isProjectMember || (userRole !== null && hasRole(userRole, "NETWORK_ADMIN"));
    default:
      return false;
  }
}

export function canComment(
  visibility: Visibility,
  _userRole: Role | null,
  isNetworkMember: boolean,
  isProjectMember: boolean
): boolean {
  switch (visibility) {
    case "PUBLIC":
      return false; // PUBLIC is view+support only
    case "LINK_ONLY":
      return true;
    case "NETWORK_ONLY":
      return isNetworkMember;
    case "PROJECT_ONLY":
      return isProjectMember;
    default:
      return false;
  }
}

export function canVote(
  visibility: Visibility,
  isNetworkMember: boolean
): boolean {
  return (
    (visibility === "NETWORK_ONLY" || visibility === "PROJECT_ONLY") &&
    isNetworkMember
  );
}

export function canEditReport(
  userRole: Role,
  isProjectMember: boolean,
  isAuthor: boolean
): boolean {
  return isAuthor || isProjectMember || hasRole(userRole, "NETWORK_ADMIN");
}

export function canApproveReport(
  userRole: Role,
  isProjectOwner: boolean
): boolean {
  return isProjectOwner || hasRole(userRole, "NETWORK_ADMIN");
}

export function canManageProject(
  userRole: Role,
  isProjectOwner: boolean
): boolean {
  return isProjectOwner || hasRole(userRole, "NETWORK_ADMIN");
}

// ─── Visibility helpers ───────────────────────────────────────────────────────

export function visibilityAllowsOperation(
  visibility: Visibility,
  operation: "view" | "comment" | "vote" | "edit" | "approve"
): Record<string, boolean> {
  return {
    PUBLIC: operation === "view",
    LINK_ONLY: operation === "view" || operation === "comment",
    NETWORK_ONLY:
      operation === "view" ||
      operation === "comment" ||
      operation === "vote",
    PROJECT_ONLY: true,
  };
}
