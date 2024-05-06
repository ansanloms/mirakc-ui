import { Handlers } from "$fresh/server.ts";
import webpush from "web-push/index.js";
import * as kv from "../../../../_utils/kv.ts";
import type { Subscribe } from "../../../../_utils/kv.ts";

export const handler: Handlers = {
  POST: async (request) => {
    const vapIdKeys = webpush.generateVAPIDKeys();

    await kv.set<Subscribe>("subscribe", vapIdKeys.publicKey, {
      ...vapIdKeys,
      subscription: undefined,
    });

    return new Response(JSON.stringify(
      {
        publicKey: vapIdKeys.publicKey,
      },
    ));
  },
};
