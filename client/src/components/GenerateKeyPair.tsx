import Button from "@mui/material/Button";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { savePrivateKey } from "../state/persistance";
import { SetUser, useUserParams } from "../state/userActions";
import KeyIcon from "@mui/icons-material/Key";
import { addAuthHeaders, createUser, updateUser } from "../services/api";
import { generateKeyPair, sign } from "../services/keyCreation";
import { useAuthSettingsParams } from "../state/credActions";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    dispatch: userDispatch,
    state: { userId, signature },
  } = useUserParams();
  const {
    state: { stringToSign },
  } = useAuthSettingsParams();
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
  const handleGenerateKeyPairHOF = () => {
    setIsLoading(true);
    generateKeyPair()
      .then(({ publicKey, privateKey }) => {
        savePrivateKey(privateKey); //local storage
        return sign(stringToSign, privateKey).then((signature) => ({
          signature,
          publicKey,
        }));
      })
      .then(
        ({
          signature,
          publicKey,
        }: {
          signature: string;
          publicKey: string;
        }) => {
          //what to do about new users? or do I just override?
          userId === "-1"
            ? createUser(addAuthHeaders(userId, signature), publicKey).then(
                (user) => {
                  userDispatch({
                    type: SetUser.UPDATE,
                    value: {
                      ...user,
                      signature,
                    },
                  });
                }
              )
            : Promise.all([
                updateUser(
                  addAuthHeaders(userId, signature),
                  publicKey,
                  userId
                ),
                userDispatch({
                  type: SetUser.UPDATE,
                  value: {
                    userId,
                    signature,
                  },
                }),
              ]);
        }
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
        onClick={handleGenerateKeyPairHOF}
        startIcon={<KeyIcon />}
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
        {signature !== "" ? "Regenerate RSA Key Pair" : "Create RSA Key Pair"}
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
