import Button from "@mui/material/Button";
import CachedIcon from "@mui/icons-material/Cached";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { addAuthHeaders, generateCert } from "../services/api";
import { useUserParams } from "../state/userActions";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    state: { userId, signature },
  } = useUserParams();
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
    generateCert(addAuthHeaders(userId, signature))
      .then(() => {
        setMessage({
          isMessageOpen: true,
          messageType: "success",
        });
      })
      .catch((e) => {
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
        Re-generate certs
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
