export { aiRoutes } from './routes';
export { AIService, aiService } from './services/ai.service';
export {
  CategorizationService,
  categorizeTransaction,
  categorizeTransactions,
  learnFromCorrection,
  type CategorySuggestion,
  type ConfidenceTier,
} from './services/categorization.service';
export type { AIMessage, AIChatOptions, AIChatResponse, AIProvider } from './services/types';
export {
  JESuggestionService,
  type JESuggestionInput,
  type JESuggestion,
  type JESuggestionBatchResult,
} from './services/je-suggestion.service';
export {
  AIActionService,
  type CreateActionInput,
  type ListActionsFilter,
  type ActionStats,
  type BatchResult,
} from './services/ai-action.service';
export { AIError, handleAIError, type AIErrorCode } from './errors';
