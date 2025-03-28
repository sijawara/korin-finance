import { Pool, QueryResult } from "pg";
import { env } from "../env";

// Initialize the pool with proper connection parameters
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10, // Limit the pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if no connection is available
});

interface ParamValue {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | string[]
    | number[]
    | boolean[];
}

const parameterizedQuery = (
  query: string,
  paramsObject: ParamValue
): Promise<QueryResult> => {
  let _query = query;
  const p: (string | number | boolean | null)[] = [];
  const paramMap = new Map<string, number>();

  // First find all @annotations in query
  const annotations = [..._query.matchAll(/@(\w+)/g)].map((m) => m[1]);

  // Process each annotation
  annotations.forEach((annotation) => {
    const regex = new RegExp(`@${annotation}\\b`, "ig");
    const value = paramsObject[annotation];

    if (value === undefined || value === null || value === "") {
      _query = _query.replace(regex, "NULL");
      return;
    }

    if (Array.isArray(value)) {
      const _values = value.filter((x) => x || x === false || x === 0) as (
        | string
        | number
        | boolean
      )[];
      _query = _query.replace(
        regex,
        _values.map((_, i) => `$${p.length + 1 + i}`).join(",")
      );
      p.push(..._values);
    } else {
      let idx = p.length + 1;
      if (!paramMap.has(annotation)) {
        p.push(value as string | number | boolean | null);
        paramMap.set(annotation, idx);
      } else {
        idx = paramMap.get(annotation)!;
      }
      _query = _query.replace(regex, `$${idx}`);
    }
  });

  console.log(_query, p);
  return pool.query(_query, p);
};

type QueryParams = (string | number | boolean | null)[] | undefined;

const db = {
  query: (text: string, params?: QueryParams): Promise<QueryResult> =>
    pool.query(text, params),
  parameterizedQuery,
  pool,
};

export default db;
