export interface Exercise {
  meta: {
    name: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  };
  validate: (landmarks: any) => boolean;
}

export const exercises: Exercise[] = [
  {
    meta: {
      name: "Basic Squat",
      description: "A basic squat exercise",
      difficulty: "beginner",
    },
    validate: (landmarks) => {
      return true;
    },
  },
  {
    meta: {
      name: "Push-up",
      description: "Basic push-up form",
      difficulty: "intermediate",
    },
    validate: (landmarks) => {
      return true;
    },
  },
];
