import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useRouteError } from "react-router";

const ErrorPage = () => {
  const error = useRouteError() as Error;
  return (
    <Alert severity="error">
      <AlertTitle>Uh oh, looks like something went wrong</AlertTitle>
      {error.message}
    </Alert>
  );
};
export default ErrorPage;
