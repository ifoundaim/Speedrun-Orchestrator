import path from "node:path";

import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { type InferSchema } from "xmcp";

import greet, { schema as greetSchema } from "../tools/greet";
import generateSpeedrunPlan from "../tools/generateSpeedrunPlan";
import clipOutline from "../tools/clipOutline";
import analyzeDocs from "../tools/analyzeDocs";
import orchestrateSpeedrunWorkflow from "../tools/orchestrateWorkflow";
import {
  analyzeDocsSchema,
  clipOutlineSchema,
  generateSpeedrunPlanSchema,
  orchestrateWorkflowSchema,
} from "../types/toolSchemas";

type Handler<TInput, TResult> = {
  schema: z.ZodType<TInput>;
  action: (input: TInput) => TResult | Promise<TResult>;
};

const toZodObject = <TSchema extends Record<string, z.ZodTypeAny>>(shape: TSchema) =>
  z.object(shape) as z.ZodType<InferSchema<TSchema>>;

const buildHandler =
  <TInput, TResult>({ schema, action }: Handler<TInput, TResult>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten(),
      });
    }

    try {
      const payload = await action(parsed.data);
      return res.json(payload);
    } catch (error) {
      // Surface a readable error while still bubbling to the default handler.
      const message =
        error instanceof Error ? error.message : "Unknown server error";
      res.status(500).json({ error: message });
      return next(error);
    }
  };

const planSchema = toZodObject(generateSpeedrunPlanSchema);
const clipSchema = toZodObject(clipOutlineSchema);
const docsSchema = toZodObject(analyzeDocsSchema);
const workflowSchema = toZodObject(orchestrateWorkflowSchema);
const greetSchemaObject = toZodObject(greetSchema);

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.post(
  "/greet",
  buildHandler({
    schema: greetSchemaObject,
    action: (input) => ({ message: greet(input) }),
  }),
);

router.post(
  "/speedrun-plan",
  buildHandler({
    schema: planSchema,
    action: generateSpeedrunPlan,
  }),
);

router.post(
  "/clip-outline",
  buildHandler({
    schema: clipSchema,
    action: clipOutline,
  }),
);

router.post(
  "/analyze-docs",
  buildHandler({
    schema: docsSchema,
    action: analyzeDocs,
  }),
);

router.post(
  "/workflow",
  buildHandler({
    schema: workflowSchema,
    action: orchestrateSpeedrunWorkflow,
  }),
);

const app = express();
const UI_PORT = Number(process.env.UI_PORT ?? 4173);
const UI_HOST = process.env.UI_HOST ?? "127.0.0.1";
const STATIC_DIR = path.resolve(__dirname, "..", "..", "public");

app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use(express.static(STATIC_DIR));

app.listen(UI_PORT, UI_HOST, () => {
  console.log(
    `Speedrun Orchestrator UI available at http://${UI_HOST}:${UI_PORT}`,
  );
});

