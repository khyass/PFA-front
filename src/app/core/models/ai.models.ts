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

// --- New: Keyword-based offer suggestions ---

export interface SuggestOffersRequest {
  keywords: string[];
}

export interface OfferSuggestionResponse {
  offerId: string;
  offerTitle: string;
  companyName: string;
  score: number;
  justification: string;
}

// --- New: Interview preparation with structured Q&A ---

export interface InterviewPrepRequest {
  offerId: string;
  forceRefresh: boolean;
}

export interface InterviewPrepResponse {
  jobTitle: string;
  companyName: string;
  technicalQuestions: QuestionAnswer[];
  behavioralQuestions: QuestionAnswer[];
}

export interface QuestionAnswer {
  question: string;
  answerOutline: string;
}

// --- Interview Chat (Chatbot) ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewChatRequest {
  offerId: string;
  message: string;
  history: ChatMessage[];
}

export interface InterviewChatResponse {
  reply: string;
  jobTitle: string;
  companyName: string;
}

// --- New: Cover letter generation ---

export interface CoverLetterRequest {
  offerId: string;
  candidateSkills?: string;
  tone?: string;
}

export interface CoverLetterResponse {
  coverLetter: string;
  jobTitle: string;
  companyName: string;
  tone: string;
}
