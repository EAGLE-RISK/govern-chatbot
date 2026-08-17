export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "4rem auto",
        padding: "0 1.5rem",
        lineHeight: 1.6,
      }}
    >
      <h1>Govern Chatbot API</h1>
      <p>
        Backend IA pour <strong>Eynam</strong>, l&apos;assistant Govern One.
      </p>
      <p>
        <a href="/test" style={{ color: "#0b485a", fontWeight: 600 }}>
          → Ouvrir le playground de test (/test)
        </a>
      </p>
      <ul>
        <li>
          <code>POST /api/chat</code> — chat (streaming avec{" "}
          <code>Accept: text/plain</code>)
        </li>
        <li>
          <code>GET /api/health</code> — statut du service
        </li>
      </ul>
      <p>
        Documentation : <code>docs/GUIDE_INTEGRATION.md</code>
      </p>
    </main>
  );
}
