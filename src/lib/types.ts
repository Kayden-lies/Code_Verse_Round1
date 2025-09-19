import type { Timestamp } from "firebase/firestore";

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
  judgeName: string;
  timestamp: Date;
  teamLeaderName: string;
};

export type SubmissionData = {
  evaluations?: {
    [judgeId: string]: EvaluationData;
  };
};
