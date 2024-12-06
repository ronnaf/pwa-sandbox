import React, { useEffect, useState } from "react";

import { Box } from "./box";
import { Hr } from "./hr";

const sampleProducts =
  '[{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"essential","offers":[{"currencyCode":"USD","discounts":[],"price":"19","priceFormatted":"$19.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":1},"href":"/v1/catalog/usa/in-apps/5BF4AB4E","id":"5BF4AB4E","type":"in-apps"},{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"plus","offers":[{"currencyCode":"USD","discounts":[],"price":"24","priceFormatted":"$24.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":2},"href":"/v1/catalog/usa/in-apps/98BDFA3D","id":"98BDFA3D","type":"in-apps"},{"attributes":{"description":{"standard":""},"icuLocale":"en_US@currency=USD","isFamilyShareable":0,"kind":"Auto-Renewable Subscription","name":"","offerName":"advanced","offers":[{"currencyCode":"USD","discounts":[],"price":"29","priceFormatted":"$29.00","recurringSubscriptionPeriod":"P1M"}],"subscriptionFamilyId":"E5EFF888","subscriptionFamilyName":"Primary","subscriptionFamilyRank":3},"href":"/v1/catalog/usa/in-apps/D305D8F1","id":"D305D8F1","type":"in-apps"}]';

const sampleTransaction = "{\"currency\":\"USD\",\"expiresDate\":1734762724177,\"originalPurchaseDate\":1732170724177,\"deviceVerificationNonce\":\"3186643f-076a-4c21-9cef-160ad293765b\",\"bundleId\":\"app.vercel.cp-pwa-sandbox\",\"signedDate\":1732174402147,\"subscriptionGroupIdentifier\":\"E5EFF888\",\"webOrderLineItemId\":\"0\",\"productId\":\"essential\",\"price\":19000,\"isUpgraded\":false,\"transactionReason\":\"PURCHASE\",\"deviceVerification\":\"4zkX0XWBZ57OrtmTRELSk6W1jRAD83JjsUDyIsxljiDyCM3kwGa5YIs2eugQOEIp\",\"environment\":\"Xcode\",\"inAppOwnershipType\":\"PURCHASED\",\"type\":\"Auto-Renewable Subscription\",\"originalTransactionId\":\"0\",\"storefront\":\"USA\",\"transactionId\":\"0\",\"quantity\":1,\"purchaseDate\":1732170724177,\"storefrontId\":\"143441\"}"

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

interface Transaction {
  storefrontId: string;
  deviceVerification: string;
  quantity: number;
  isUpgraded: boolean;
  productId: string;
  expiresDate: number;
  currency: string;
  webOrderLineItemId: string;
  type: string;
  storefront: string;
  bundleId: string;
  originalTransactionId: string;
  price: number;
  transactionReason: string;
  transactionId: string;
  environment: string;
  deviceVerificationNonce: string;
  inAppOwnershipType: string;
  signedDate: number;
  originalPurchaseDate: number;
  purchaseDate: number;
  subscriptionGroupIdentifier: string;
}

type Props = {
  log: (origin: string, value?: unknown) => void;
};

export const IAP = ({ log }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const eventName = "iap-products-result";
    window.addEventListener(eventName, (event) => {
      log(eventName, event.detail);
      const parsed = JSON.parse(event.detail);
      setProducts(parsed);
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, [log]);

  useEffect(() => {
    const eventName = "iap-purchase-result";
    window.addEventListener(eventName, (event) => {
      log(eventName, event.detail);
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, [log]);

  useEffect(() => {
    const eventName = "iap-purchase-transaction";
    window.addEventListener(eventName, (event) => {
      log(eventName, event.detail);
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, [log]);

  useEffect(() => {
    const eventName = "iap-transactions-result";
    window.addEventListener(eventName, (event) => {
      log(eventName, event.detail);
      const parsed = JSON.parse(event.detail);
      setTransactions(parsed);
    });
    return () => {
      window.removeEventListener(eventName, () => {});
    };
  }, [log]);

  function getProducts() {
    window.webkit?.messageHandlers?.["iap-products-request"]?.postMessage([
      "essential",
      "plus",
      "advanced",
    ]);
  }

  function sendPurchaseRequest(offerName: string) {
    window.webkit?.messageHandlers?.["iap-purchase-request"]?.postMessage(
      JSON.stringify({ productID: offerName, quantity: 1 })
    );
  }

  function getTransactions() {
    window.webkit?.messageHandlers?.["iap-transactions-request"]?.postMessage(
      "request"
    );
  }

  return (
    <Box>
      <strong>In-App Purchase</strong>
      <button onClick={getProducts}>Get products</button>
      <div>
        {products.map((product) => (
          <Box key={product.id} style={{ display: "flex" }}>
            <div>
              <div>{product.attributes.offerName}</div>
              <div>{product.attributes.name}</div>
              <div>{product.attributes.kind}</div>
              <div>{product.attributes.offers[0].priceFormatted}</div>
            </div>
            <button
              onClick={() => sendPurchaseRequest(product.attributes.offerName)}
            >
              buy
            </button>
          </Box>
        ))}
      </div>
      <Hr />
      <strong>Transactions</strong>
      <button onClick={getTransactions}>Get transactions</button>
      <div>
        {transactions.map((transaction) => (
          <div key={transaction.transactionId}>
            <div>ID: {transaction.originalTransactionId}</div>
            <div>Purchase date: {transaction.purchaseDate}</div>
            <div>Product: {transaction.productId}</div>
            <div>In-app ownership type: {transaction.inAppOwnershipType}</div>
            <div>Type: {transaction.type}</div>
          </div>
        ))}
      </div>
    </Box>
  );
};
