import Button from "@mui/material/Button";
import Message from "./Message";
import { useState } from "react";
import { AlertColor } from "@mui/material";
import { savePrivateKey, saveUserId, getPrivateKey } from "../state/persistance";
import { SetUser, useUserParams } from "../state/userActions";
import KeyIcon from "@mui/icons-material/Key";
import { addAuthHeaders, createUser, updateUser } from "../services/api";
import { generateKeyPair, convertToPemKeyAndBase64 } from "../services/keyCreation";
import { refreshToken } from "../utils/refresh";

interface MessageHandle {
  isMessageOpen: boolean;
  messageType: AlertColor;
}
interface Params {
  createUserLocal?: typeof createUser,
  updateUserLocal?: typeof updateUser
}

const GenerateCerts = ({
  createUserLocal = createUser,
  updateUserLocal = updateUser
}: Params) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    dispatch: userDispatch,
    state: { userId: originalUserId, jwt: originalJwt },
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
  const isKeyGenerated = getPrivateKey() || originalJwt
  const handleGenerateKeyPairHOF = async () => {
    setIsLoading(true);
    const { publicKey, privateKey } = await generateKeyPair()
    savePrivateKey(privateKey); //local storage

    const base64FormattedPublicKey = convertToPemKeyAndBase64(publicKey)

    return (originalUserId === "-1" ?
      //no user yet, so create one
      createUserLocal(addAuthHeaders(originalUserId, originalJwt), base64FormattedPublicKey).then(
        (user) => {
          saveUserId(user.userId)
          return user
        },
      ) :
      //user exists, so update
      updateUserLocal(
        addAuthHeaders(originalUserId, originalJwt),
        base64FormattedPublicKey,
        originalUserId,
      )).then((_user) => {
        return refreshToken(true).then(({ userId, jwt }) => {
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
      .finally(() => {
        setIsLoading(false);
      })

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
        {isKeyGenerated !== "" ? "Regenerate RSA Key Pair" : "Create RSA Key Pair"}
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
