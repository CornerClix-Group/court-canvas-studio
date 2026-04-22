import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BLOCKED_PREFIXES = ["/admin"];
const WIDGET_ID = "69e80f7b7ca09b0738e6b647";
const SCRIPT_ID = "leadconnector-chat-widget-script";

const LeadConnectorWidget = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isBlocked = BLOCKED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    const removeWidget = () => {
      document.getElementById(SCRIPT_ID)?.remove();
      document
        .querySelectorAll('lc-chat-widget, [id^="lc_chat-widget"], #lc_chat_widget')
        .forEach((el) => el.remove());
    };

    if (isBlocked) {
      removeWidget();
      return;
    }

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://widgets.leadconnectorhq.com/loader.js";
    script.async = true;
    script.setAttribute(
      "data-resources-url",
      "https://widgets.leadconnectorhq.com/chat-widget/loader.js"
    );
    script.setAttribute("data-widget-id", WIDGET_ID);
    document.body.appendChild(script);
  }, [pathname]);

  return null;
};

export default LeadConnectorWidget;
