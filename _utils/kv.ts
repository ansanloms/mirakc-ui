/// <reference lib="deno.unstable" />

import * as path from "$std/path/mod.ts";
import * as fs from "$std/fs/mod.ts";

const getKv = async () => {
  fs.ensureDir(path.dirname(Deno.env.get("KV_FILEPATH")));
  return await Deno.openKv(Deno.env.get("KV_FILEPATH"));
};

export const get = async <T>(
  prefix: string,
  key: string,
): Promise<T | undefined> => {
  const entry = await (await getKv()).get<T>([prefix, key]);

  if (entry.value === null || entry.versionstamp === null) {
    return undefined;
  }

  return entry.value;
};

export const set = async <T>(
  prefix: string,
  key: string,
  data: T,
  options?: Parameters<typeof Deno.Kv.prototype.set>[2],
): Promise<void> => {
  await (await getKv()).set([prefix, key], data, options);
};

export const del = async (
  prefix: string,
  key: string,
): Promise<void> => {
  await (await getKv()).delete([prefix, key]);
};

export const list = async <T>(
  prefix: string,
): Promise<T[]> => {
  const entries = await (await getKv()).list<T>({ prefix: [prefix] });
  const result: T[] = [];

  for await (const entry of entries) {
    if (entry.value !== null && entry.versionstamp !== null) {
      result.push(entry.value);
    }
  }

  return result;
};

export type Subscribe = {
  publicKey: string;
  privateKey: string;
  subscription: PushSubscription | undefined;
};
