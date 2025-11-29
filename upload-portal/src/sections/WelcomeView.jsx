const WelcomeView = ({ step }) => {
  const subtitle =
    step === "welcome"
      ? "Masadaki QR kodu taradığın için teşekkür ederiz. Fotoğraf veya videonu ekleyip anı defterine katkıda bulun."
      : "Dosyan hazır. Birkaç saniye içinde anı sahibine ulaşacak.";

  return (
    <header className="welcome">
      <p className="eyebrow">Memory Moments</p>
      <h1>Her an paylaşılsın.</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  );
};

export default WelcomeView;


