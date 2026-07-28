import { isUuid } from "./guest-area-rules";

export type MessageSource = "CLAIM" | "RSVP";
export type ModerationDecision = "APPROVE" | "HIDE";

export function parseMessageModerationInput(
  id: unknown,
  source: unknown,
  decision: unknown
): { id: string; source: MessageSource; approved: boolean } | null {
  if (!isUuid(id)) return null;
  if (source !== "CLAIM" && source !== "RSVP") return null;
  if (decision !== "APPROVE" && decision !== "HIDE") return null;

  return {
    id: id.trim().toLowerCase(),
    source,
    approved: decision === "APPROVE",
  };
}
