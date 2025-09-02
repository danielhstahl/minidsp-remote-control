import Button from "@mui/material/Button";
import CachedIcon from "@mui/icons-material/Cached";
import Message from "./Message";
import { useState } from "react";
import type { AlertColor } from "@mui/material";
import { addBasicAuthHeader, generateCert, getExpiry } from "../services/api";
import { useExpiryParams, SetExpiryEnum } from "../state/expiryActions";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = ({ adminPassword }: { adminPassword: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch: expiryDispatch } = useExpiryParams();
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
  const handleCertHOF = () => {
    setIsLoading(true);
    generateCert(addBasicAuthHeader(adminPassword))
      .then(() => getExpiry())
      .then((expiry) =>
        expiryDispatch({ type: SetExpiryEnum.UPDATE, value: expiry }),
      )
      .then(() => {
        setMessage({
          isMessageOpen: true,
          messageType: "success",
        });
      })
      .catch(() => {
        setMessage({
          isMessageOpen: true,
          messageType: "error",
        });
      })
      .finally(() => setIsLoading(false));
  };
  return (
    <>
      <Button
        loading={isLoading}
        variant="contained"
        onClick={handleCertHOF}
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
      <Message
        open={message.isMessageOpen}
        type={message.messageType}
        handleClose={setMessageClose}
      />
    </>
  );
};

export default GenerateCerts;
