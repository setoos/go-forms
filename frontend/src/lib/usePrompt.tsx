import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function usePrompt(
  when: boolean,
  onConfirm: (retry: () => void) => void,
  allowedPaths: string[] = []
) {
  const location = useLocation();
  const navigate = useNavigate();
  const confirmed = useRef(false);
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [when]);

  useEffect(() => {
    if (!when) return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const patchHistoryMethod = (method: typeof window.history.pushState) => {
      return function (...args: Parameters<typeof method>) {
        const to = typeof args[2] === "string" ? args[2] : window.location.pathname;

        if (!confirmed.current && !allowedPaths.includes(to)) {
          onConfirm(() => {
            confirmed.current = true;
            method.apply(window.history, args);
            window.dispatchEvent(new PopStateEvent("popstate"));
          });
          return;
        }

        method.apply(window.history, args);
      };
    };

    window.history.pushState = patchHistoryMethod(originalPushState);
    window.history.replaceState = patchHistoryMethod(originalReplaceState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [when, onConfirm, allowedPaths]);
}
