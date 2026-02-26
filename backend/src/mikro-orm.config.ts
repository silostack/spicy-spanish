import { Options } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import * as dotenv from "dotenv";

dotenv.config();

const config: Options = {
  type: "postgresql",
  dbName: process.env.MIKRO_ORM_DB_NAME,
  user: process.env.MIKRO_ORM_USER,
  password: process.env.MIKRO_ORM_PASSWORD,
  host: process.env.MIKRO_ORM_HOST,
  port: parseInt(process.env.MIKRO_ORM_PORT || "5432", 10),
  entities: ["dist/**/*.entity.js"],
  entitiesTs: ["src/**/*.entity.ts"],
  metadataProvider: TsMorphMetadataProvider,
  highlighter: new SqlHighlighter(),
  debug: process.env.NODE_ENV === "development",
  migrations: {
    path: "./dist/migrations",
    pathTs: "./src/migrations",
  },
};

export default config;
