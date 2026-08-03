export type SecurityAccountRole = "talent" | "entreprise" | "admin";

export const canEnrollMfaForRole = (role?: SecurityAccountRole) =>
  role === "entreprise" || role === "admin";
