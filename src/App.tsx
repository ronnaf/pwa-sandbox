import React from "react";
import { useState } from "react";
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  signInWithRedirect,
  getCurrentUser,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

Hub.listen("auth", async ({ payload }) => {
  switch (payload.event) {
    case "signInWithRedirect": {
      const user = await getCurrentUser();
      console.log(`Hub.listen - signInWithRedirect user:`, user);
      break;
    }
    case "signInWithRedirect_failure": {
      console.log(`Hub.listen - signInWithRedirect_failure"`);
      break;
    }
    case "customOAuthState": {
      const state = payload.data; // this will be customState provided on signInWithRedirect function
      console.log(state);
      break;
    }
  }
});

function Box({ children }: {children: React.ReactNode}) {
  return <div style={{margin: 8, padding: 8, border: '1px solid gainsboro'}}>{children}</div>;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
          // optional
          autoSignIn: true, // or SignInOptions e.g { authFlowType: "USER_SRP_AUTH" }
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
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      console.log(`handleConfirmSignUp - result:`, result);
    } catch (error) {
      console.log("error confirming sign up", error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await signIn({
        username: email,
        password,
      });
      console.log(`handleSignIn - result:`, result);
    } catch (error) {
      console.log("error signing in", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("signed out");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  };

  const handleGoogleSignIn = async () => {
    signInWithRedirect({
      provider: "Google",
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
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      </Box>
      <Box>
        <button onClick={handleSignOut}>Sign out</button>
      </Box>
    </>
  );
}

export default App;
