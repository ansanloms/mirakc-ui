import { useEffect, useMemo, useRef, useState } from "react";
import * as datetime from "@std/datetime";

import type { components } from "../../../lib/api/schema.d.ts";
import Modal from "../../atoms/Modal.tsx";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import StatusBadge from "../../atoms/StatusBadge.tsx";
import { genreOf, genreVars } from "../../../lib/genre.ts";
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

  /** 録画予約一覧 (録画予約 / 録画済 タブの母集合)。 */
  schedules: Schedule[];

  /** 番組を選択する。 */
  onPick: (program: Program) => void;
};

type FilterId = "all" | "reserved" | "recorded";

/** タブの状態。録画予約 = finished 以外、録画済 = finished。 */
function isFinished(schedule: Schedule): boolean {
  return schedule.state === "finished";
}

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

  const reservedSchedules = useMemo(
    () => props.schedules.filter((s) => !isFinished(s)),
    [props.schedules],
  );
  const recordedSchedules = useMemo(
    () => props.schedules.filter((s) => isFinished(s)),
    [props.schedules],
  );

  const keyword = query.trim();

  /** 結果一覧。null は「キーワード入力を促す」状態 (all かつ未入力)。 */
  const results = useMemo<Program[] | null>(() => {
    if (filter === "reserved") {
      return reservedSchedules
        .map((s) => s.program)
        .filter((p) => matchProgram(p, keyword));
    }
    if (filter === "recorded") {
      return recordedSchedules
        .map((s) => s.program)
        .filter((p) => matchProgram(p, keyword));
    }
    if (!keyword) {
      return null;
    }
    return props.programs.filter((p) => matchProgram(p, keyword));
  }, [filter, keyword, props.programs, reservedSchedules, recordedSchedules]);

  const reservedIds = useMemo(
    () => new Set(reservedSchedules.map((s) => s.program.id)),
    [reservedSchedules],
  );
  const recordedIds = useMemo(
    () => new Set(recordedSchedules.map((s) => s.program.id)),
    [recordedSchedules],
  );

  const filters: { id: FilterId; label: string; count?: number }[] = [
    { id: "all", label: t("search.filter.all") },
    {
      id: "reserved",
      label: t("search.filter.reserved"),
      count: reservedSchedules.length,
    },
    {
      id: "recorded",
      label: t("search.filter.recorded"),
      count: recordedSchedules.length,
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
                  const reserved = reservedIds.has(program.id);
                  const recorded = recordedIds.has(program.id);
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
                              {datetime.format(
                                new Date(program.startAt),
                                "M/d H:mm",
                              )}
                            </span>
                          </span>
                        </span>
                        {recorded
                          ? <StatusBadge kind="recorded" />
                          : reserved
                          ? <StatusBadge kind="reserved" />
                          : null}
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
