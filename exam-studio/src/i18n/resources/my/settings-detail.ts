import about from "./settings-detail/about";
import account from "./settings-detail/account";
import help from "./settings-detail/help";
import legal from "./settings-detail/legal";
import notifications from "./settings-detail/notifications";
import security from "./settings-detail/security";
import storage from "./settings-detail/storage";
import subscription from "./settings-detail/subscription";
import support from "./settings-detail/support";

const settingsDetail = {
  account,
  legal,
  storage,
  notifications,
  support,
  security,
  subscription,
  about,
  help,
} as const;

export default settingsDetail;
