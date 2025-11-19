import SSLNotification from "../components/SSLNotification";

import { Outlet, useLoaderData } from "react-router";

const ExpiryWrapper = () => {
  const expiryDate = useLoaderData<Date | undefined>();
  return (
    <>
      <Outlet />
      {expiryDate && (
        <SSLNotification currentDate={new Date()} expiryDate={expiryDate} />
      )}
    </>
  );
};
export default ExpiryWrapper;
