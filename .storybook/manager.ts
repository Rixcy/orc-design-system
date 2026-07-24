import { addons } from "storybook/manager-api";

import { orcTheme } from "./orc-theme";

addons.setConfig({
  theme: orcTheme(),
});
