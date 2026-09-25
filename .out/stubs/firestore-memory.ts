export type FirestoreStubShape = any;

type D = Record<string, any>;

type Snap = {
  id: string;
  ref: DocRefShape;
  exists: boolean;
  data: () => D | undefined;
  get: (field: string) => any;
};

type DocRefShape = {
  id: string;
  path: string;
  get: () => Promise<Snap>;
  set: (d: D, opts?: { merge?: boolean }) => Promise<any>;
  create: (d: D) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
  delete: () => Promise<any>;
  collection: (subCol: string) => ColRefShape;
  _data: () => D | undefined;
  _mutate: (fn: (prev: D | undefined) => D | undefined) => void;
};

type QueryShape = {
  get: () => Promise<{
    docs: Snap[];
    size: number;
    empty: boolean;
    forEach: (fn: (s: Snap) => void) => void;
  }>;
  where: (field: string, op: string, val: any) => QueryShape;
  orderBy: (field: string, dir?: "asc" | "desc") => QueryShape;
  limit: (n: number) => QueryShape;
  offset: (n: number) => QueryShape;
  select: (...fields: string[]) => QueryShape;
  startAfter: (...docsOrFields: any[]) => QueryShape;
  endBefore: (...docsOrFields: any[]) => QueryShape;
};

type ColRefShape = QueryShape & {
  id: string;
  path: string;
  doc: (id?: string) => DocRefShape;
  add: (d: D) => Promise<DocRefShape>;
  listDocuments: () => Promise<DocRefShape[]>;
  get: QueryShape["get"];
};

function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function snapFromDoc(doc: DocRefShape): Snap {
  const data = doc._data();
  return {
    id: doc.id,
    ref: doc,
    exists: data !== undefined,
    data: () => data,
    get: (field: string) => {
      if (data === undefined) return undefined;
      const parts = field.split(".");
      let cur: any = data;
      for (const p of parts) {
        if (cur == null) return undefined;
        cur = (cur as any)[p];
      }
      return cur;
    },
  };
}

function filterMatch(doc: DocRefShape, whereClauses: [string, string, any][]): boolean {
  const data = doc._data();
  if (data === undefined) return false;
  for (const [field, op, val] of whereClauses) {
    const parts = field.split(".");
    let cur: any = data;
    for (const p of parts) {
      if (cur == null) return false;
      cur = (cur as any)[p];
    }
    switch (op) {
      case "==":
      case "=":
        if (cur !== val) return false;
        break;
      case "!=":
        if (cur === val) return false;
        break;
      case ">":
        if (!(cur > val)) return false;
        break;
      case "<":
        if (!(cur < val)) return false;
        break;
      case ">=":
        if (!(cur >= val)) return false;
        break;
      case "<=":
        if (!(cur <= val)) return false;
        break;
      case "in":
        if (!Array.isArray(val) || !val.includes(cur)) return false;
        break;
      case "not-in":
        if (Array.isArray(val) && val.includes(cur)) return false;
        break;
      case "array-contains":
        if (!Array.isArray(cur) || !cur.includes(val)) return false;
        break;
      case "array-contains-any":
        if (!Array.isArray(val) || !Array.isArray(cur)) return false;
        if (!cur.some((v) => val.includes(v))) return false;
        break;
      default:
        throw new Error(`Unknown where op ${op}`);
    }
  }
  return true;
}

export function buildMemoryFirestore(): any {
  const state = new Map<string, D>();
  // path -> data (including root docs)

  function listColDocs(colPath: string): DocRefShape[] {
    const prefix = colPath + "/";
    const ids = new Set<string>();
    for (const p of state.keys()) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      // id is first segment (before next '/')
      const slash = rest.indexOf("/");
      const id = slash === -1 ? rest : rest.slice(0, slash);
      if (!id.includes("/")) ids.add(id);
    }
    return Array.from(ids).map((id) => buildDoc(`${colPath}/${id}`));
  }

  function buildDoc(path: string): DocRefShape {
    const parts = path.split("/").filter(Boolean);
    const id = parts[parts.length - 1]!;
    const ref: DocRefShape = {
      id,
      path,
      get: () => Promise.resolve(snapFromDoc(ref)),
      set: async (d: D, opts) => {
        const prev = state.get(path);
        if (opts?.merge && prev) {
          const merged = deepMerge(prev, d);
          state.set(path, merged);
        } else {
          state.set(path, { ...d });
        }
        return { writeTime: _ts() };
      },
      create: async (d: D) => {
        if (state.has(path)) {
          const err = new Error(`Document already exists: ${path}`) as any;
          err.code = 6;
          throw err;
        }
        state.set(path, { ...d });
        return { writeTime: _ts() };
      },
      update: async (...args: any[]) => {
        let fields: Record<string, any>;
        if (args.length === 1 && typeof args[0] === "object") {
          fields = args[0];
        } else {
          fields = {};
          for (let i = 0; i < args.length; i += 2) {
            fields[args[i]] = args[i + 1];
          }
        }
        const prev = state.get(path);
        if (!prev) {
          const err = new Error(`Document not found: ${path}`) as any;
          err.code = 5;
          throw err;
        }
        let next = { ...prev };
        for (const [k, v] of Object.entries(fields)) {
          setAtPath(next, k, v);
        }
        state.set(path, next);
        return { writeTime: _ts() };
      },
      delete: async () => {
        state.delete(path);
        return { writeTime: _ts() };
      },
      collection: (subCol) => buildCol(`${path}/${subCol}`),
      _data: () => state.get(path),
      _mutate: (fn) => {
        const prev = state.get(path);
        const next = fn(prev);
        if (next === undefined) state.delete(path);
        else state.set(path, next);
      },
    };
    return ref;
  }

  function buildQuery(
    colPath: string,
    clauses: [string, string, any][],
    orders: [string, "asc" | "desc"][],
    lim?: number,
    off?: number,
    selectFields?: string[]
  ): QueryShape {
    const self: QueryShape = {
      where: (field, op, val) =>
        buildQuery(colPath, [...clauses, [field, op, val]], orders, lim, off, selectFields),
      orderBy: (field, dir = "asc") =>
        buildQuery(colPath, clauses, [...orders, [field, dir]], lim, off, selectFields),
      limit: (n) =>
        buildQuery(colPath, clauses, orders, n, off, selectFields),
      offset: (n) =>
        buildQuery(colPath, clauses, orders, lim, n, selectFields),
      select: (...fields) =>
        buildQuery(colPath, clauses, orders, lim, off, fields),
      get: async () => {
        const docs = listColDocs(colPath);
        let out = docs.filter((d) => filterMatch(d, clauses));
        if (orders.length) {
          out = out.sort((a, b) => {
            const da = a._data();
            const db = b._data();
            for (const [field, dir] of orders) {
              const av = getAtPath(da ?? {}, field);
              const bv = getAtPath(db ?? {}, field);
              if (av === bv) continue;
              if (av == null) return dir === "asc" ? -1 : 1;
              if (bv == null) return dir === "asc" ? 1 : -1;
              if (av < bv) return dir === "asc" ? -1 : 1;
              if (av > bv) return dir === "asc" ? 1 : -1;
            }
            return 0;
          });
        }
        if (off) out = out.slice(off);
        if (typeof lim === "number") out = out.slice(0, lim);
        const snaps = out.map(snapFromDoc);
        return {
          docs: snaps,
          size: snaps.length,
          empty: snaps.length === 0,
          forEach: (fn) => snaps.forEach(fn),
        };
      },
    };
    return self;
  }

  function buildCol(colPath: string): ColRefShape {
    const q = buildQuery(colPath, [], []);
    return {
      id: colPath.split("/").filter(Boolean).pop() ?? colPath,
      path: colPath,
      doc: (id) => {
        const iid = id || newId();
        return buildDoc(`${colPath}/${iid}`);
      },
      add: async (d) => {
        const doc = buildDoc(`${colPath}/${newId()}`);
        await doc.set(d);
        return doc;
      },
      listDocuments: async () => listColDocs(colPath),
      ...q,
    };
  }

  const root: any = {
    collection: (path: string) => buildCol(path),
    doc: (path: string) => buildDoc(path),
    runTransaction: async (updateFn: (tx: any) => Promise<any>) => {
      const txSnapshots = new Map<string, any>();
      const txWrites = new Map<string, D | undefined>();
      const tx: any = {
        get: async (refOrQuery: any) => {
          // detect docRef (has id, path, and collection method) vs query
          const isDocRef =
            typeof refOrQuery.id === "string" &&
            typeof refOrQuery.path === "string" &&
            typeof refOrQuery.collection === "function";
          if (isDocRef) {
            const ref: DocRefShape = refOrQuery;
            const cacheKey = `doc:${ref.path}`;
            if (txSnapshots.has(cacheKey)) return txSnapshots.get(cacheKey);
            const snap = await ref.get();
            txSnapshots.set(cacheKey, snap);
            return snap;
          }
          const cacheKey = `query:${Math.random().toString(36).slice(2)}`;
          const qSnap = await refOrQuery.get();
          txSnapshots.set(cacheKey, qSnap);
          return qSnap;
        },
        getAll: async (refs: DocRefShape[]) => Promise.all(refs.map((r) => tx.get(r))),
        set: (ref: DocRefShape, d: D, opts?: { merge?: boolean }) => {
          const prev = state.get(ref.path) ?? txSnapshots.get(ref.path);
          let next: D;
          if (opts?.merge && prev) next = deepMerge(prev, d);
          else next = { ...d };
          txWrites.set(ref.path, next);
          return tx;
        },
        create: (ref: DocRefShape, d: D) => {
          if (txWrites.has(ref.path) || state.has(ref.path)) {
            const e = new Error(`create on existing doc ${ref.path}`) as any;
            e.code = 6;
            throw e;
          }
          txWrites.set(ref.path, { ...d });
          return tx;
        },
        update: (ref: DocRefShape, ...args: any[]) => {
          let fields: Record<string, any>;
          if (args.length === 1 && typeof args[0] === "object") {
            fields = args[0];
          } else {
            fields = {};
            for (let i = 0; i < args.length; i += 2) fields[args[i]] = args[i + 1];
          }
          const prev = txWrites.get(ref.path) ?? state.get(ref.path) ?? txSnapshots.get(ref.path);
          if (!prev) {
            const e = new Error(`update missing doc ${ref.path}`) as any;
            e.code = 5;
            throw e;
          }
          let next = { ...prev };
          for (const [k, v] of Object.entries(fields)) setAtPath(next, k, v);
          txWrites.set(ref.path, next);
          return tx;
        },
        delete: (ref: DocRefShape) => {
          txWrites.set(ref.path, undefined);
          return tx;
        },
      };
      let attempt = 0;
      while (attempt < 3) {
        txSnapshots.clear();
        txWrites.clear();
        try {
          const res = await updateFn(tx);
          for (const [p, v] of txWrites.entries()) {
            if (v === undefined) state.delete(p);
            else state.set(p, v);
          }
          return res;
        } catch (err) {
          attempt++;
          if (attempt >= 3) throw err;
        }
      }
    },
    batch: () => {
      const ops: { ref: DocRefShape; kind: string; args: any[] }[] = [];
      return {
        set: (ref: DocRefShape, ...rest: any[]) => { ops.push({ ref, kind: "set", args: rest }); return this; },
        create: (ref: DocRefShape, ...rest: any[]) => { ops.push({ ref, kind: "create", args: rest }); return this; },
        update: (ref: DocRefShape, ...rest: any[]) => { ops.push({ ref, kind: "update", args: rest }); return this; },
        delete: (ref: DocRefShape) => { ops.push({ ref, kind: "delete", args: [] }); return this; },
        commit: async () => {
          const out: any[] = [];
          for (const op of ops) {
            let r: any;
            switch (op.kind) {
              case "set": r = await op.ref.set(op.args[0], op.args[1]); break;
              case "create": r = await op.ref.create(op.args[0]); break;
              case "update": r = await op.ref.update(...op.args); break;
              case "delete": r = await op.ref.delete(); break;
            }
            out.push(r);
          }
          return out;
        },
      };
    },
    FieldValue: {
      serverTimestamp: () => new Date().toISOString(),
      increment: (n: number) => ({ __op: "increment", value: n }),
      arrayUnion: (...items: any[]) => ({ __op: "arrayUnion", value: items }),
      arrayRemove: (...items: any[]) => ({ __op: "arrayRemove", value: items }),
      delete: () => ({ __op: "delete" }),
    },
    Timestamp: {
      now: () => ({ _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }),
      fromMillis: (ms: number) => ({ _seconds: Math.floor(ms / 1000), _nanoseconds: (ms % 1000) * 1e6 }),
      fromDate: (d: Date) => ({ _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: (d.getTime() % 1000) * 1e6 }),
    },
    _dump: () => state,
    _clear: () => state.clear(),
  };
  return root;
}

function _ts(): any {
  return new Date().toISOString();
}

function deepMerge(a: D, b: D): D {
  const out: D = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && !isFieldValue(v)) {
      out[k] = deepMerge((a?.[k] as D) ?? {}, v as D);
    } else if (isFieldValue(v)) {
      out[k] = applyFieldValue(a?.[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function isFieldValue(v: any): boolean {
  return v && typeof v === "object" && typeof v.__op === "string";
}

function applyFieldValue(prev: any, v: any): any {
  switch (v.__op) {
    case "increment":
      return (typeof prev === "number" ? prev : 0) + (Number(v.value) || 0);
    case "arrayUnion": {
      const arr = Array.isArray(prev) ? prev.slice() : [];
      for (const it of v.value) if (!arr.includes(it)) arr.push(it);
      return arr;
    }
    case "arrayRemove": {
      if (!Array.isArray(prev)) return [];
      return prev.filter((it) => !v.value.includes(it));
    }
    case "delete":
      return undefined;
    default:
      return prev;
  }
}

function setAtPath(obj: D, path: string, val: any): void {
  const parts = path.split(".");
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  const last = parts[parts.length - 1]!;
  if (isFieldValue(val)) cur[last] = applyFieldValue(cur?.[last], val);
  else if (val?.__op === "delete") delete cur[last];
  else cur[last] = val;
}

function getAtPath(obj: D, path: string): any {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
