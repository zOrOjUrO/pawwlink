// End-to-end test: POST /api/intake -> GET /api/match/[id] -> POST /api/notify.
//
// Hits the real route handlers against a TEST Supabase project. Skipped unless
// TEST_SUPABASE_URL is set. Run with: npm test
//
// Env used:
//   TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY
import { describe, it, expect, beforeAll } from "vitest";

const RUN = Boolean(process.env.TEST_SUPABASE_URL);

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc0f01f0005000100ffa0a55e0000000049454e44ae426082",
  "hex"
);

describe.skipIf(!RUN)("intake -> match -> notify (e2e)", () => {
  // Loaded after env is pointed at the test project.
  let intakePOST: (req: Request) => Promise<Response>;
  let matchGET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let notifyPOST: (req: Request) => Promise<Response>;
  let db: typeof import("../lib/db/supabase");

  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.MOCK_VISION = "true"; // no CLIP download / no Mistral calls

    intakePOST = (await import("../app/api/intake/route")).POST;
    matchGET = (await import("../app/api/match/[id]/route")).GET;
    notifyPOST = (await import("../app/api/notify/route")).POST;
    db = await import("../lib/db/supabase");
  });

  it("creates an intake, finds a visual match, and notifies", async () => {
    // 1. INTAKE
    const form = new FormData();
    form.append("image", new File([PNG], "test.png", { type: "image/png" }));
    const intakeRes = await intakePOST(
      new Request("http://test/api/intake", { method: "POST", body: form })
    );
    expect(intakeRes.status).toBe(201);
    const intake = await intakeRes.json();
    const animalId: string = intake.animal_id;
    expect(animalId).toBeTruthy();
    expect(intake.passport.biometric.embedding).toHaveLength(512);

    // Register an owner pet with the SAME embedding so a match is guaranteed.
    const ownerId = await db.insertOwner({
      name: "Test Owner",
      phone: "+31600000000",
      email: "test@example.nl",
      registered_pets: [{ name: "Rex", breed: "Golden Retriever" }],
    });
    await db.insertAnimal({
      passport: intake.passport,
      embedding: intake.passport.biometric.embedding,
      ownerId,
      status: "registered",
    });

    // 2. MATCH — expect a visual match with confidence > 0.
    const matchRes = await matchGET(new Request("http://test/api/match/" + animalId), {
      params: Promise.resolve({ id: animalId }),
    });
    expect(matchRes.status).toBe(200);
    const match = await matchRes.json();
    expect(match.visual_matches.length).toBeGreaterThan(0);
    expect(match.visual_matches[0].confidence).toBeGreaterThan(0);

    // 3. NOTIFY — expect sent: true.
    const notifyRes = await notifyPOST(
      new Request("http://test/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: animalId, match_type: "owner" }),
      })
    );
    expect(notifyRes.status).toBe(200);
    const notify = await notifyRes.json();
    expect(notify.sent).toBe(true);
    expect(notify.channel).toBe("owner_sms");
  });
});
