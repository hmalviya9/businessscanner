import Head from "next/head";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.replace("/index.html");
  }, []);

  return (
    <>
      <Head>
        <title>Bazaar Radar</title>
        <meta
          name="description"
          content="India-first offline business opportunity discovery workspace."
        />
      </Head>
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Bazaar Radar</h1>
        <p>Opening the opportunity discovery workspace...</p>
        <p>
          <a href="/index.html">Open Bazaar Radar</a>
        </p>
      </main>
    </>
  );
}
