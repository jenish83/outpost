import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig, prisma7Schema } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
  orm: ormConfig({
    contract: prisma7Schema("prisma/schema.prisma"),
    output: "src/prisma",
    db: {
      connection: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  }),
});
