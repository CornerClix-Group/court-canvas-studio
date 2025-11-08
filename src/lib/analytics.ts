import ReactGA from "react-ga4";
import { sha256 } from "js-sha256";
import Cookies from "js-cookie";

// Replace with your actual GA4 measurement ID
const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX"; // TODO: Replace with actual GA4 ID

let isInitialized = false;

export const initGA4 = () => {
  if (!isInitialized && Cookies.get("cpa_cookies_accepted") === "true") {
    ReactGA.initialize(GA4_MEASUREMENT_ID);
    isInitialized = true;
    console.log("GA4 initialized");
  }
};

export const setUserProperties = (leadHash: string) => {
  if (isInitialized) {
    ReactGA.set({ user_id: leadHash, lead_hash: leadHash });
  }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (isInitialized) {
    ReactGA.event(eventName, params);
    console.log("GA4 Event:", eventName, params);
  }
};

export const hashEmail = (email: string): string => {
  return sha256(email.toLowerCase().trim());
};

export const setLeadCookie = (leadId: string) => {
  Cookies.set("cpa_lead_id", leadId, { expires: 365 });
};

export const getLeadCookie = (): string | undefined => {
  return Cookies.get("cpa_lead_id");
};