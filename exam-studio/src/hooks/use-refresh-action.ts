import { useState } from "react";

export const useRefreshAction = (action: () => Promise<unknown>) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      await action();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    onRefresh,
  };
};
