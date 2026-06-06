import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ZodError, z } from 'zod';
import { EntityId, EntityRecord, RealtimeRepository, configRepository } from './realtimeRepository';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '128kb' }));
app.use(
  cors({
    origin: allowedOrigin,
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const entityIdSchema = z.union([z.string().min(1), z.number().int().positive()]);

const funcaoSchema = z
  .object({
    id: z.number().int().positive().optional(),
    fbKey: z.string().optional(),
    nome: z.string().min(1),
    ministry: z.string(),
    nivel: z.enum(['ministro', 'estagiario']),
    tipo: z.enum(['semanal', 'mensal']),
    semanas: z.array(z.object({ semana: z.number().int(), dias: z.array(z.number().int()) })).optional(),
    diasMes: z.array(z.number().int()).optional(),
  })
  .passthrough();

const memberSchema = z
  .object({
    id: z.number().int().positive().optional(),
    fbKey: z.string().optional(),
    nick: z.string().min(1),
    cargo: z.enum(['lider', 'vice', 'ministro', 'estagiario']),
    ministry: z.string(),
    disponivel: z.boolean(),
    modLevel: z.number().int().min(0),
  })
  .passthrough();

const escalaSchema = z
  .object({
    id: z.string().min(1).optional(),
    fbKey: z.string().optional(),
    data: z.string().min(1),
    ministry: z.string(),
    responsavel: z.string(),
    nivel: z.string(),
    funcaoId: z.number().int().positive(),
    funcaoNome: z.string(),
    status: z.enum(['pendente', 'concluido', 'justificado', 'faltou']),
    comprovacao: z.string(),
    justificativa: z.string(),
  })
  .passthrough();

const configSchema = z
  .object({
    conclusaoSemComp: z.boolean().optional(),
    notificarFaltas: z.boolean().optional(),
    manualMinistro: z.boolean().optional(),
    themeColor: z.string().optional(),
    mesReferencia: z.number().int().min(0).max(11).optional(),
    anoReferencia: z.number().int().min(2000).optional(),
    semanasAtivas: z.array(z.number().int()).optional(),
    ultimoIndiceRodizio: z.record(z.string(), z.number().int()).optional(),
  })
  .passthrough();

type Funcao = z.infer<typeof funcaoSchema>;
type Member = z.infer<typeof memberSchema>;
type Escala = z.infer<typeof escalaSchema>;
type Config = z.infer<typeof configSchema>;

const funcoesRepository = new RealtimeRepository<Funcao>('funcoes');
const escalasRepository = new RealtimeRepository<Escala>('escalas');
const membersRepository = new RealtimeRepository<Member>('members');

const requiredParam = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`${name} param is required`);
  }
  return value;
};

const parseId = (rawId: string): EntityId => {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && String(parsed) === rawId ? parsed : rawId;
};

const sanitizeRecord = (data: EntityRecord): Record<string, unknown> => {
  const { fbKey: _fbKey, ...payload } = data;
  return payload;
};

const asyncHandler =
  (handler: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

const createNumericEntityRoutes = <T extends EntityRecord>(
  routePath: string,
  repository: RealtimeRepository<T>,
  schema: z.ZodType
) => {
  app.get(
    routePath,
    asyncHandler(async (_req, res) => {
      res.json(await repository.list());
    })
  );

  app.post(
    routePath,
    asyncHandler(async (req, res) => {
      const data = schema.parse(req.body) as T;
      const id = data.id ?? (await repository.nextNumericId());
      const created = await repository.create({ ...sanitizeRecord(data), id } as T);
      res.status(201).json(created);
    })
  );

  app.put(
    `${routePath}/:id`,
    asyncHandler(async (req, res) => {
      const id = parseId(requiredParam(req.params.id, 'id'));
      const data = (schema as any).partial().parse(req.body) as Partial<T>;
      const updated = await repository.updateById(id, sanitizeRecord(data));

      if (!updated) {
        res.status(404).json({ error: 'Record not found' });
        return;
      }

      res.json(updated);
    })
  );

  app.delete(
    `${routePath}/:id`,
    asyncHandler(async (req, res) => {
      const deleted = await repository.deleteById(parseId(requiredParam(req.params.id, 'id')));

      if (!deleted) {
        res.status(404).json({ error: 'Record not found' });
        return;
      }

      res.status(204).send();
    })
  );
};

app.get('/health', (_req, res) => res.json({ ok: true }));

createNumericEntityRoutes('/funcoes', funcoesRepository, funcaoSchema);
createNumericEntityRoutes('/members', membersRepository, memberSchema);

app.get(
  '/escalas',
  asyncHandler(async (_req, res) => {
    res.json(await escalasRepository.list());
  })
);

app.post(
  '/escalas',
  asyncHandler(async (req, res) => {
    const data = escalaSchema.parse(req.body);
    const created = await escalasRepository.create({
      ...sanitizeRecord(data),
      id: data.id ?? String(Date.now()),
    } as Escala);
    res.status(201).json(created);
  })
);

app.put(
  '/escalas/:id',
  asyncHandler(async (req, res) => {
    const data = escalaSchema.partial().parse(req.body);
    const updated = await escalasRepository.updateById(
      requiredParam(req.params.id, 'id'),
      sanitizeRecord(data)
    );

    if (!updated) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.json(updated);
  })
);

app.delete(
  '/escalas/:id',
  asyncHandler(async (req, res) => {
    const deleted = await escalasRepository.deleteById(requiredParam(req.params.id, 'id'));

    if (!deleted) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    res.status(204).send();
  })
);

app.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json((await configRepository.get<Config>()) ?? {});
  })
);

app.put(
  '/config',
  asyncHandler(async (req, res) => {
    const data = configSchema.parse(req.body);
    res.json(await configRepository.update<Config>(data));
  })
);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request body',
      issues: err.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
