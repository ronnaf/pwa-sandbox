import React, { useEffect } from "react";

import { Box } from "./Box";

export const InAppPurchase = () => {
  function fetchProducts() {
    window.webkit?.messageHandlers?.["iap-products-request"]?.postMessage?.([
      "essential",
      "plus",
      "advanced",
    ]);
  }

  useEffect(() => {
    const eventName = "iap-products-result";
    window.addEventListener(eventName, (event) => {
      console.log(`window.addEventListener - event:`, event);
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, []);

  return (
    <Box>
      <strong>In-App Purchase</strong>
      <button onClick={fetchProducts}>Fetch products</button>
    </Box>
  );
};
