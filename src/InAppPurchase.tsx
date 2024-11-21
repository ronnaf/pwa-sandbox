import React, { useEffect, useState } from "react";

import { Box } from "./Box";

const sampleProducts =
  '[{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"essential","offers":[{"currencyCode":"USD","discounts":[],"price":"19","priceFormatted":"$19.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":1},"href":"/v1/catalog/usa/in-apps/5BF4AB4E","id":"5BF4AB4E","type":"in-apps"},{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"plus","offers":[{"currencyCode":"USD","discounts":[],"price":"24","priceFormatted":"$24.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":2},"href":"/v1/catalog/usa/in-apps/98BDFA3D","id":"98BDFA3D","type":"in-apps"},{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"advanced","offers":[{"currencyCode":"USD","discounts":[],"price":"29","priceFormatted":"$29.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":3},"href":"/v1/catalog/usa/in-apps/D305D8F1","id":"D305D8F1","type":"in-apps"}]';

interface Product {
  attributes: {
    description: {
      standard: string;
    };
    icuLocale: string;
    isFamilyShareable: number;
    kind: string;
    name: string;
    offerName: string;
    offers: {
      currencyCode: string;
      discounts: unknown[];
      price: string;
      priceFormatted: string;
      recurringSubscriptionPeriod: string;
    }[];
    subscriptionFamilyId: string;
    subscriptionFamilyName: string;
    subscriptionFamilyRank: number;
  };
  href: string;
  id: string;
  type: string;
}

export const InAppPurchase = ({
  log,
}: {
  log: (origin: string, value?: unknown) => void;
}) => {
  const [products, setProducts] = useState<Product[]>([]);

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
      log("iap-products-result", event);
      if (event && event.detail) {
        setProducts(JSON.parse(event.detail));
      }
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, [log]);

  return (
    <Box>
      <strong>In-App Purchase</strong>
      <button onClick={fetchProducts}>Fetch products</button>
      <div>
        {products.map((product) => (
          <Box key={product.id} style={{ display: "flex" }}>
            <div>
              <div>{product.attributes.offerName}</div>
              <div>{product.attributes.name}</div>
              <div>{product.attributes.kind}</div>
              <div>{product.attributes.offers[0].priceFormatted}</div>
            </div>
            <button>buy</button>
          </Box>
        ))}
      </div>
    </Box>
  );
};
