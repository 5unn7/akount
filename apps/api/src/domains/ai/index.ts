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
export {
  ActionExecutorService,
  type ExecutionResult,
} from './services/action-executor.service';
export {
  PatternDetectionService,
  tokenizeDescription,
  type DetectedPattern,
} from './services/pattern-detection.service';
export {
  RuleSuggestionService,
  type RuleSuggestionWithDetails,
} from './services/rule-suggestion.service';
export { AIError, handleAIError, type AIErrorCode } from './errors';
