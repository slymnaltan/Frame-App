import { useRef } from "react";

const UploadForm = ({
  files,
  uploader,
  setUploader,
  onFileChange,
  onRemoveFile,
  onUpload,
  disabled,
  loading,
  errorMessage,
}) => {
  const fileInputRef = useRef(null);

  const handleSelectFile = event => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length > 0) {
      onFileChange(selected);
      event.target.value = null;
    }
  };

  return (
    <section className="upload-card">
      <div
        className="dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleSelectFile}
        />
        {files.length === 0 ? (
          <>
            <span className="dropzone-icon">⬆</span>
            <h3>Dosyanı sürükle bırak veya tıkla</h3>
            <p>Fotoğraf ve videolar desteklenir (max 50 MB)</p>
          </>
        ) : (
          <>
            <span className="dropzone-icon ready">✔</span>
            <h3>{files.length} dosya seçildi</h3>
            <p>Hazır olduğunuzda gönderin</p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-item">
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                className="remove-file"
                onClick={event => {
                  event.stopPropagation();
                  onRemoveFile(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="form-grid">
        <label>
          <span>Adınız (opsiyonel)</span>
          <input
            type="text"
            value={uploader.name}
            onChange={e =>
              setUploader(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="İsminiz veya masanız"
          />
        </label>
        <label>
          <span>Not (opsiyonel)</span>
          <textarea
            rows={3}
            value={uploader.note}
            onChange={e =>
              setUploader(prev => ({ ...prev, note: e.target.value }))
            }
            placeholder="Anınıza kısa bir not ekleyin"
          />
        </label>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <button
        className="primary-btn"
        disabled={disabled}
        onClick={onUpload}
      >
        {loading ? "Yükleniyor..." : "Gönder"}
      </button>
    </section>
  );
};

export default UploadForm;


