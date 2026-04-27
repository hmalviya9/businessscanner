import Head from "next/head";
import Script from "next/script";

const coachScript = `
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let lastJudgeResponse = "";
  let lastDetectedLanguage = "en-IN";

  function detectPitchLanguage(text) {
    const devanagari = /[\\u0900-\\u097F]/.test(text);
    const hindiWords = /\\b(mera|meri|hum|hamara|vyapar|nivesh|grahak|samasy|samasya|munafa|lagat|bazaar|shahar|rupaye|paise|dhanda|business)\\b/i.test(text);
    return devanagari || hindiWords ? "hi-IN" : "en-IN";
  }

  function scorePitchText(rawText) {
    const text = rawText.toLowerCase();
    const language = detectPitchLanguage(rawText);
    const checks = [
      ["problem", /problem|pain|struggle|gap|need|samasya|दिक्कत|समस्या|जरूरत/.test(text)],
      ["customer", /customer|users|students|families|office|riders|parents|grahak|ग्राहक|परिवार|छात्र/.test(text)],
      ["numbers", /₹|rs|revenue|margin|cost|orders|sales|profit|payback|rupaye|लाख|करोड़|मार्जिन|लागत|मुनाफा/.test(text)],
      ["traction", /sold|validated|repeat|pilot|orders|customers|waitlist|बेचा|ऑर्डर|रिपीट|पायलट|वैलिडेट/.test(text)],
      ["ask", /ask|raise|investment|invest|funding|equity|nivesh|निवेश|फंडिंग|इक्विटी/.test(text)]
    ];
    const score = checks.filter(([, ok]) => ok).length;
    const missing = checks.filter(([, ok]) => !ok).map(([name]) => name).join(", ") || "nothing obvious";
    const response = language === "hi-IN"
      ? \`आपका investor readiness score \${score} out of 5 है। Weak area: \${missing}. अगला drill: problem, customer, numbers, traction और investment ask को बहुत साफ बोलिए। Pitch को specific, numeric और confident बनाइए।\`
      : \`Your investor readiness score is \${score} out of 5. Weak area: \${missing}. Next drill: make the problem, customer, numbers, traction, and investment ask impossible to misunderstand. Keep it specific, numeric, and confident.\`;
    return { score, missing, language, response };
  }

  function renderScore(result) {
    lastJudgeResponse = result.response;
    lastDetectedLanguage = result.language;
    const label = result.language === "hi-IN" ? "Hindi / Hinglish detected" : "English detected";
    document.querySelector("#scoreBox").innerHTML = \`<strong>\${result.score}/5 investor readiness · \${label}</strong><p>\${result.response}</p>\`;
    document.querySelector("#voiceStatus").textContent = \`Judge response ready in \${result.language === "hi-IN" ? "Hindi / Hinglish" : "English"}.\`;
  }

  function speakJudge(text = lastJudgeResponse, language = lastDetectedLanguage) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = language === "hi-IN" ? 0.92 : 0.96;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function bindPitchCoach() {
    document.querySelector("#scorePitch")?.addEventListener("click", () => {
      const result = scorePitchText(document.querySelector("#pitchText").value);
      renderScore(result);
      speakJudge(result.response, result.language);
    });

    document.querySelector("#speakAgain")?.addEventListener("click", () => speakJudge());

    document.querySelector("#startVoice")?.addEventListener("click", () => {
      if (!SpeechRecognition) {
        document.querySelector("#voiceStatus").textContent = "Speech recognition is not supported in this browser. You can still type the pitch and use audio judge playback.";
        return;
      }
      recognition = new SpeechRecognition();
      const mode = document.querySelector("#speechMode").value;
      recognition.lang = mode === "hi-IN" ? "hi-IN" : "en-IN";
      recognition.interimResults = true;
      recognition.continuous = true;
      let finalText = "";
      document.querySelector("#startVoice").classList.add("active");
      document.querySelector("#voiceStatus").textContent = "Listening. Pitch naturally. Stop when done.";
      recognition.onresult = (event) => {
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0].transcript;
          if (event.results[index].isFinal) finalText += \`\${transcript} \`;
          else interim += transcript;
        }
        document.querySelector("#pitchText").value = \`\${finalText}\${interim}\`.trim();
      };
      recognition.onerror = (event) => {
        document.querySelector("#voiceStatus").textContent = \`Audio mode error: \${event.error}. Try typing or check microphone permission.\`;
        document.querySelector("#startVoice").classList.remove("active");
      };
      recognition.onend = () => {
        document.querySelector("#startVoice").classList.remove("active");
        const text = document.querySelector("#pitchText").value.trim();
        if (!text) return;
        const result = scorePitchText(text);
        renderScore(result);
        speakJudge(result.response, result.language);
      };
      recognition.start();
    });

    document.querySelector("#stopVoice")?.addEventListener("click", () => {
      if (recognition) recognition.stop();
    });
  }

  bindPitchCoach();
`;

export default function PitchCoach() {
  return (
    <>
      <Head>
        <title>Pitch Coach - Bazaar Radar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <style jsx global>{`
        .coach-shell { max-width: 1180px; margin: 0 auto; padding: 12px; }
        .coach-hero, .coach-grid > section { border: 1px solid rgba(16,19,26,.16); border-radius: 26px; background: rgba(255,253,247,.82); padding: 18px; backdrop-filter: blur(18px); }
        .coach-hero h1 { max-width: 11ch; margin: 0; font-family: "Arial Narrow", Impact, system-ui, sans-serif; font-size: clamp(3.2rem, 11vw, 8rem); line-height: .86; text-transform: uppercase; }
        .coach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .coach-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
        .coach-list li { border-left: 5px solid var(--blue); border-radius: 14px; background: rgba(255,255,255,.58); padding: 10px; line-height: 1.45; }
        .trainer { display: grid; gap: 10px; }
        textarea { min-height: 150px; border: 1px solid rgba(16,19,26,.28); border-radius: 18px; padding: 12px; font: inherit; resize: vertical; }
        .score-box { border-radius: 18px; background: var(--ink); color: var(--paper); padding: 14px; }
        .score-box strong { color: var(--yellow); }
        .audio-console { display: grid; gap: 10px; border: 1px solid rgba(16,19,26,.16); border-radius: 20px; background: rgba(255,255,255,.56); padding: 12px; }
        .audio-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .audio-actions button, .audio-actions select { min-height: 38px; border: 1px solid rgba(16,19,26,.28); border-radius: 999px; padding: 0 12px; font-weight: 800; }
        .audio-actions button.active { background: var(--red); color: white; }
        .voice-status { margin: 0; color: var(--muted); font-size: .9rem; }
        @media (max-width: 820px) { .coach-grid { grid-template-columns: 1fr; } }
      `}</style>

      <main className="coach-shell">
        <section className="coach-hero">
          <p className="eyebrow">Pitch coach</p>
          <h1>Train like the room is full of sharks</h1>
          <p>
            Practice the 60-second version, the investor Q&A, the numbers, and
            the story until the business sounds obvious.
          </p>
          <p>
            <a className="ghost-button link-button" href="/">
              Back to Bazaar Radar
            </a>
          </p>
        </section>

        <div className="coach-grid">
          <section>
            <p className="eyebrow">Current Shark Tank-style guidance</p>
            <h2>What to prepare</h2>
            <ul className="coach-list">
              <li>Official Shark Tank casting accepts online applications and open-call applications when available.</li>
              <li>Open calls use a short 1-minute pitch to the casting team, so clarity matters fast.</li>
              <li>Official casting communication should come from email addresses ending in <strong>@sharktanktv.com</strong>.</li>
              <li>Know the problem, product, customer, traction, numbers, valuation, and exactly what investment you want.</li>
              <li>Prepare a founder story, not only a spreadsheet. Investors buy the operator as much as the idea.</li>
            </ul>
            <p className="caption">
              Source anchors: <a href="https://abc.com/shows/shark-tank/open-call">ABC Shark Tank open calls</a>,{" "}
              <a href="https://abc.com/shows/shark-tank/apply">ABC Shark Tank casting</a>,{" "}
              <a href="https://www.sequoiacap.com/article/writing-a-business-plan/">Sequoia business plan guide</a>, and{" "}
              <a href="https://www.ycombinator.com/blog/how-to-pitch-your-company/">YC pitch guidance</a>.
            </p>
          </section>

          <section>
            <p className="eyebrow">Pitch structure</p>
            <h2>60-second script</h2>
            <ul className="coach-list">
              <li><strong>0-10 sec:</strong> Hook: the painful problem and who has it.</li>
              <li><strong>10-25 sec:</strong> Your product or offline format and why it is different.</li>
              <li><strong>25-40 sec:</strong> Demand proof, sales, repeat behavior, or local validation.</li>
              <li><strong>40-50 sec:</strong> Unit economics: margin, cost, payback, and scale path.</li>
              <li><strong>50-60 sec:</strong> Ask: amount, use of funds, and what investor help unlocks.</li>
            </ul>
          </section>

          <section className="trainer">
            <p className="eyebrow">AI-style investor trainer</p>
            <h2>Practice pitch</h2>
            <div className="audio-console">
              <p className="voice-status" id="voiceStatus">
                Audio mode ready. Speak your pitch, then the investor judge will answer in the detected language.
              </p>
              <div className="audio-actions">
                <select id="speechMode" aria-label="Speech recognition mode" defaultValue="auto">
                  <option value="auto">Auto detect response</option>
                  <option value="en-IN">English / Hinglish mic</option>
                  <option value="hi-IN">Hindi mic</option>
                </select>
                <button id="startVoice" type="button">Start audio pitch</button>
                <button id="stopVoice" type="button">Stop</button>
                <button id="speakAgain" type="button">Replay judge</button>
              </div>
            </div>
            <textarea id="pitchText" placeholder="Paste or type your 60-second pitch here..." />
            <button className="print-button" id="scorePitch" type="button">Score my pitch</button>
            <div className="score-box" id="scoreBox">
              <strong>Investor mode ready.</strong>
              <p>Paste a pitch and I will score clarity, numbers, traction, ask, and story.</p>
            </div>
          </section>

          <section>
            <p className="eyebrow">Investor questions</p>
            <h2>Practice Q&A</h2>
            <ul className="coach-list">
              <li>Why will this work in your city and not only in the source city?</li>
              <li>What is your customer acquisition cost during the first 30 days?</li>
              <li>What proof do you have that people will repeat purchase?</li>
              <li>What stops a local competitor from copying this in two weeks?</li>
              <li>If I give you capital, what exactly changes in the next 90 days?</li>
            </ul>
          </section>
        </div>
      </main>

      <Script id="pitch-coach-audio" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: coachScript }} />
    </>
  );
}
