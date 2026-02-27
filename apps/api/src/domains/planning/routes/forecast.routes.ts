import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withPermission } from '../../../middleware/withPermission';
import { validateQuery, validateParams, validateBody } from '../../../middleware/validation';
import { statsRateLimitConfig, aiRateLimitConfig } from '../../../middleware/rate-limit';
import { ForecastService } from '../services/forecast.service';
import { CashRunwayService } from '../services/cash-runway.service';
import { SeasonalPatternsService } from '../services/seasonal-patterns.service';
import { AIForecastService } from '../services/ai-forecast.service';
import {
  CreateForecastSchema,
  UpdateForecastSchema,
  ListForecastsQuerySchema,
  ForecastIdParamSchema,
  ForecastAnalyticsQuerySchema,
  AIForecastQuerySchema,
  type CreateForecastInput,
  type UpdateForecastInput,
  type ListForecastsQuery,
  type ForecastIdParam,
  type ForecastAnalyticsQuery,
  type AIForecastQuery,
} from '../schemas/forecast.schema';

/**
 * Forecast routes — /api/planning/forecasts
 *
 * Manages financial forecasts (cash flow, revenue, expense projections).
 * Auth + tenant middleware inherited from parent registration.
 */
export async function forecastRoutes(fastify: FastifyInstance) {
  // GET /forecasts — List forecasts
  fastify.get(
    '/',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
      preValidation: [validateQuery(ListForecastsQuerySchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ForecastService(request.tenantId);
      const query = request.query as ListForecastsQuery;

      const result = await service.listForecasts({
        entityId: query.entityId,
        cursor: query.cursor,
        limit: query.limit,
        type: query.type,
        scenario: query.scenario,
      });

      request.log.info({ count: result.forecasts.length }, 'Listed forecasts');
      return reply.status(200).send(result);
    }
  );

  // GET /forecasts/:id — Get single forecast
  fastify.get(
    '/:id',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
      preValidation: [validateParams(ForecastIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ForecastService(request.tenantId);
      const params = request.params as ForecastIdParam;

      const forecast = await service.getForecast(params.id);
      if (!forecast) {
        return reply.status(404).send({ error: 'Forecast not found' });
      }

      request.log.info({ forecastId: params.id }, 'Retrieved forecast');
      return reply.status(200).send(forecast);
    }
  );

  // POST /forecasts — Create forecast
  fastify.post(
    '/',
    {
      ...withPermission('planning', 'forecasts', 'ACT'),
      preValidation: [validateBody(CreateForecastSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ForecastService(request.tenantId);
      const body = request.body as CreateForecastInput;

      try {
        const forecast = await service.createForecast(body);
        request.log.info({ forecastId: forecast.id, name: body.name }, 'Created forecast');
        return reply.status(201).send(forecast);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // PATCH /forecasts/:id — Update forecast
  fastify.patch(
    '/:id',
    {
      ...withPermission('planning', 'forecasts', 'ACT'),
      preValidation: [validateParams(ForecastIdParamSchema), validateBody(UpdateForecastSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ForecastService(request.tenantId);
      const params = request.params as ForecastIdParam;
      const body = request.body as UpdateForecastInput;

      try {
        const forecast = await service.updateForecast(params.id, body);
        request.log.info({ forecastId: params.id }, 'Updated forecast');
        return reply.status(200).send(forecast);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /forecasts/runway — Cash runway calculation
  fastify.get(
    '/runway',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
      preValidation: [validateQuery(ForecastAnalyticsQuerySchema)],
      config: { rateLimit: statsRateLimitConfig() }, // SEC-42: Expensive analytics query
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const runwayService = new CashRunwayService(request.tenantId);
      const query = request.query as ForecastAnalyticsQuery;

      const result = await runwayService.calculateRunway(query.entityId);
      request.log.info(
        { entityId: query.entityId, runwayMonths: result.runwayMonths },
        'Calculated cash runway'
      );
      return reply.status(200).send(result);
    }
  );

  // GET /forecasts/seasonal — Seasonal pattern analysis
  fastify.get(
    '/seasonal',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
      preValidation: [validateQuery(ForecastAnalyticsQuerySchema)],
      config: { rateLimit: statsRateLimitConfig() }, // SEC-42: Expensive multi-month aggregation
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const seasonalService = new SeasonalPatternsService(request.tenantId);
      const query = request.query as ForecastAnalyticsQuery;

      const result = await seasonalService.analyze(
        query.entityId,
        query.lookbackMonths ?? 12
      );
      request.log.info(
        { entityId: query.entityId, monthsAnalyzed: result.monthsAnalyzed, seasonality: result.seasonalityScore },
        'Analyzed seasonal patterns'
      );
      return reply.status(200).send(result);
    }
  );

  // GET /forecasts/ai-forecast — AI-enhanced statistical forecast
  fastify.get(
    '/ai-forecast',
    {
      ...withPermission('planning', 'forecasts', 'VIEW'),
      preValidation: [validateQuery(AIForecastQuerySchema)],
      config: { rateLimit: aiRateLimitConfig() }, // SEC-42: AI-powered endpoint (20 req/min)
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const aiService = new AIForecastService(request.tenantId);
      const query = request.query as AIForecastQuery;

      const result = await aiService.generateForecast(
        query.entityId,
        query.forecastMonths,
        query.type as 'EXPENSE' | 'REVENUE' | 'CASH_FLOW' | undefined
      );

      request.log.info(
        {
          entityId: query.entityId,
          type: query.type ?? 'EXPENSE',
          projections: result.projections.length,
          dataQuality: result.dataQuality,
        },
        'Generated AI forecast'
      );
      return reply.status(200).send(result);
    }
  );

  // DELETE /forecasts/:id — Soft delete forecast
  fastify.delete(
    '/:id',
    {
      ...withPermission('planning', 'forecasts', 'ACT'),
      preValidation: [validateParams(ForecastIdParamSchema)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.tenantId) {
        return reply.status(500).send({ error: 'Context not initialized' });
      }

      const service = new ForecastService(request.tenantId);
      const params = request.params as ForecastIdParam;

      try {
        await service.deleteForecast(params.id);
        request.log.info({ forecastId: params.id }, 'Deleted forecast');
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found or access denied')) {
          return reply.status(404).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
