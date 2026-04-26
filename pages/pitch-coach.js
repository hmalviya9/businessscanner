import Head from "next/head";
import { useEffect } from "react";

export default function PitchCoach() {
  useEffect(() => {
    window.location.replace("/pitch-coach.html");
  }, []);

  return (
    <>
      <Head>
        <title>Pitch Coach - Bazaar Radar</title>
      </Head>
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Pitch Coach</h1>
        <p>Opening the pitch training module...</p>
        <p>
          <a href="/pitch-coach.html">Open Pitch Coach</a>
        </p>
      </main>
    </>
  );
}
