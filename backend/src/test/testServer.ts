import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "test-secret";
process.env.LOCAL_AI_URL = process.env.LOCAL_AI_URL || "http://127.0.0.1:11434";
process.env.LOCAL_AI_MODEL = process.env.LOCAL_AI_MODEL || "speaklio-parser";

type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

export type QueryOperation = {
  method: string;
  args: unknown[];
};

export type MockQuery = {
  table: string;
  operations: QueryOperation[];
  body: unknown;
};

export type SupabaseTableHandler = (query: MockQuery) => QueryResult | Promise<QueryResult>;

class QueryBuilder {
  table: string;
  operations: QueryOperation[] = [];
  body: unknown;

  constructor(
    table: string,
    private readonly handler: SupabaseTableHandler,
  ) {
    this.table = table;
  }

  private record(method: string, args: unknown[]) {
    this.operations.push({ method, args });
    return this;
  }

  private query(): MockQuery {
    return {
      table: this.table,
      operations: this.operations,
      body: this.body,
    };
  }

  select(...args: unknown[]) { return this.record("select", args); }
  eq(...args: unknown[]) { return this.record("eq", args); }
  gte(...args: unknown[]) { return this.record("gte", args); }
  lte(...args: unknown[]) { return this.record("lte", args); }
  order(...args: unknown[]) { return this.record("order", args); }
  limit(...args: unknown[]) { return this.record("limit", args); }
  range(...args: unknown[]) { return this.record("range", args); }

  insert(body: unknown) {
    this.body = body;
    return this.record("insert", [body]);
  }

  update(body: unknown) {
    this.body = body;
    return this.record("update", [body]);
  }

  upsert(body: unknown) {
    this.body = body;
    return this.record("upsert", [body]);
  }

  delete() {
    return this.record("delete", []);
  }

  maybeSingle() {
    return this.handler(this.query());
  }

  single() {
    return this.handler(this.query());
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.handler(this.query())).then(onfulfilled, onrejected);
  }
}

export async function createRouteTestServer(handlers: Record<string, SupabaseTableHandler>) {
  const { createApp } = await import("../app.js");
  const { supabaseAdmin } = await import("../services/supabase.js");
  const originalGetUser = supabaseAdmin.auth.getUser;
  const originalFrom = supabaseAdmin.from;

  supabaseAdmin.auth.getUser = (async (token: string) => {
    if (token !== "test-token") {
      return { data: { user: null }, error: { message: "Invalid token" } };
    }

    return {
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
          created_at: "2026-07-18T00:00:00.000Z",
        },
      },
      error: null,
    };
  }) as unknown as typeof supabaseAdmin.auth.getUser;

  supabaseAdmin.from = ((table: string) => {
    const handler = handlers[table];
    if (!handler) {
      throw new Error(`No Supabase test handler for table ${table}`);
    }
    return new QueryBuilder(table, handler);
  }) as unknown as typeof supabaseAdmin.from;

  const server = createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://${address.address}:${address.port}`;

  return {
    baseUrl,
    request(path: string, init: RequestInit = {}) {
      return fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          authorization: "Bearer test-token",
          ...(init.body ? { "content-type": "application/json" } : {}),
          ...(init.headers || {}),
        },
      });
    },
    async close() {
      supabaseAdmin.auth.getUser = originalGetUser;
      supabaseAdmin.from = originalFrom;
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
