import type { ComponentProps } from "preact";
import { css } from "twind/css";
import * as datetime from "$std/datetime/mod.ts";

import type { components } from "../../../hooks/api/schema.d.ts";
import ProgramItem from "../../molecules/Program/Item.tsx";

type Props = {
  services: (components["schemas"]["MirakurunService"])[];
  programs: ComponentProps<typeof ProgramItem>["program"][];
  targetDate: Date;
  setSelectedProgram: (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => void;
};

const style = {
  container: css`
display: grid;
width: 100%;
height: 100%;
overflow: scroll;
`,
  head: css`
min-width: 12rem;
height: 4rem;
grid-row: 1 / 2;
position: sticky;
top: 0;
display: flex;
align-items: center;
justify-content: center;
`,
  item: css`
cursor: pointer;
> div {
  padding: 0.8rem;
  position: sticky;
  top: 4rem;
}
`,
  hour: css`
grid-column: 1 / 2;
position: sticky;
left: 0;
text-align: right;

> div {
  padding: 0.8rem;
  position: sticky;
  top: 4rem;
}
`,
};

const genres = {
  news: 0, // ニュース・報道
  sports: 1, // スポーツ
  wideshow: 2, // 情報・ワイドショー
  drama: 3, // ドラマ
  music: 4, // 音楽
  variety: 5, // バラエティ
  movie: 6, // 映画
  anime: 7, // アニメ・特撮
  documentary: 8, // ドキュメンタリー・教養
  performance: 9, // 劇場・公演
  education: 10, // 趣味・教育
  welfare: 11, // 福祉
  reserve1: 12, // 予備
  reserve2: 13, // 予備
  expansion: 14, // 拡張
  other: 15, // その他
} as const;

const genreColors = {
  [genres.news]: "red",
  [genres.sports]: "orange",
  [genres.wideshow]: "amber",
  [genres.drama]: "yellow",
  [genres.music]: "lime",
  [genres.variety]: "green",
  [genres.movie]: "emerald",
  [genres.anime]: "teal",
  [genres.documentary]: "cyan",
  [genres.performance]: "sky",
  [genres.education]: "blue",
  [genres.welfare]: "indigo",
  [genres.reserve1]: "gray",
  [genres.reserve2]: "gray",
  [genres.expansion]: "gray",
  [genres.other]: "gray",
};

export default function ProgramList(
  { services, programs, targetDate, setSelectedProgram }: Props,
) {
  const serviceIds = services.map((service) => service.serviceId);

  return (
    <div class={style.container}>
      {programs.map((program) => {
        const startAt = new Date(program.startAt);
        const endAt = new Date(program.startAt + program.duration);
        const baseDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          targetDate.getHours(),
        );

        // 開始終了時間の分の和。
        const start = (startAt.getTime() - baseDate.getTime()) /
          (60 * 1000);
        const end = (endAt.getTime() - baseDate.getTime()) / (60 * 1000);

        const minStart = 0;
        const maxEnd = 60 * 24;

        const index = serviceIds.findIndex((serviceId) =>
          serviceId === program.serviceId
        );

        const genre = Object.entries(genres).find(([_, v]) =>
          v === program.genres?.at(0)?.lv1
        )?.at(1);

        return (
          <div
            class={[
              style.item,
              `bg-${
                genreColors[typeof genre === "undefined" ? genres.other : genre]
              }-400`,
              "border",
              `border-${
                genreColors[typeof genre === "undefined" ? genres.other : genre]
              }-200`,
            ]}
            style={{
              gridColumn: `${index + 2} / ${index + 3}`,
              gridRow: `${(start >= minStart ? start : minStart) + 2} / ${
                (end <= maxEnd ? end : maxEnd) + 2
              }`,
            }}
            onClick={() => setSelectedProgram(program)}
          >
            <div>
              <ProgramItem program={program} />
            </div>
          </div>
        );
      })}
      {services.map((service, index) => (
        <div
          class={[style.head, "bg-white"]}
          style={{
            gridColumn: `${index + 2} / ${index + 3}`,
          }}
        >
          {service.name}
        </div>
      ))}
      {[...Array(24)].map((_, i) => i).map((hour) => {
        const date = new Date(targetDate.getTime() + hour * 60 * 60 * 1000);

        return (
          <div
            class={[style.hour, "bg-white"]}
            style={{
              gridRow: `${(hour * 60) + 2} / ${((hour + 1) * 60) + 2}`,
            }}
          >
            <div>
              <p>{datetime.format(date, "M/d")}</p>
              <p>{datetime.format(date, "H:00")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
