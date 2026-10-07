import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { desc, eq } from "drizzle-orm";
import * as schema from "./schema";

const directionSchema = z.enum(["left", "straight", "right"]);
const shotSchema = z.object({
  id: z.number(),
  club: z.string(),
  distance: z.number(),
  direction: directionSchema,
  created_at: z.string(),
});

export const Actions = {
  listShots: defineAction({
    request: z.object({
      limit: z.number().int().positive().max(200).default(100),
    }),
    response: z.object({ shots: z.array(shotSchema) }),
    async handler(ctx, args): Promise<{ shots: z.infer<typeof shotSchema>[] }> {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.shots)
        .orderBy(desc(schema.shots.id))
        .limit(args.limit);

      return {
        shots: rows.map((row) => ({
          id: row.id,
          club: row.club,
          distance: row.distance,
          direction: row.direction,
          created_at: row.createdAt.toISOString(),
        })),
      };
    },
  }),

  addShot: defineAction({
    request: z.object({
      club: z.string().trim().min(1).max(40),
      distance: z.number().int().min(1).max(500),
      direction: directionSchema,
    }),
    response: shotSchema,
    async handler(ctx, args): Promise<z.infer<typeof shotSchema>> {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .insert(schema.shots)
        .values({
          club: args.club.trim(),
          distance: args.distance,
          direction: args.direction,
        })
        .returning();
      const inserted = rows[0];
      if (!inserted) throw new Error("The shot could not be saved.");
      ctx.invalidateQueries();
      return {
        id: inserted.id,
        club: inserted.club,
        distance: inserted.distance,
        direction: inserted.direction,
        created_at: inserted.createdAt.toISOString(),
      };
    },
  }),

  deleteShot: defineAction({
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.shots).where(eq(schema.shots.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),
} satisfies ActionsModule;
