import dataset from "./exrx-data/exercises.json";

export type ExRxClassification = {
  utility?: string;
  mechanics?: string;
  force?: string;
};

export type ExRxExercise = {
  name: string;
  canonicalUrl: string;
  normalizedName: string;
  source: string[];
  classification: ExRxClassification;
  instructions: { preparation: string; execution: string };
  comments: string;
  muscles: Record<string, string[]>;
  relatedLinks?: Array<{ url: string; text: string }>;
};

export type ExRxDataset = { source: string; generatedAt: string; count: number; exercises: ExRxExercise[] };
export type ExerciseAnalysisProfile = {
  key: "squat" | "press" | "hinge" | "lunge" | "pull" | "core" | "cardio" | "generic";
  display: string;
};

export const exrx = dataset as ExRxDataset;

const byName = new Map(exrx.exercises.flatMap((e) => [[e.normalizedName, e], [e.name.toLowerCase(), e]]));

export const normalizeExerciseName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const getExRxExercise = (name: string) => byName.get(normalizeExerciseName(name)) || byName.get(name.toLowerCase());

export const getExRxExerciseNames = (): string[] => {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of exrx.exercises) {
    const key = normalizeExerciseName(item.name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(item.name);
  }
  return names;
};

const fallbackCues: Record<string, string[]> = {
  squat: ["Brace your core.", "Keep knees tracking over toes.", "Control the descent."],
  "bench press": ["Keep shoulders packed.", "Lower with control.", "Drive through the floor and press evenly."],
  "overhead press": ["Ribs down, glutes tight.", "Press in a straight path.", "Keep wrists stacked over elbows."],
};

export const synthesizeFeedbackCues = (name: string) => {
  const ex = getExRxExercise(name);
  const cues = [ex?.comments, ex?.instructions.preparation, ex?.instructions.execution]
    .filter(Boolean)
    .join(" ")
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18)
    .slice(0, 4);
  return cues.length ? cues : fallbackCues[normalizeExerciseName(name)] || ["Move with control.", "Maintain stable posture."];
};

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

export const getExerciseAnalysisProfile = (name: string): ExerciseAnalysisProfile => {
  const normalized = normalizeExerciseName(name);
  const ex = getExRxExercise(name);
  const source = (ex?.source || []).join(" ").toLowerCase();
  const classification = `${ex?.classification.utility || ""} ${ex?.classification.mechanics || ""} ${ex?.classification.force || ""}`.toLowerCase();
  const corpus = `${normalized} ${source} ${classification}`;

  if (includesAny(corpus, ["squat", "leg press", "step up", "step down"])) {
    return { key: "squat", display: "Squat Pattern" };
  }
  if (includesAny(corpus, ["lunge", "split squat", "rear lunge"])) {
    return { key: "lunge", display: "Lunge Pattern" };
  }
  if (includesAny(corpus, ["press", "push up", "dip"])) {
    return { key: "press", display: "Press Pattern" };
  }
  if (includesAny(corpus, ["deadlift", "good morning", "hinge", "hyperextension"])) {
    return { key: "hinge", display: "Hinge Pattern" };
  }
  if (includesAny(corpus, ["row", "pull", "curl up", "pulldown", "chin up"])) {
    return { key: "pull", display: "Pull Pattern" };
  }
  if (includesAny(corpus, ["plank", "crunch", "oblique", "abdom", "core"])) {
    return { key: "core", display: "Core Pattern" };
  }
  if (includesAny(corpus, ["run", "walk", "cycle", "cardio", "jump rope"])) {
    return { key: "cardio", display: "Cardio Pattern" };
  }
  return { key: "generic", display: "General Pattern" };
};
