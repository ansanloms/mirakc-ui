import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { $api } from "../../../lib/api/client.ts";
import {
  addKeywordRule,
  type KeywordRuleInput,
} from "../../../lib/api/keyword-rules.ts";
import { buildUpcoming } from "../../../lib/keyword-preview.ts";
import { buildChannelGroups } from "../../../lib/service.ts";
import { useNow } from "../../../hooks/use-now.ts";
import RuleFormModal from "../../../components/organisms/KeywordRules/RuleFormModal.tsx";

export const Route = createFileRoute("/settings/keywords/new")({
  component: NewKeywordRuleModal,
});

/** キーワードルールの新規登録モーダル。閉じる = 一覧へ戻る。 */
function NewKeywordRuleModal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentEpochMs = useNow(60_000);
  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");
  const programs = $api.useQuery("get", "/programs");

  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const close = () => navigate({ to: "/settings/keywords" });

  const add = useMutation({
    mutationFn: (input: KeywordRuleInput) => addKeywordRule(input),
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

  return (
    <RuleFormModal
      open
      channels={channelGroups}
      upcoming={upcoming}
      busy={add.isPending}
      onSave={(input) => add.mutate(input)}
      onClose={close}
    />
  );
}
