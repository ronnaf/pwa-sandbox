import React from "react";
import { useState } from "react";
import { Auth, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';

Hub.listen("auth", async ({ payload: { event, data } }) => {
  switch (event) {
    case "autoSignIn": {
      console.log(`Hub.listen - autoSignIn user:`, data);
      break;
    }
    case "autoSignIn_failure": {
      console.log(`Hub.listen - autoSignIn_failure`);
      break;
    }
    case "signIn": {
      console.log(`Hub.listen - signIn user:`, data);
      break;
    }
    case "signIn_failure": {
      console.log(`Hub.listen - signIn_failure data:`, data);
      break;
    }
    case "signOut": {
      console.log(`Hub.listen - signOut`);
      break;
    }
    case "signInWithRedirect_failure": {
      console.log(`Hub.listen - signInWithRedirect_failure`);
      break;
    }
    case "customOAuthState": {
      console.log(`Hub.listen - customOAuthState data`, data);
      break;
    }
  }
});

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
      console.log(`handleSignUp - result:`, result);
    } catch (error) {
      console.log("error signing up:", error);
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    try {
      const result = await Auth.confirmSignUp(email, code);
      console.log(`handleConfirmSignUp - result:`, result);
    } catch (error) {
      console.log("error confirming sign up", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const user = await Auth.signIn(email, password);
      console.log(`handleSignIn - user:`, user);
    } catch (error) {
      console.log("error signing in", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut({ global: true });
      console.log("signed out");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  };

  const handleGoogleSignIn = async () => {
    Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google });
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
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      </Box>
      <Box>
        <button onClick={handleSignOut}>Sign out</button>
      </Box>
    </>
  );
}

export default App;
