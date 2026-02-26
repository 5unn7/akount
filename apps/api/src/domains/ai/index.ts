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
