import { Handlers } from "$fresh/server.ts";
import * as kv from "../../../../_utils/kv.ts";
import type { Subscribe } from "../../../../_utils/kv.ts";

export const handler: Handlers = {
  PUT: async (request, context) => {
    const publicKey = context.params.publicKey;
    const subscribe = await kv.get<Subscribe>("subscribe", publicKey);

    if (!subscribe) {
      return new Response(JSON.stringify({}), {
        status: 404,
      });
    }

    // @todo: 型検査
    subscribe.subscription = await request.json() as PushSubscription;

    await kv.set<Subscribe>("subscribe", subscribe.publicKey, subscribe);

    return new Response(JSON.stringify(
      {
        publicKey: subscribe.publicKey,
        subscription: subscribe.subscription,
      },
    ));
  },
};
