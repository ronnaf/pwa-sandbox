import {
  CognitoHostedUIIdentityProvider,
  CognitoUser,
} from "@aws-amplify/auth";
import {
  AuthenticationResultType,
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand,
  SetUserMFAPreferenceCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { Auth, Hub } from "aws-amplify";
import { QRCodeCanvas } from "qrcode.react";
import React, { useEffect, useState } from "react";
import { Box } from "./Box";
import { InAppPurchase } from "./InAppPurchase";
import { Env } from "./Env";

// Set up the client
const client = new CognitoIdentityProviderClient({
  region: "ap-southeast-1",
});

type FederatedSignInPayload = {
  provider: "Google"; // | 'SignInWithApple';
};

type PostMessageData = {
  idToken: string;
  expiresAt: string;
  name: string;
  email?: string;
  picture?: string;
};

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        federatedSignIn?: {
          postMessage?: (payload: FederatedSignInPayload) => Promise<string>;
        };
        "iap-products-request"?: {
          postMessage?: (productIds: string[]) => void;
        };
      };
    };
  }
}

const randomId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const isIosShell = () => true; // navigator.userAgent.includes("PWAShell");

const iosShellHandlers = {
  Google: async () => {
    try {
      const json =
        await window.webkit?.messageHandlers?.federatedSignIn?.postMessage?.({
          provider: "Google",
        });
      console.log(`Google: - json:`, json);
      if (!json) throw new Error("No result");

      const response: PostMessageData = JSON.parse(json);
      console.log(`Google: - response:`, response.idToken);
      console.log(`Google: - response.idToken:`, response.idToken);

      const result = await Auth.federatedSignIn(
        "google",
        { token: response.idToken, expires_at: parseInt(response.expiresAt) },
        {
          name: response.name,
          email: response.email,
          picture: response.picture,
        }
      );
      console.log(`Google: - result:`, result);
      return result;
    } catch (e) {
      console.log(`Google: - e:`, e);
      return;
    }
  },
};

const users = [
  {
    email: "ronna+mfa@yopmail.com",
    password: "Password1!",
  },
  {
    email: "ronna+nomfa@yopmail.com",
    password: "Password1!",
  },
  {
    email: "ronna+mfa1@yopmail.com",
    password: "4d96c27e-fa9b-5e03-96d9-1e6b86531602",
  },
  {
    email: "ronna@carepatron.com",
    password: "7pF@9qD$XeL2!vWz",
  },
  {
    email: "ronna.firmo1@gmail.com",
    password: "7pF@9qD$XeL2!vWz",
  },
];

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [allowNativeScriptHandler, setAllowNativeScriptHandler] =
    useState(false);
  const [logs, setLogs] = useState<
    { id: string; origin: string; value?: unknown }[]
  >([]);
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [tempUser, setTempUser] = useState<CognitoUser | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [totpSetUpCode, setTotpSetUpCode] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [softwareToken, setSoftwareToken] = useState("");
  const [challengeName, setChallengeName] = useState("");

  const log = (origin: string, value?: unknown) => {
    const parsedValue =
      value instanceof Error
        ? { message: value.message, name: value.name }
        : value;
    setLogs((prev) =>
      prev.concat({ id: randomId(), origin, value: parsedValue })
    );
  };

  useEffect(() => {
    const unsubscribe = Hub.listen(
      "auth",
      async ({ payload: { event, data } }) => {
        switch (event) {
          case "autoSignIn": {
            log(`Hub.listen - autoSignIn user`, data);
            break;
          }
          case "autoSignIn_failure": {
            log(`Hub.listen - autoSignIn_failure`);
            break;
          }
          case "signIn": {
            log(`Hub.listen - signIn user:`, data);
            break;
          }
          case "signIn_failure": {
            log(`Hub.listen - signIn_failure data:`, data);
            break;
          }
          case "signOut": {
            log(`Hub.listen - signOut`);
            break;
          }
          case "signInWithRedirect_failure": {
            log(`Hub.listen - signInWithRedirect_failure`);
            break;
          }
          case "customOAuthState": {
            log(`Hub.listen - customOAuthState data`, data);
            break;
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      console.log(`handleSignUp - email:`, { email, password });

      const result = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          phone_number: "+639554534759",
        },
        autoSignIn: {
          // optional - enables auto sign in after user is confirmed
          enabled: true,
        },
      });
      log(`handleSignUp - result:`, result);
    } catch (error) {
      log("error signing up:", error);
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    try {
      const result = await Auth.confirmSignUp(email, emailVerificationCode);
      log(`handleConfirmSignUp - result:`, result);
    } catch (error) {
      log("error confirming sign up", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await Auth.signIn(email, password);
      setChallengeName(result.challengeName);
      log(`handleSignIn - result:`, result);
      setTempUser(result);
    } catch (e) {
      console.log(`handleSignIn - e:`, e);
      log(`handleSignIn - e:`, e);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut({ global: true });
      window.location.reload();
    } catch (error) {
      log("error signing out: ", error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isIosShell() && allowNativeScriptHandler) {
      return iosShellHandlers.Google();
    }
    return Auth.federatedSignIn({
      provider: CognitoHostedUIIdentityProvider.Google,
    });
  };

  const handleGetCurrentAuthUser = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser({
        bypassCache: true,
      });
      const storage = JSON.parse(user.storage[user.userDataKey]);
      const mfaSettings = storage.UserMFASettingList;

      setUser(user);
      log(`handleGetCurrentAuthUser - mfaSettings:`, mfaSettings);
      log(`handleGetCurrentAuthUser - user:`, user);
    } catch (e) {
      log(`handleGetCurrentAuthUser - e:`, e);
    }
  };

  async function getPreferredMFAType() {
    try {
      // Will retrieve the current MFA type from cache
      // `bypassCache` is optional and by default is false.
      // If set to true, it will get the MFA type from server-side
      // instead of from local cache.
      const data = await Auth.getPreferredMFA(user, { bypassCache: false });

      // cognitoUser.getUserData((err, data) => {
      //   if (err) {
      //     alert(err.message || JSON.stringify(err));
      //     return;
      //   }
      //   const { PreferredMfaSetting, UserMFASettingList } = data;
      //   console.log(
      //     JSON.stringify({ PreferredMfaSetting, UserMFASettingList }, null, 2)
      //   );
      // });
      log(`getPreferredMFAType - data:`, data);
    } catch (err) {
      log(`getPreferredMFAType - err:`, err);
    }
  }

  async function initiateTotpSetup() {
    try {
      if (!user) throw new Error("No user to setup TOTP");
      const secretCode = await Auth.setupTOTP(user);
      const username = user.getUsername();
      const issuer = "PWA Sandbox";
      const otpAuthUri =
        "otpauth://totp/AWSCognito:" +
        username +
        "?secret=" +
        secretCode +
        "&issuer=" +
        issuer;
      setOtpAuthUri(otpAuthUri);
      log(`initiateTotpSetup - otpAuthUri:`, otpAuthUri);
    } catch (e) {
      log(`initiateTotpSetup - e:`, e);
    }
  }

  async function verifyTotpSetUpToken() {
    // Then you will have your TOTP account in your TOTP-generating app (like Google Authenticator)
    // use the generated one-time password to verify the setup.
    try {
      const cognitoUserSession = await Auth.verifyTotpToken(
        user,
        totpSetUpCode
      );
      const session = await Auth.currentSession();
      const accessToken = session.getAccessToken().getJwtToken();
      console.log(`verifyTotpSetUpToken - accessToken:`, accessToken);
      const command = new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        EmailMfaSettings: { Enabled: true },
        SoftwareTokenMfaSettings: { Enabled: true },
      });
      const response = await client.send(command);
      console.log(`verifyTotpSetUpToken - response:`, response);

      log(`verifyTotpToken - cognitoUserSession:`, cognitoUserSession);
      // Don't forget to set TOTP as the preferred MFA method.
      // await Auth.setPreferredMFA(user, "TOTP");
    } catch (error) {
      // Token is not verified
      log(`verifyTotpToken - error:`, error);
    }
  }

  const verifySignInEmailOtp = async () => {
    // Finally, when sign-in with MFA is enabled, use the `confirmSignIn` API
    // to pass the TOTP code and MFA type.
    try {
      if (!tempUser) throw new Error("No temp user");
      console.log(`verifySignInEmailOtp - otp:`, emailOtp);
      console.log(`verifySignInEmailOtp - challengeName:`, challengeName);
      // @ts-expect-error - session not available as type
      const session = tempUser.Session;
      console.log(`verifySignInEmailOtp - session:`, session);

      // using aws-amplify
      // const result = await Auth.confirmSignIn(tempUser, otp, challengeName);

      // using amazon-cognito-identity-js
      // NOTE: DOES NOT WORK, getting: "Missing required parameter EMAIL_OTP_CODE"
      // const userData = {
      //   Username: "ronna.firmo1@gmail.com",
      //   Pool: userPool,
      // };
      // const cognitoUser = new ACIJCognitoUser(userData);
      // if (!cognitoUser) throw new Error("No cognito user");
      // cognitoUser.sendMFACode(
      //   otp,
      //   {
      //     onFailure(err) {
      //       log(`sendMFACode - err:`, err);
      //     },
      //     onSuccess(session, userConfirmationNecessary) {
      //       log(`sendMFACode - session:`, session);
      //       log(
      //         `sendMFACode - userConfirmationNecessary:`,
      //         userConfirmationNecessary
      //       );
      //     },
      //   },
      //   "EMAIL_OTP"
      // );
      // log(`verifySignInOtp - result:`, result);

      // using aws sdk
      const command = new RespondToAuthChallengeCommand({
        ClientId: "rre8icrvp0v4edon7dna2c242",
        ChallengeName: "EMAIL_OTP",
        Session: session, // Session from the previous InitiateAuth response
        ChallengeResponses: {
          USERNAME: tempUser.getUsername(),
          EMAIL_OTP_CODE: emailOtp, // OTP entered by the user
        },
      });

      const response = await client.send(command);
      if (!response.AuthenticationResult) {
        throw new Error("No auth result");
      }

      setSignInUserSession(response.AuthenticationResult);

      console.log("MFA verification successful:", response);
    } catch (e) {
      log(`verifySignInOtp - e:`, e);
    }
  };

  const verifySignInSoftwareToken = async () => {
    try {
      if (!tempUser) throw new Error("No temp user");
      // @ts-expect-error - session not available as type
      const session = tempUser.Session;

      const command = new RespondToAuthChallengeCommand({
        ClientId: "rre8icrvp0v4edon7dna2c242",
        ChallengeName: "SOFTWARE_TOKEN_MFA",
        Session: session, // Session from the previous InitiateAuth response
        ChallengeResponses: {
          USERNAME: tempUser.getUsername(),
          SOFTWARE_TOKEN_MFA_CODE: softwareToken, // OTP entered by the user
        },
      });

      const response = await client.send(command);
      console.log(`verifySignInSoftwareToken - response:`, response);
      if (!response.AuthenticationResult) {
        throw new Error("No auth result");
      }

      setSignInUserSession(response.AuthenticationResult);
    } catch (e) {
      log(`verifySignInOtp - e:`, e);
    }
  };

  const setSignInUserSession = (
    authenticationResult: AuthenticationResultType
  ) => {
    if (!tempUser) throw new Error("No temp user");
    if (
      !authenticationResult.AccessToken ||
      !authenticationResult.IdToken ||
      !authenticationResult.RefreshToken
    ) {
      throw new Error("No auth tokens");
    }

    const accessToken = new CognitoAccessToken({
      AccessToken: authenticationResult.AccessToken,
    });
    const idToken = new CognitoIdToken({
      IdToken: authenticationResult.IdToken,
    });
    const refreshToken = new CognitoRefreshToken({
      RefreshToken: authenticationResult.RefreshToken,
    });
    const newSession = new CognitoUserSession({
      AccessToken: accessToken,
      IdToken: idToken,
      RefreshToken: refreshToken,
    });
    tempUser.setSignInUserSession(newSession);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Env />
      <Box>
        {users.map((user) => (
          <div key={user.email}>
            <button
              onClick={() => {
                setEmail(user.email);
                setPassword(user.password);
              }}
            >
              select
            </button>{" "}
            {user.email}
          </div>
        ))}
      </Box>
      <Box>
        <strong>Sign up</strong>
        <form onSubmit={handleSignUp}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign up</button>
        </form>
        <hr style={{ borderStyle: "dashed", color: "gainsboro" }} />
        <div>
          <strong>Confirm sign up</strong>
          <form onSubmit={handleConfirmation}>
            <div>
              <label>Email:</label>
              <input type="email" value={email} disabled />
            </div>
            <div>
              <label>Code:</label>
              <input
                type="text"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value)}
                required
              />
            </div>
            <button type="submit">Confirm sign up</button>
          </form>
        </div>
      </Box>
      <Box>
        <strong>Sign in</strong>
        <form onSubmit={handleSignIn}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Sign in</button>
        </form>
        <hr style={{ borderStyle: "dashed", color: "gainsboro" }} />
        <div>
          {isIosShell() && (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={allowNativeScriptHandler}
                  onChange={() => setAllowNativeScriptHandler((is) => !is)}
                />
                Allow native script handler
              </label>
            </div>
          )}
          <div>
            <button onClick={handleGoogleSignIn}>Sign in with Google</button>
          </div>
        </div>
        <hr style={{ borderStyle: "dashed", color: "gainsboro" }} />
        <div style={{ color: "red" }}>{challengeName}</div>
        <div>
          {JSON.parse(tempUser?.challengeParam.MFAS_CAN_CHOOSE ?? "[]").map(
            (challenge: string) => (
              <button
                key={challenge}
                onClick={() => {
                  if (!tempUser) {
                    log("There is no user");
                    return;
                  }
                  setChallengeName(challenge);
                  tempUser.sendMFASelectionAnswer(challenge, {
                    onSuccess(session) {
                      log(`sendMFASelectionAnswer - session:`, session);
                    },
                    onFailure(err) {
                      log(`sendMFASelectionAnswer - err:`, err);
                    },
                    mfaRequired(challengeName, challengeParameters) {
                      console.log(
                        `mfaRequired - challengeParameters:`,
                        challengeParameters
                      );
                      console.log(
                        `mfaRequired - challengeName:`,
                        challengeName
                      );
                    },
                    totpRequired(challengeName, challengeParameters) {
                      console.log(
                        `totpRequired - challengeParameters:`,
                        challengeParameters
                      );
                      console.log(
                        `totpRequired - challengeName:`,
                        challengeName
                      );
                    },
                  });
                }}
              >
                {challenge}
              </button>
            )
          )}
        </div>
        {/* Is it possible to send out a challenge response without choosing mfa method? */}
        <div>
          <input
            type="text"
            placeholder="Email OTP"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value)}
          />
          <button onClick={verifySignInEmailOtp}>Verify</button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Software Token MFA"
            value={softwareToken}
            onChange={(e) => setSoftwareToken(e.target.value)}
          />
          <button onClick={verifySignInSoftwareToken}>Verify</button>
        </div>
      </Box>
      <Box style={{ display: "flex", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <button onClick={initiateTotpSetup}>Initiate TOTP setup</button>
          <div>
            <input
              type="text"
              placeholder="TOTP Code"
              value={totpSetUpCode}
              onChange={(e) => setTotpSetUpCode(e.target.value)}
            />
            <button onClick={verifyTotpSetUpToken}>Verify</button>
          </div>
        </div>
        {otpAuthUri && <QRCodeCanvas size={200} value={otpAuthUri} />}
      </Box>
      <Box style={{ maxWidth: "244px" }}>
        <button onClick={handleGetCurrentAuthUser}>
          Get current authenticated user
        </button>
        <button onClick={getPreferredMFAType}>Get preferred MFA type</button>
        <button
          onClick={() => {
            if (!user) return;
            user.enableMFA((err, result) => {
              if (err) log(`user.enableMFA - err:`, err);
              if (result) log(`user.enableMFA - result:`, result);
            });
          }}
        >
          Enable MFA
        </button>
        <button
          onClick={async () => {
            if (!user) return;
            try {
              const result = await Auth.updateUserAttributes(user, {
                phone_number: "+639554534759",
              });
              log(`updateUserAttributes - result:`, result);
            } catch (e) {
              log(`updateUserAttributes - e:`, e);
            }
          }}
        >
          Add phone number
        </button>
        <button
          onClick={async () => {
            if (!user) return;
            user.getMFAOptions((err, result) => {
              if (result) log(`user.getMFAOptions - result:`, result);
              if (err) log(`user.getMFAOptions - err:`, err);
            });
          }}
        >
          Get MFA options
        </button>
      </Box>
      <InAppPurchase />
      <Box>
        <button onClick={handleSignOut}>Sign out</button>
      </Box>
      <Box style={{ maxWidth: "95%" }}>
        <div style={{ display: "flex" }}>
          <strong>Logs</strong>
          <button onClick={() => setLogs([])}>Clear</button>
        </div>
        {logs.map((log) => (
          <pre
            key={log.id}
            style={{ border: "1px dashed gainsboro", padding: 8 }}
          >
            <code>
              {JSON.stringify(
                { origin: log.origin, value: log.value },
                undefined,
                2
              )}
            </code>
          </pre>
        ))}
      </Box>
    </div>
  );
}

export default App;
