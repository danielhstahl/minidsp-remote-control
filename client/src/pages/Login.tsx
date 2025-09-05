import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useFetcher, useParams } from "react-router";
import Alert from "@mui/material/Alert";
const Login = () => {
  const fetcher = useFetcher();
  const params = useParams();
  return (
    <fetcher.Form
      noValidate
      autoComplete="off"
      method="post"
      action="/login"
      style={{ width: "100%" }}
    >
      {params.ip && (
        <Alert severity="info">
          Your IP is not allowed to access this application. Check with your
          admin to be granted access. If you are an admin, enter the password
          below.
        </Alert>
      )}
      <TextField
        label="Password"
        name="password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        required
        sx={{ borderRadius: 2 }}
      />
      <Button
        type="submit" // Crucial: triggers form submission
        variant="contained"
        color="primary"
        fullWidth
        loading={fetcher.state !== "idle"}
        sx={{ mt: 3, mb: 2, borderRadius: 2 }}
      >
        Log In
      </Button>
      {fetcher.data?.error && (
        <Alert severity="error">{fetcher.data?.error.message}</Alert>
      )}
    </fetcher.Form>
  );
};

export default Login;
