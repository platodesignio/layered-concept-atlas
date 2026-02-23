import { hasRole, canViewProject, canVote, canApproveReport } from "../lib/authz";
import { Role, Visibility } from "@prisma/client";

describe("hasRole", () => {
  test("VIEWER < MEMBER", () => {
    expect(hasRole("VIEWER", "MEMBER")).toBe(false);
  });
  test("NETWORK_ADMIN >= PROJECT_OWNER", () => {
    expect(hasRole("NETWORK_ADMIN", "PROJECT_OWNER")).toBe(true);
  });
  test("MEMBER >= MEMBER", () => {
    expect(hasRole("MEMBER", "MEMBER")).toBe(true);
  });
});

describe("canViewProject", () => {
  test("PUBLIC is always visible", () => {
    expect(canViewProject("PUBLIC", null, false, false)).toBe(true);
  });
  test("NETWORK_ONLY requires network membership", () => {
    expect(canViewProject("NETWORK_ONLY", "MEMBER", false, false)).toBe(false);
    expect(canViewProject("NETWORK_ONLY", "MEMBER", true, false)).toBe(true);
  });
  test("PROJECT_ONLY requires project membership or admin", () => {
    expect(canViewProject("PROJECT_ONLY", "MEMBER", true, false)).toBe(false);
    expect(canViewProject("PROJECT_ONLY", "MEMBER", false, true)).toBe(true);
    expect(canViewProject("PROJECT_ONLY", "NETWORK_ADMIN", false, false)).toBe(true);
  });
});

describe("canVote", () => {
  test("requires network membership", () => {
    expect(canVote("NETWORK_ONLY", false)).toBe(false);
    expect(canVote("NETWORK_ONLY", true)).toBe(true);
  });
  test("PUBLIC projects cannot be voted on", () => {
    expect(canVote("PUBLIC", true)).toBe(false);
  });
});

describe("canApproveReport", () => {
  test("project owner can approve", () => {
    expect(canApproveReport("MEMBER", true)).toBe(true);
  });
  test("non-owner cannot approve", () => {
    expect(canApproveReport("MEMBER", false)).toBe(false);
  });
  test("NETWORK_ADMIN can always approve", () => {
    expect(canApproveReport("NETWORK_ADMIN", false)).toBe(true);
  });
});
