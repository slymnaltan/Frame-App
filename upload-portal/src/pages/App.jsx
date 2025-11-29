import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import SuccessView from "../sections/SuccessView";
import UploadForm from "../sections/UploadForm";
import WelcomeView from "../sections/WelcomeView";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const App = () => {
  const { slug } = useParams();
  const [step, setStep] = useState("welcome"); // welcome -> ready -> success
  const [files, setFiles] = useState([]);
  const [uploader, setUploader] = useState({ name: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const disabled = useMemo(() => files.length === 0 || loading, [files, loading]);

  const handleFileChange = selectedFiles => {
    if (!selectedFiles?.length) return;
    setFiles(prev => [...prev, ...selectedFiles]);
    setStep("ready");
  };

  const handleReset = () => {
    setStep("welcome");
    setFiles([]);
    setUploader({ name: "", note: "" });
    setMessage(null);
  };

  const handleRemoveFile = index => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setStep("welcome");
    }
  };

  const handleUpload = async () => {
    if (!files.length || !slug) return;
    setLoading(true);
    setMessage(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (uploader.name) formData.append("uploaderName", uploader.name);
        if (uploader.note) formData.append("note", uploader.note);

        try {
          await axios.post(`${API_URL}/upload/${slug}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (error) {
          const responseMessage =
            error.response?.data?.error ||
            "Bir dosya yüklenemedi. Daha sonra tekrar deneyin.";
          setMessage(`${file.name}: ${responseMessage}`);
          return;
        }
      }
      setStep("success");
    } finally {
      setLoading(false);
    }
  };

  if (!slug) {
    return (
      <div className="page">
        <div className="card">
          <h1>Slug bulunamadı</h1>
          <p>Geçerli bir QR bağlantısı kullanarak tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="card">
        {step === "success" ? (
          <SuccessView onReset={handleReset} />
        ) : (
          <>
            <WelcomeView step={step} />
            <UploadForm
              files={files}
              uploader={uploader}
              setUploader={setUploader}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
              onUpload={handleUpload}
              disabled={disabled}
              loading={loading}
              errorMessage={message}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;


