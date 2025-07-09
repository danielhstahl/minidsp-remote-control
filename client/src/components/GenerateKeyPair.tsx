import Button from "@mui/material/Button";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { savePrivateKey, saveUserId } from "../state/persistance";
import { SetUser, useUserParams } from "../state/userActions";
import KeyIcon from "@mui/icons-material/Key";
import { addAuthHeaders, createUser, updateUser, UserId } from "../services/api";
import { generateKeyPair, generateJwt, convertToPemKeyAndBase64 } from "../services/keyCreation";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
const GenerateCerts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    dispatch: userDispatch,
    state: { userId, jwt: originalJwt },
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
  const handleGenerateKeyPairHOF = async () => {
    setIsLoading(true);
    const { publicKey, privateKey } = await generateKeyPair()
    savePrivateKey(privateKey); //local storage

    const base64FormattedPublicKey = convertToPemKeyAndBase64(publicKey)

    const userPromise: Promise<UserId> = userId === "-1" ?
      //no user yet, so create one
      createUser(addAuthHeaders(userId, originalJwt), base64FormattedPublicKey).then(
        (user) => {
          saveUserId(user.userId)
          return user
        },
      ) :
      //user exists, so update
      updateUser(
        addAuthHeaders(userId, originalJwt),
        base64FormattedPublicKey,
        userId,
      )
    await userPromise.then(({ userId }) => {
      return generateJwt(privateKey, userId, process.env.REACT_APP_AUDIENCE || "", "shouldnotmatter").then((jwt: string) => {
        return userDispatch({
          type: SetUser.UPDATE,
          value: {
            userId,
            jwt,
          },
        })
      })
    }).then(() => {
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
        {originalJwt !== "" ? "Regenerate RSA Key Pair" : "Create RSA Key Pair"}
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
