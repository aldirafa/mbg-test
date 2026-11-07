"use client";

import {
  FluentProvider,
  RendererProvider,
  SSRProvider,
  Toaster,
  createDOMRenderer,
  renderToStyleElements,
} from "@fluentui/react-components";
import { useServerInsertedHTML } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ThemeModeProvider, useThemeMode } from "./theme-mode";
import { mbgDarkTheme, mbgLightTheme } from "./theme";

export const APP_TOASTER_ID = "mbg-toaster";

function ThemedFluent({ children }: { children: ReactNode }) {
  const { resolved } = useThemeMode();
  return (
    <FluentProvider
      theme={resolved === "dark" ? mbgDarkTheme : mbgLightTheme}
      className="min-h-full flex flex-col"
      style={{ background: "transparent" }}
    >
      {children}
      <Toaster toasterId={APP_TOASTER_ID} position="top-end" pauseOnHover pauseOnWindowBlur />
    </FluentProvider>
  );
}

// Pola resmi Fluent v9 untuk Next.js App Router: style Griffel dikumpulkan saat SSR dan
// disisipkan ke <head> lewat useServerInsertedHTML, jadi tidak ada FOUC.
export function FluentRoot({ children }: { children: ReactNode }) {
  const [renderer] = useState(() => createDOMRenderer());
  const didRenderRef = useRef(false);

  useServerInsertedHTML(() => {
    if (didRenderRef.current) return null;
    didRenderRef.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <ThemeModeProvider>
          <ThemedFluent>{children}</ThemedFluent>
        </ThemeModeProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
