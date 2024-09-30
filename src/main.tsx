import React from 'react'
import { Amplify } from "aws-amplify";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import config from './amplifyconfiguration.json';

Amplify.configure(config);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
