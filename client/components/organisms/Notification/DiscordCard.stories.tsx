import type { Meta, StoryObj } from "@storybook/react-vite";
import DiscordCard from "./DiscordCard.tsx";

const meta = {
  title: "organisms/Notification/DiscordCard",
  component: DiscordCard,
  args: {
    webhookUrl: "https://discord.com/api/webhooks/123456789012345678/abcdef",
    testEnabled: true,
    testing: false,
    onChangeWebhookUrl: () => {},
    onTest: () => {},
  },
} satisfies Meta<typeof DiscordCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 未入力 (ヒント表示、テスト不可)。 */
export const Empty: Story = {
  args: { webhookUrl: "", testEnabled: false },
};

/** URL 形式エラー。 */
export const InvalidUrl: Story = {
  args: {
    webhookUrl: "https://example.com/not-a-webhook",
    urlError: "invalid",
    testEnabled: false,
  },
};

/** URL 必須エラー (イベント有効なのに通知先が未入力)。 */
export const RequiredUrl: Story = {
  args: { webhookUrl: "", urlError: "required", testEnabled: false },
};

/** テスト送信中。 */
export const Testing: Story = { args: { testing: true } };
