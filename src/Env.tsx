import React from "react";
import { Box } from "./Box";

export interface IEnvProps {}

export const Env = (props: IEnvProps) => {
  return <Box>{JSON.stringify(import.meta.env, undefined, 2)}</Box>;
};
