import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { api, type ApiResponse } from "./api";

type Shot = ApiResponse<typeof api, "listShots">["shots"][number];
type Direction = Shot["direction"];

const DIRECTIONS: { value: Direction; label: string; glyph: string }[] = [
  { value: "left", label: "Left", glyph: "↙" },
  { value: "straight", label: "Straight", glyph: "↑" },
  { value: "right", label: "Right", glyph: "↗" },
];

const CLUBS = [
  "Driver",
  "3 wood",
  "5 wood",
  "3 hybrid",
  "4 hybrid",
  "4 iron",
  "5 iron",
  "6 iron",
  "7 iron",
  "8 iron",
  "9 iron",
  "Pitching wedge",
  "Gap wedge",
  "Sand wedge",
  "Lob wedge",
];

function formatShotTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function directionLabel(direction: Direction) {
  return DIRECTIONS.find((item) => item.value === direction)?.label ?? direction;
}

export function App() {
  const queryClient = useQueryClient();
  const [club, setClub] = useState("");
  const [distance, setDistance] = useState("");
  const [direction, setDirection] = useState<Direction>("straight");
  const [formError, setFormError] = useState("");

  const shotsQuery = useQuery({
    queryKey: ["shots", { limit: 100 }],
    queryFn: () => api.listShots({ limit: 100 }),
  });

  const addShot = useMutation({
    mutationFn: (shot: { club: string; distance: number; direction: Direction }) => api.addShot(shot),
    onSuccess: async () => {
      setDistance("");
      setFormError("");
      await queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
    onError: () => setFormError("That shot did not save. Try again."),
  });

  const deleteShot = useMutation({
    mutationFn: (id: number) => api.deleteShot({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shots"] });
    },
  });

  const shots = shotsQuery.data?.shots ?? [];
  const stats = useMemo(() => {
    if (shots.length === 0) return { average: 0, longest: 0, left: 0, straight: 0, right: 0 };
    const total = shots.reduce((sum, shot) => sum + shot.distance, 0);
    return {
      average: Math.round(total / shots.length),
      longest: Math.max(...shots.map((shot) => shot.distance)),
      left: shots.filter((shot) => shot.direction === "left").length,
      straight: shots.filter((shot) => shot.direction === "straight").length,
      right: shots.filter((shot) => shot.direction === "right").length,
    };
  }, [shots]);

  const clubLeaders = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number; longest: number }>();
    for (const shot of shots) {
      const current = grouped.get(shot.club) ?? { total: 0, count: 0, longest: 0 };
      current.total += shot.distance;
      current.count += 1;
      current.longest = Math.max(current.longest, shot.distance);
      grouped.set(shot.club, current);
    }
    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, ...value, average: Math.round(value.total / value.count) }))
      .sort((a, b) => b.count - a.count || b.average - a.average)
      .slice(0, 4);
  }, [shots]);

  function submitShot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const yards = Number(distance);
    if (!club.trim()) {
      setFormError("Choose or enter a club.");
      return;
    }
    if (!Number.isInteger(yards) || yards < 1 || yards > 500) {
      setFormError("Enter a distance from 1 to 500 yards.");
      return;
    }
    addShot.mutate({ club: club.trim(), distance: yards, direction });
  }

  return (
    <div className="app-shell">
      <SafeAreaTopScrim backgroundColor="var(--bg)" />
      <main className="range-layout">
        <section className="entry-column" aria-labelledby="log-shot-heading">
          <div className="lead-copy">
            <p className="range-mark">Range log</p>
            <h1 id="log-shot-heading">Where did that one land?</h1>
            <p>Log the ball while the flight is still fresh.</p>
          </div>

          <form className="shot-console" onSubmit={submitShot}>
            <div className="form-field">
              <label htmlFor="club">Club</label>
              <input
                id="club"
                list="club-options"
                value={club}
                onChange={(event) => setClub(event.target.value)}
                placeholder="7 iron"
                autoComplete="off"
              />
              <datalist id="club-options">
                {CLUBS.map((option) => <option key={option} value={option} />)}
              </datalist>
            </div>

            <div className="form-field distance-field">
              <label htmlFor="distance">Distance</label>
              <div className="distance-input-wrap">
                <input
                  id="distance"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  inputMode="numeric"
                  value={distance}
                  onChange={(event) => setDistance(event.target.value)}
                  placeholder="165"
                />
                <span>yd</span>
              </div>
            </div>

            <fieldset className="direction-field">
              <legend>Direction</legend>
              <div className="direction-grid">
                {DIRECTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={direction === item.value ? "direction-choice selected" : "direction-choice"}
                    aria-pressed={direction === item.value}
                    onClick={() => setDirection(item.value)}
                  >
                    <span className="direction-glyph" aria-hidden="true">{item.glyph}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {formError ? <p className="form-error" role="alert">{formError}</p> : null}
            <button className="save-shot" type="submit" disabled={addShot.isPending}>
              {addShot.isPending ? "Saving shot…" : "Log shot"}
            </button>
          </form>
        </section>

        <section className="dashboard-column" aria-label="Shot dashboard">
          <div className="score-strip">
            <div>
              <span>Shots</span>
              <strong>{shots.length}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{shots.length ? stats.average : "—"}<small>{shots.length ? " yd" : ""}</small></strong>
            </div>
            <div>
              <span>Longest</span>
              <strong>{shots.length ? stats.longest : "—"}<small>{shots.length ? " yd" : ""}</small></strong>
            </div>
          </div>

          <section className="dispersion" aria-labelledby="dispersion-heading">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Ball flight</p>
                <h2 id="dispersion-heading">Direction split</h2>
              </div>
              {shots.length > 0 ? <span className="sample-size">Last {shots.length}</span> : null}
            </div>
            <div className="range-lanes" aria-label="Direction distribution">
              {DIRECTIONS.map((item) => {
                const count = stats[item.value];
                const percentage = shots.length ? Math.round((count / shots.length) * 100) : 0;
                return (
                  <div className={`range-lane ${item.value}`} key={item.value}>
                    <div className="lane-track" aria-hidden="true">
                      <div className="lane-fill" style={{ height: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }} />
                      <span className="lane-target" />
                    </div>
                    <strong>{shots.length ? `${percentage}%` : "—"}</strong>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {clubLeaders.length > 0 ? (
            <section className="club-board" aria-labelledby="club-board-heading">
              <div className="section-heading-row">
                <div>
                  <p className="section-kicker">By club</p>
                  <h2 id="club-board-heading">Club notes</h2>
                </div>
              </div>
              <div className="club-rows">
                {clubLeaders.map((item) => (
                  <div className="club-row" key={item.name}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.count} {item.count === 1 ? "shot" : "shots"}</span>
                    </div>
                    <div className="club-distance"><strong>{item.average}</strong><span>avg yd</span></div>
                    <div className="club-distance"><strong>{item.longest}</strong><span>best yd</span></div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="shot-log" aria-labelledby="shot-log-heading">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Sequence</p>
                <h2 id="shot-log-heading">Recent shots</h2>
              </div>
            </div>

            {shotsQuery.isPending ? <p className="state-copy">Reading your range log…</p> : null}
            {shotsQuery.isError ? (
              <div className="state-copy error-state">
                <p>The range log did not load.</p>
                <button type="button" onClick={() => shotsQuery.refetch()}>Try again</button>
              </div>
            ) : null}
            {!shotsQuery.isPending && !shotsQuery.isError && shots.length === 0 ? (
              <div className="empty-log">
                <div className="empty-target" aria-hidden="true"><span /></div>
                <p>Your first ball sets the baseline.</p>
                <span>Choose a club, add the distance, and mark its direction.</span>
              </div>
            ) : null}

            {shots.length > 0 ? (
              <ol className="shot-list">
                {shots.map((shot, index) => (
                  <li key={shot.id}>
                    <span className="shot-number">{shots.length - index}</span>
                    <div className="shot-main">
                      <strong>{shot.club}</strong>
                      <span>{formatShotTime(shot.created_at)}</span>
                    </div>
                    <div className="shot-flight">
                      <strong>{shot.distance}<small> yd</small></strong>
                      <span>{directionLabel(shot.direction)}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-shot"
                      aria-label={`Remove ${shot.club} shot at ${shot.distance} yards`}
                      disabled={deleteShot.isPending}
                      onClick={() => deleteShot.mutate(shot.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg>
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}
