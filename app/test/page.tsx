import ChatPlayground from "./ChatPlayground";
import "./test.css";

export default function TestPage() {
  return (
    <>
      <p className="test-nav">
        <a href="/">← Accueil API</a>
      </p>
      <ChatPlayground />
    </>
  );
}
