import React, { useEffect } from "react";
import { Box } from "./box";
import Analytiks from "analytics";
import googleTagManager from "@analytics/google-tag-manager";

const gtm = googleTagManager({ containerId: "GTM-KV6N68MH" })
console.log(`gtm:`, gtm);

/* Initialize analytics */
const analytics = Analytiks({
  app: "sandbox",
  plugins: [
    gtm 
  ],
});

export const Analytics = () => {
  useEffect(() => {
    analytics.track("pageview");
  }, [])
  return (
    <Box>
      <strong>Analytics</strong>
    </Box>
  );
};
