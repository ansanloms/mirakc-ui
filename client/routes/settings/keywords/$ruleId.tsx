import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { $api } from "../../../lib/api/client.ts";
import {
  fetchKeywordRules,
  type KeywordRuleInput,
  updateKeywordRule,
} from "../../../lib/api/keyword-rules.ts";
import { buildUpcoming } from "../../../lib/keyword-preview.ts";
import { buildChannelGroups } from "../../../lib/service.ts";
import { useNow } from "../../../hooks/use-now.ts";
import RuleFormModal from "../../../components/organisms/KeywordRules/RuleFormModal.tsx";

export const Route = createFileRoute("/settings/keywords/$ruleId")({
  component: EditKeywordRuleModal,
});

/** キーワードルールの編集モーダル。URL の ruleId から対象を引いて表示する。 */
function EditKeywordRuleModal() {
  const { ruleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentEpochMs = useNow(60_000);
  const rules = useQuery({
    queryKey: ["keyword-rules"],
    queryFn: () => fetchKeywordRules(),
  });
  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");
  const programs = $api.useQuery("get", "/programs");

  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const rule = (rules.data ?? []).find((r) => r.id === ruleId);

  const close = () => navigate({ to: "/settings/keywords" });

  // 読み込み完了後も対象が無い (削除済み等) なら一覧へ戻す。
  useEffect(() => {
    if (!rules.isPending && rule === undefined) {
      close();
    }
  }, [rules.isPending, rule]);

  const update = useMutation({
    mutationFn: (input: KeywordRuleInput) => updateKeywordRule(ruleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyword-rules"] });
      close();
    },
  });

  const upcoming = useMemo(
    () =>
      buildUpcoming(programs.data ?? [], services.data ?? [], currentEpochMs),
    [programs.data, services.data, currentEpochMs],
  );

  if (rule === undefined) {
    return null;
  }

  return (
    <RuleFormModal
      open
      initial={rule}
      channels={channelGroups}
      upcoming={upcoming}
      busy={update.isPending}
      onSave={(input) => update.mutate(input)}
      onClose={close}
    />
  );
}
