let razorpayPromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      const checkExisting = () => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        setTimeout(checkExisting, 100);
      };

      checkExisting();
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      resolve(!!window.Razorpay);
    };

    script.onerror = () => {
      razorpayPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return razorpayPromise;
}