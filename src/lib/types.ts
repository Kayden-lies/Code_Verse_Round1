export type Criterion = {
  id: number;
  name: string;
  description: string;
  weightage: number;
};

export type EvaluationData = {
  scores: { [key: string]: number };
  comments: string;
  totalScore: number;
  timestamp: Date;
};

export type SubmissionData = {
  evaluations?: {
    [judgeId: string]: EvaluationData;
  };
};
