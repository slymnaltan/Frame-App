const SuccessView = ({ onReset }) => {
  return (
    <section className="success-view">
      <p className="eyebrow">Teşekkürler</p>
      <h1>Anın ulaştı!</h1>
      <p className="subtitle">
        Yüklediğin içerik hemen etkinlik sahibinin “Yüklemelerim” ekranında
        listelendi. Katkın için teşekkür ederiz.
      </p>

      <div className="success-card">
        <p>Yeni bir fotoğraf ya da video daha eklemek ister misin?</p>
        <button className="secondary-btn" onClick={onReset}>
          Başka yükle
        </button>
      </div>
    </section>
  );
};

export default SuccessView;


