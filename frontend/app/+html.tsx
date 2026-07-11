// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        {/* Preload brand faces on web so type never flashes as system sans */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Full viewport — safe for SE short and Pro Max tall */
              html, body, #root {
                height: 100% !important;
                max-height: 100% !important;
                width: 100% !important;
                overflow: hidden !important;
                -webkit-text-size-adjust: 100%;
              }
              /* Nest-style single face (Inter ≈ SF Pro) */
              body, #root, h1, h2, h3, [role="heading"] {
                font-family: Inter, 'Inter', system-ui, -apple-system, sans-serif !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              body > div:first-child {
                position: fixed !important;
                top: 0; left: 0; right: 0; bottom: 0;
                display: flex !important;
                justify-content: center !important;
                align-items: stretch !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              /* Never let nested RN views force horizontal overflow */
              #root, #root * {
                max-width: 100vw;
                box-sizing: border-box;
              }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }

              * {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              *::-webkit-scrollbar {
                width: 0 !important;
                height: 0 !important;
                display: none !important;
                background: transparent !important;
              }

              body {
                overscroll-behavior: none;
                touch-action: pan-y;
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
