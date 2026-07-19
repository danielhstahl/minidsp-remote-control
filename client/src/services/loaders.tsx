import { getStatus, getExpiry } from "./api";

export const expiryLoader = async () => {
  const expiry = await getExpiry().catch(() => undefined);
  return expiry;
};

export const statusLoader = async () => {
  const status = await getStatus();
  return status;
};
