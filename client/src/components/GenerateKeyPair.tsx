import Button from "@mui/material/Button";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { savePrivateKey, saveUserId } from "../state/persistance";
import { SetUser, useUserParams } from "../state/userActions";
import KeyIcon from "@mui/icons-material/Key";
import { addAuthHeaders, createUser, updateUser, UserId } from "../services/api";
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
    state: { userId, signature: originalSignature },
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
  const handleGenerateKeyPairHOF = async () => {
    setIsLoading(true);
    const { publicKey, privateKey } = await generateKeyPair()
    savePrivateKey(privateKey); //local storage
    const signature = await sign(stringToSign, privateKey)

    const userPromise: Promise<UserId> = userId === "-1" ?
      //no user yet, so create one
      createUser(addAuthHeaders(userId, originalSignature), publicKey).then(
        (user) => {
          saveUserId(user.userId)
          return user
        },
      ) :
      //user exists, so update
      updateUser(
        addAuthHeaders(userId, originalSignature),
        publicKey,
        userId,
      )
    await userPromise.then((user) => {
      userDispatch({
        type: SetUser.UPDATE,
        value: {
          ...user,
          signature,
        },
      })
      setMessage({
        isMessageOpen: true,
        messageType: "success",
      });
    }).catch(() => {
      setMessage({
        isMessageOpen: true,
        messageType: "error",
      });
    })
    setIsLoading(false);
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
        {originalSignature !== "" ? "Regenerate RSA Key Pair" : "Create RSA Key Pair"}
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
