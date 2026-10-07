import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shots = sqliteTable("shots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  club: text("club").notNull(),
  distance: integer("distance").notNull(),
  direction: text("direction", { enum: ["left", "straight", "right"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
