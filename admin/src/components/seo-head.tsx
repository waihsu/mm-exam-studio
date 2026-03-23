import { HeadContent } from "@tanstack/react-router";
import { createPortal } from "react-dom";

export function SeoHead() {
  if (typeof document === "undefined") return null;
  return createPortal(<HeadContent />, document.head);
}
