/**
 * チャンネル (networkId / serviceId) → ニコニコ実況チャンネル ID の解決。
 *
 * 対照表 jikkyo-channels.json は KonomiTV (MIT License, Copyright 2021-2026
 * tsukumi) の server/static/jikkyo_channels.json を同梱したもの
 * (https://github.com/tsukumijima/KonomiTV)。元データは NicoJK の jkch.sh.txt
 * (https://github.com/xtne6f/NicoJK)。ライセンス全文はリポジトリ直下の
 * THIRD_PARTY_NOTICES.md を参照。照合ロジックも KonomiTV の
 * JikkyoClient.__getJikkyoChannelID を TypeScript に移植した。
 */

import jikkyoChannels from "./jikkyo-channels.json" with { type: "json" };

type JikkyoChannel = {
  jikkyo_id: number;
  network_id: number;
  service_id: string;
  area: string;
  channel_name: string;
};

const CHANNELS: JikkyoChannel[] = jikkyoChannels;

/**
 * 実況チャンネル ID → ニコニコチャンネル ID (本家ニコニコ実況の放送チャンネル)。
 * ニコ生では /watch/{ニコニコチャンネル ID} で放送中番組へアクセスできる。
 * 対応の無い実況チャンネル (BS 民放等) は NX-Jikkyo にのみ存在する。
 * 出典: NDGRClient (MIT) の JIKKYO_CHANNEL_ID_MAP
 * (https://github.com/tsukumijima/NDGRClient)。
 */
const NICOLIVE_CHANNEL_ID_OF: Record<string, string> = {
  jk1: "ch2646436",
  jk2: "ch2646437",
  jk4: "ch2646438",
  jk5: "ch2646439",
  jk6: "ch2646440",
  jk7: "ch2646441",
  jk8: "ch2646442",
  jk9: "ch2646485",
  jk13: "ch2649860",
  jk101: "ch2647992",
  jk211: "ch2646846",
};

/** 地上波のネットワーク ID 範囲 (ARIB)。 */
const TERRESTRIAL_NID_MIN = 0x7880;
const TERRESTRIAL_NID_MAX = 0x7fef;

function matches(
  channel: JikkyoChannel,
  networkId: number,
  serviceId: number,
): boolean {
  // service_id は地上波が 16 進文字列 ("0x0400")、BS/CS が 10 進文字列 ("101")。
  const channelServiceId = Number(channel.service_id);

  // NID と SID の完全一致 (BS・CS はこれだけで OK)。
  if (channel.network_id === networkId && channelServiceId === serviceId) {
    return true;
  }

  // 地上波: 実際の NID は局ごとに異なるが対照表は network_id = 15 固定の
  // ため、地上波の NID 範囲であれば SID のみで照合する。サブチャンネル
  // (NHK総合2 等) は対照表に無いので SID-1 / SID-2 もみる (地上波の SID は
  // 別チャンネルと隣り合わないよう割り当てられている)。
  if (
    TERRESTRIAL_NID_MIN <= networkId && networkId <= TERRESTRIAL_NID_MAX &&
    channel.network_id === 15
  ) {
    return serviceId === channelServiceId ||
      serviceId - 1 === channelServiceId ||
      serviceId - 2 === channelServiceId;
  }

  return false;
}

/**
 * networkId / serviceId に対応する実況チャンネル ID (例: "jk1") を返す。
 * 対応する実況チャンネルが無ければ null。
 */
export function jikkyoIdOf(
  networkId: number,
  serviceId: number,
): string | null {
  for (const channel of CHANNELS) {
    if (channel.jikkyo_id !== -1 && matches(channel, networkId, serviceId)) {
      return `jk${channel.jikkyo_id}`;
    }
  }
  return null;
}

/**
 * networkId / serviceId に対応する本家ニコニコ実況のニコニコチャンネル ID
 * (例: "ch2646436") を返す。本家に実況チャンネルが無ければ null
 * (NX-Jikkyo 専用チャンネルを含む)。
 */
export function nicoliveChannelIdOf(
  networkId: number,
  serviceId: number,
): string | null {
  const jikkyoId = jikkyoIdOf(networkId, serviceId);
  if (jikkyoId === null) {
    return null;
  }
  return NICOLIVE_CHANNEL_ID_OF[jikkyoId] ?? null;
}
