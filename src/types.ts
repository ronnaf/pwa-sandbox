export type FederatedSignInPayload = {
  provider: "Google"; // | 'SignInWithApple';
};

export type PostMessageData = {
  idToken: string;
  expiresAt: string;
  name: string;
  email?: string;
  picture?: string;
};

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        federatedSignIn?: {
          postMessage: (payload: FederatedSignInPayload) => Promise<string>;
        };
        "iap-products-request"?: {
          postMessage: (productIds: string[]) => void;
        };
        "iap-purchase-request"?: {
          postMessage: (args: string) => void;
        };
      };
    };
  }
}
