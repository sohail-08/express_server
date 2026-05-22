export const USER_ROLES = {
    admin: "admin",
    agent: "agent",
    user: "user"
} as const;

export type ROLES = "admin" | "agent" | "user";