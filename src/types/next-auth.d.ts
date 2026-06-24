import type { DefaultSession } from "next-auth";
import type { WorkspaceMembership } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role: string;
    roles?: string[];
    schoolId: string | null;
    activeSchoolId?: string | null;
    memberships?: WorkspaceMembership[];
  }

  interface Session {
    user: {
      id: string;
      role: string;
      roles: string[];
      schoolId: string | null;
      activeSchoolId: string | null;
      memberships: WorkspaceMembership[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    roles?: string[];
    schoolId?: string | null;
    activeSchoolId?: string | null;
    memberships?: WorkspaceMembership[];
  }
}
