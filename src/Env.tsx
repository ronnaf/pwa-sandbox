import React from "react";
import { Box } from "./box";

export interface IEnvProps {}

const buildInfo = {
  commitMessage: import.meta.env["VITE_VERCEL_GIT_COMMIT_MESSAGE"],
  commitSha: import.meta.env["VITE_VERCEL_GIT_COMMIT_SHA"],
};

export const Env = (props: IEnvProps) => {
  return <Box>
    <strong>Version info</strong>
    <div>Commit: {buildInfo.commitMessage}</div>
    <div>SHA: {buildInfo.commitSha}</div>
  </Box>;
};
