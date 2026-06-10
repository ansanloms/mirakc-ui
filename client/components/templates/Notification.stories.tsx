import type { Meta, StoryObj } from "@storybook/react-vite";
import Notification from "./Notification.tsx";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../../../server/lib/notification-settings.ts";

const meta = {
  title: "templates/Notification",
  component: Notification,
  parameters: { layout: "fullscreen" },
  args: {
    settings: {
      url: "https://ntfy.sh/mirakc-rec",
      token: "tk_xxxxxxxxxxxxxxxx",
      onStart: true,
      onEnd: true,
    },
    saving: false,
    testing: false,
    onSave: () => Promise.resolve(),
    onTest: () => Promise.resolve(),
    onBack: () => {},
  },
} satisfies Meta<typeof Notification>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 未設定 (既定値)。 */
export const Empty: Story = {
  args: { settings: DEFAULT_NOTIFICATION_SETTINGS },
};

/** 保存中。 */
export const Saving: Story = { args: { saving: true } };

/** テスト送信中。 */
export const Testing: Story = { args: { testing: true } };
