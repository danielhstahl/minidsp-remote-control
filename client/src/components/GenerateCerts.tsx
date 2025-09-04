import Button from "@mui/material/Button";
import CachedIcon from "@mui/icons-material/Cached";
import Message from "./Message";
import { useEffect, useState } from "react";
import type { AlertColor } from "@mui/material";
//import { addBasicAuthHeader, generateCert, getExpiry } from "../services/api";
import { useFetcher } from "react-router";
//import { useExpiryParams, SetExpiryEnum } from "../state/expiryActions";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = () => {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [message, setMessage] = useState<MessageHandle>({
    isMessageOpen: false,
    messageType: "success",
  });
  const setMessageClose = () => {
    setMessage({
      isMessageOpen: false,
      messageType: "success",
    });
  };
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        setMessage({
          isMessageOpen: true,
          messageType: "success",
        });
      } else {
        setMessage({
          isMessageOpen: true,
          messageType: "error",
        });
      }
    }
  }, [fetcher.data]);
  return (
    <>
      <fetcher.Form method="post" action="/settings/cert">
        <Button
          fullWidth
          loading={busy}
          variant="contained"
          type="submit"
          startIcon={<CachedIcon />}
          sx={{
            "& .MuiButton-endIcon": {
              position: "absolute",
              right: "1rem",
            },
            "& .MuiButton-startIcon": {
              position: "absolute",
              left: "1rem",
            },
          }}
        >
          Generate certs
        </Button>
      </fetcher.Form>

      <Message
        open={message.isMessageOpen}
        type={message.messageType}
        handleClose={setMessageClose}
      />
    </>
  );
};

export default GenerateCerts;
