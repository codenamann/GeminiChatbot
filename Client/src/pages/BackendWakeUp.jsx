import { useEffect, useState } from "react";

export default function BackendWakePage() {
  const [seconds, setSeconds] = useState(15);
  const BACKEND_URL = import.meta.env.VITE_SERVER_URI;

  function pingBackend() {
    return fetch(`${BACKEND_URL}/ping`, { method: "GET" })
      .then((res) => res.json())
      .catch(() => null);
  }

  useEffect(() => {
    let interval;

    async function startPingLoop() {
      const result = await pingBackend();

      if (result?.status === "ok") {
        window.location.href = "/chat";
        return;
      }

      interval = setInterval(async () => {
        const res = await pingBackend();

        if (res?.status === "ok") {
          clearInterval(interval);
          window.location.href = "/chat";
        }
      }, 10000); // retry every 10 seconds
    }

    startPingLoop();

    const countdown = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      textAlign: "center"
    }}>
      <h1>Starting Server...</h1>
      <p style={{ fontSize: "18px", marginTop: "10px" }}>
        Render free-tier backend is waking up.
      </p>
      <p style={{ marginTop: "20px", fontSize: "22px" }}>
        Please wait <b>{seconds}</b> seconds...
      </p>
      <p style={{ marginTop: "10px", color: "gray" }}>
        This happens only after inactivity. Preparing your chatbot…
      </p>
    </div>
  );
}
