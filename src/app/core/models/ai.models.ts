export interface SuggestionsResponseDTO {
  candidateId: string;
  suggestions: JobSuggestionDTO[];
  computing: boolean;
  lastUpdated?: string;
}

export interface JobSuggestionDTO {
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  matchScore: number;
  matchReason: string;
  skillsMatched: string[];
  skillsGap: string[];
}

export interface JobMatchResponseDTO {
  candidateId: string;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  overallFeedback: string;
  skillsMatched: string[];
  skillsGap: string[];
  strengthsHighlights: string[];
  improvementSuggestions: string[];
  interviewQuestions: string[];
  computedAt: string;
}

export interface InterviewPrepDTO {
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  interviewQuestions: string[];
  matchScore: number;
}
