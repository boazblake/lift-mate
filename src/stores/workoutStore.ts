import Stream from "mithril/stream";
import m from "mithril";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

export interface Workout {
  id: string;
  name: string;
  icon: string;
  exercises: Exercise[];
  createdAt: Date;
  lastPerformedAt?: Date;
}

const mockWorkouts: Workout[] = [
  {
    id: "1",
    name: "Chest Day",
    icon: "barbell",
    exercises: [
      { id: "e1", name: "Bench Press", sets: 4, reps: 8 },
      { id: "e2", name: "Incline Dumbbell", sets: 3, reps: 10 },
    ],
    createdAt: new Date("2025-06-01"),
    lastPerformedAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: "2",
    name: "Arms & Shoulders",
    icon: "dumbbell",
    exercises: [
      { id: "e3", name: "Bicep Curls", sets: 3, reps: 12 },
      { id: "e4", name: "Tricep Pushdowns", sets: 3, reps: 12 },
    ],
    createdAt: new Date("2025-06-05"),
    lastPerformedAt: new Date(Date.now() - 4 * 86400000),
  },
  {
    id: "3",
    name: "Leg Day",
    icon: "footsteps",
    exercises: [
      { id: "e5", name: "Squat", sets: 5, reps: 5 },
      { id: "e6", name: "RDL", sets: 3, reps: 8 },
    ],
    createdAt: new Date("2025-06-10"),
    lastPerformedAt: new Date(Date.now() - 6 * 86400000),
  },
  {
    id: "4",
    name: "Push Pull",
    icon: "git-network-outline",
    exercises: [
      { id: "e7", name: "Rows", sets: 4, reps: 8 },
      { id: "e8", name: "OHP", sets: 3, reps: 10 },
    ],
    createdAt: new Date("2025-06-15"),
  },
  {
    id: "5",
    name: "Back & Core",
    icon: "body-outline",
    exercises: [
      { id: "e9", name: "Pull-ups", sets: 3, reps: 8 },
      { id: "e10", name: "Planks", sets: 3, reps: 1 },
    ],
    createdAt: new Date("2025-06-20"),
  },
];

export const workouts = Stream<Workout[]>([]);
export const isLoading = Stream(true);
export const error = Stream<string | null>(null);

export const loadWorkouts = () => {
  isLoading(true);
  error(null);
  setTimeout(() => {
    workouts(mockWorkouts);
    isLoading(false);
    m.redraw();
  }, 800);
};

export const createWorkout = (name: string, icon: string) => {
  const newWorkout: Workout = {
    id: String(Date.now()),
    name,
    icon,
    exercises: [],
    createdAt: new Date(),
  };
  workouts([...workouts(), newWorkout]);
  m.redraw();
};

export const deleteWorkout = (id: string) => {
  workouts(workouts().filter((w) => w.id !== id));
};

export const getRecentWorkouts = () => {
  return workouts()
    .filter((w) => w.lastPerformedAt)
    .sort((a, b) => (b.lastPerformedAt?.getTime() || 0) - (a.lastPerformedAt?.getTime() || 0))
    .slice(0, 4);
};
