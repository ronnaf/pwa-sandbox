import React, { useEffect } from "react";
import { useState } from "react";
import { Auth, Hub } from "aws-amplify";
import {
  CognitoHostedUIIdentityProvider,
  CognitoUser,
} from "@aws-amplify/auth";
import { QRCodeCanvas } from "qrcode.react";

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

type BoxProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

function Box({ children, style }: BoxProps) {
  return (
    <div
      style={{ margin: 8, padding: 8, border: "1px solid gainsboro", ...style }}
    >
      {children}
    </div>
  );
}

const emails = ["ronna+mfa@yopmail.com", "ronna+nomfa@yopmail.com"];

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password1!");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [allowNativeScriptHandler, setAllowNativeScriptHandler] =
    useState(false);
  const [logs, setLogs] = useState<
    { id: string; origin: string; value?: unknown }[]
  >([]);
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [totpSetUpCode, setTotpSetUpCode] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);

  const log = (origin: string, value?: unknown) => {
    setLogs((prev) => prev.concat({ id: randomId(), origin, value }));
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
      const result = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email, // optional
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
      setMfaRequired(result.challengeName === "SOFTWARE_TOKEN_MFA");
      log(`handleSignIn - result:`, result);
      setUser(result);
    } catch (e) {
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
      setUser(user);
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
      const issuer = "Carepatron";
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
      log(`verifyTotpToken - cognitoUserSession:`, cognitoUserSession);
      // Don't forget to set TOTP as the preferred MFA method.
      await Auth.setPreferredMFA(user, "TOTP");
    } catch (error) {
      // Token is not verified
      log(`verifyTotpToken - error:`, error);
    }
  }

  async function verifySignInOtp() {
    // Finally, when sign-in with MFA is enabled, use the `confirmSignIn` API
    // to pass the TOTP code and MFA type.
    try {
      const result = await Auth.confirmSignIn(user, otp, "SOFTWARE_TOKEN_MFA");
      log(`verifySignInOtp - result:`, result);
    } catch (e) {
      log(`verifySignInOtp - e:`, e);
    }
  }

  return (
    <div style={{ marginInline: "auto", maxWidth: "512px" }}>
      <Box>
        {emails.map((email) => (
          <div key={email}>
            <button onClick={() => setEmail(email)}>select</button> {email}
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
              type="password"
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
              type="password"
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
        <div>
          <input
            type="text"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifySignInOtp}>Verify</button>
          {mfaRequired && (
            <span style={{ color: "red" }}> ← MFA is required</span>
          )}
        </div>
      </Box>
      <Box>
        <button onClick={handleGetCurrentAuthUser}>
          Get current authenticated user
        </button>
      </Box>
      <Box
        style={{
          display: "flex",
          alignItems: "start",
          alignContent: "space-between",
        }}
      >
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
      <Box>
        <button onClick={getPreferredMFAType}>Get preferred MFA type</button>
      </Box>
      <Box>
        <button onClick={handleSignOut}>Sign out</button>
      </Box>
      <Box>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
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
