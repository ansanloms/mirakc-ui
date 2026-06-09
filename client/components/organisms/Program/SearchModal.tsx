import { useEffect, useMemo, useRef, useState } from "react";

import type { components } from "../../../lib/api/schema.d.ts";
import Modal from "../../atoms/Modal.tsx";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import ScheduleStatusBadge from "../../atoms/ScheduleStatusBadge.tsx";
import { genreOf, genreVars } from "../../../lib/genre.ts";
import { formatMdHm } from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./SearchModal.module.css";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

type Props = {
  /** 表示状況。 */
  open: boolean;

  /** モーダルを閉じる。 */
  onClose: () => void;

  /** 検索対象の番組一覧。 */
  programs: Program[];

  /** サービス一覧 (チャンネル表記の解決に使う)。 */
  services: Service[];

  /** 録画予約一覧 (録画予約タブの母集合 = 録画対象の全 state)。 */
  schedules: Schedule[];

  /** 番組を選択する。 */
  onPick: (program: Program) => void;
};

type FilterId = "all" | "reserved";

/** 番組名に query が含まれるか。 */
function matchProgram(program: Program, query: string): boolean {
  if (!query) {
    return true;
  }
  return (program.name ?? "").includes(query);
}

export default function ProgramSearchModal(props: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.open) {
      inputRef.current?.focus();
    }
  }, [props.open]);

  const findService = (program: Program): Service | undefined =>
    props.services.find(
      (s) =>
        s.networkId === program.networkId && s.serviceId === program.serviceId,
    );

  /** 番組 id → 録画スケジュール。行のステータスバッジ表示に使う。 */
  const scheduleByProgram = useMemo(() => {
    const map = new Map<Program["id"], Schedule>();
    for (const s of props.schedules) {
      map.set(s.program.id, s);
    }
    return map;
  }, [props.schedules]);

  const keyword = query.trim();

  /** 結果一覧。null は「キーワード入力を促す」状態 (all かつ未入力)。 */
  const results = useMemo<Program[] | null>(() => {
    if (filter === "reserved") {
      // 録画予約 = 録画対象の全 state を新しい順に表示する。
      return [...props.schedules]
        .sort((a, b) => b.program.startAt - a.program.startAt)
        .map((s) => s.program)
        .filter((p) => matchProgram(p, keyword));
    }
    if (!keyword) {
      return null;
    }
    return props.programs.filter((p) => matchProgram(p, keyword));
  }, [filter, keyword, props.programs, props.schedules]);

  const filters: { id: FilterId; label: string; count?: number }[] = [
    { id: "all", label: t("search.filter.all") },
    {
      id: "reserved",
      label: t("search.filter.reserved"),
      count: props.schedules.length,
    },
  ];

  return (
    <Modal open={props.open} onClose={props.onClose} align="top" hideClose>
      <div className={styles.searchModal}>
        <div className={styles.head}>
          <Icon size={20}>search</Icon>
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
          />
          {query && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => setQuery("")}
              aria-label={t("common.close")}
            >
              <Icon size={14}>close</Icon>
            </button>
          )}
          <button
            type="button"
            className={styles.close}
            onClick={props.onClose}
          >
            {t("search.cancel")}
          </button>
        </div>

        <div className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterTab} ${
                filter === f.id ? styles.filterTabActive : ""
              }`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={styles.filterCount}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.results}>
          {results === null
            ? (
              <div className={styles.empty}>
                <Icon size={38}>search</Icon>
                <p className={styles.emptyTitle}>{t("search.emptyPrompt")}</p>
                <span className={styles.emptyHint}>
                  {t("search.emptyHint")}
                </span>
              </div>
            )
            : results.length === 0
            ? (
              <div className={styles.empty}>
                <Icon size={38}>search_off</Icon>
                <p className={styles.emptyTitle}>{t("search.noResults")}</p>
              </div>
            )
            : (
              <ul className={styles.list}>
                {results.map((program) => {
                  const service = findService(program);
                  const genre = genreOf(program);
                  const schedule = scheduleByProgram.get(program.id);
                  return (
                    <li key={program.id}>
                      <button
                        type="button"
                        className={styles.row}
                        onClick={() => props.onPick(program)}
                      >
                        <span
                          className={styles.rowDot}
                          style={{ background: genreVars(genre.key).strong }}
                        />
                        <span className={styles.rowMain}>
                          <span className={styles.rowTitle}>
                            {program.name}
                          </span>
                          <span className={styles.rowMeta}>
                            {service && (
                              <ChannelBadge service={service} size="xs" />
                            )}
                            {service && <span>{service.name}</span>}
                            <span>
                              {formatMdHm(program.startAt)}
                            </span>
                          </span>
                        </span>
                        {schedule && (
                          <ScheduleStatusBadge state={schedule.state} />
                        )}
                        <Icon size={16}>chevron_right</Icon>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </div>
    </Modal>
  );
}
