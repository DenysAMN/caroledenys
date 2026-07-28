import { describe, expect, it } from "vitest";
import { parseMessageModerationInput } from "./admin-message-rules";

const id = "08ee4652-8e80-4a3a-b9be-676b7f498d81";

describe("parseMessageModerationInput", () => {
  it("aceita origens e decisões conhecidas", () => {
    expect(parseMessageModerationInput(id, "CLAIM", "APPROVE")).toEqual({
      id,
      source: "CLAIM",
      approved: true,
    });
    expect(parseMessageModerationInput(id, "RSVP", "HIDE")).toEqual({
      id,
      source: "RSVP",
      approved: false,
    });
  });

  it("rejeita UUID, origem ou decisão inválidos", () => {
    expect(parseMessageModerationInput("x", "CLAIM", "APPROVE")).toBeNull();
    expect(parseMessageModerationInput(id, "GUEST", "APPROVE")).toBeNull();
    expect(parseMessageModerationInput(id, "CLAIM", "DELETE")).toBeNull();
  });
});
