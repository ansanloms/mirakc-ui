import type { Meta, StoryObj } from "@storybook/react-vite";
import ServerCard from "./ServerCard.tsx";

const meta = {
  title: "organisms/Notification/ServerCard",
  component: ServerCard,
  args: {
    url: "https://ntfy.sh/mirakc-rec",
    token: "tk_xxxxxxxxxxxxxxxx",
    testEnabled: true,
    testing: false,
    onChangeUrl: () => {},
    onChangeToken: () => {},
    onTest: () => {},
  },
} satisfies Meta<typeof ServerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 未入力 (ヒント表示、テスト不可)。 */
export const Empty: Story = {
  args: { url: "", token: "", testEnabled: false },
};

/** URL 形式エラー。 */
export const InvalidUrl: Story = {
  args: { url: "ntfy.sh/topic", urlError: "invalid", testEnabled: false },
};

/** URL 必須エラー (イベント有効なのに未入力)。 */
export const RequiredUrl: Story = {
  args: { url: "", urlError: "required", testEnabled: false },
};

/** テスト送信中。 */
export const Testing: Story = { args: { testing: true } };
