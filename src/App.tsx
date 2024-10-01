import React, { useEffect } from "react";
import { useState } from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";

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

const isIosShell = () => navigator.userAgent.includes("PWAShell");

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

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 8, padding: 8, border: "1px solid gainsboro" }}>
      {children}
    </div>
  );
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [allowNativeScriptHandler, setAllowNativeScriptHandler] =
    useState(false);
  const [logs, setLogs] = useState<
    { id: string; origin: string; value?: unknown }[]
  >([]);

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
      const result = await Auth.confirmSignUp(email, code);
      log(`handleConfirmSignUp - result:`, result);
    } catch (error) {
      log("error confirming sign up", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    await Auth.signIn(email, password);
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut({ global: true });
      log("signed out");
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

  return (
    <>
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
      </Box>
      <Box>
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button type="submit">Confirm sign up</button>
        </form>
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
      </Box>
      <Box>
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
      </Box>
      <Box>
        <button onClick={handleSignOut}>Sign out</button>
      </Box>
      <Box>
        {logs.map((log) => (
          <pre key={log.id}>
            <code>
              {JSON.stringify({ origin: log.origin, value: log.value })}
            </code>
          </pre>
        ))}
      </Box>
    </>
  );
}

export default App;
