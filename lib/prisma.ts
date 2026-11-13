import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "@/src/prisma/contract.d";
import contractJson from "@/src/prisma/contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

const createDb = () =>
  postgres({
    contract,
    url: process.env.DATABASE_URL!,
  });

type DbClient = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db?: DbClient };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;