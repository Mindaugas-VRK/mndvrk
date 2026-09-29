export const ASSESSMENT_KEYS = [
  "existingTopics",
  "benchmarking",
  "internalStakeholders",
  "externalStakeholders",
  "engagementPlan",
  "meetingMinutes",
  "committee",
  "approvalNotes",
  "lastAssessed",
  "nextAssessment",
  "step1Done",
  "step2Done",
  "step3Done",
] as const;

export type AssessmentKey = (typeof ASSESSMENT_KEYS)[number];
