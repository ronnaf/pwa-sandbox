import React from "react";
import { Box } from "./box";
import Analytiks from "analytics";
import googleTagManager from "@analytics/google-tag-manager";

const gtm = googleTagManager({ containerId: "GTM-KV6N68MH" });
console.log(`gtm:`, gtm);

/* Initialize analytics */
const analytics = Analytiks({
  app: "sandbox",
  plugins: [gtm],
});

export const Analytics = () => {
  function handle() {
    analytics.track("Whispering secrets", {
      userId: "12345",
      name: "John Doe",
      email: "johndoe@example.com",
      isActive: true,
    });
  }
  return (
    <Box>
      <strong>Analytics</strong>
      <button onClick={handle}>Whispering secrets</button>
    </Box>
  );
};
