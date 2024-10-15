import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/logo.png" type="image/x-icon" />
        <title>shift-manager</title>
        <link
          rel="stylesheet"
          href="/styles.css"
          style={{ width: "250px", height: "auto" }}
        />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
