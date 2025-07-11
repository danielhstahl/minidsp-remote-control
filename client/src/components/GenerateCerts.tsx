import Button from "@mui/material/Button";
import CachedIcon from "@mui/icons-material/Cached";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { addAuthHeaders, generateCert, getExpiry } from "../services/api";
import { useUserParams } from "../state/userActions";
import { useExpiryParams, SetExpiry } from "../state/expiryActions";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    state: { userId, jwt },
  } = useUserParams();
  const {
    dispatch: expiryDispatch,
  } = useExpiryParams();
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
    generateCert(addAuthHeaders(userId, jwt)).then(() => getExpiry({})).then((expiry) =>
      expiryDispatch({ type: SetExpiry.UPDATE, value: expiry })
    )
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
