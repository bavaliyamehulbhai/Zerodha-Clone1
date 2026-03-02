import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Confetti from "react-confetti";
import Cropper from "react-easy-crop";
import ConfirmationModal from "./ConfirmationModal";
import { ToastContext } from "./ToastContext";

const KYC = () => {
  const [status, setStatus] = useState("NOT_SUBMITTED"); // NOT_SUBMITTED, PENDING, APPROVED, REJECTED
  const [kycData, setKycData] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionFailed, setSubmissionFailed] = useState(false);
  const { showToast } = useContext(ToastContext);
  const [showConfetti, setShowConfetti] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppingImage, setCroppingImage] = useState(null);
  const [currentFileType, setCurrentFileType] = useState(null); // 'PAN', 'AADHAAR', 'SELFIE'

  const completedSteps = [panFile, aadhaarFile, selfie].filter(Boolean).length;
  const totalSteps = 3;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const missingSteps = [];
  if (!panFile) missingSteps.push("PAN");
  if (!aadhaarFile) missingSteps.push("Aadhaar");
  if (!selfie) missingSteps.push("Photo");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("http://localhost:3002/kyc/status", {
        withCredentials: true,
      });
      if (res.data.kyc) {
        setStatus(res.data.kyc.status);
        setKycData(res.data.kyc);
        if (res.data.kyc.status === "DRAFT") {
          if (res.data.kyc.panUrl) setPanFile(res.data.kyc.panUrl);
          if (res.data.kyc.aadhaarUrl) setAadhaarFile(res.data.kyc.aadhaarUrl);
          if (res.data.kyc.selfieUrl) setSelfie(res.data.kyc.selfieUrl);
        }
      }
    } catch (error) {
      // console.error("Error fetching KYC status", error);
      if (error.response && error.response.status === 404) {
         // Endpoint not found or user not found, default to NOT_SUBMITTED
      }
    }
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height,
        );

        // Resize logic
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = canvas.width;
        let height = canvas.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext("2d");
        finalCtx.drawImage(canvas, 0, 0, width, height);

        resolve(finalCanvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e, fileType) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setCroppingImage(reader.result);
        setCurrentFileType(fileType);
      };
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setCroppingImage(reader.result);
        setCurrentFileType(fileType);
      };
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(croppingImage, croppedAreaPixels);
      if (currentFileType === "PAN") setPanFile(croppedImage);
      if (currentFileType === "AADHAAR") setAadhaarFile(croppedImage);
      if (currentFileType === "SELFIE") setSelfie(croppedImage);
      closeCropper();
    } catch (e) {
      console.error(e);
    }
  };

  const closeCropper = () => {
    setCroppingImage(null);
    setCurrentFileType(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:3002/kyc/draft",
        { panUrl: panFile, aadhaarUrl: aadhaarFile, selfieUrl: selfie },
        { withCredentials: true },
      );
      showToast("KYC Draft Saved!", "success");
      fetchStatus();
    } catch (error) {
      console.error("KYC Draft Save Error:", error);
      const msg = error.response?.data?.message || "Failed to save draft";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setSubmissionFailed(false);
    try {
      await axios.post(
        "http://localhost:3002/kyc/submit",
        { panUrl: panFile, aadhaarUrl: aadhaarFile, selfieUrl: selfie },
        {
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          },
        },
      );
      setShowConfetti(true);
      showToast("KYC Submitted Successfully!", "success");
      fetchStatus();
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error("KYC Submit Error:", error);
      const msg = error.response?.data?.message || "Failed to submit KYC. Please try again.";
      showToast(msg, "error");
      setSubmissionFailed(true);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!panFile || !aadhaarFile || !selfie) {
      showToast("Please upload PAN, Aadhaar and Passport Size Photo.", "warning");
      return;
    }
    setShowConfirmModal(true);
  };

  return (
    <div className="kyc-container">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <h2>KYC Verification</h2>

      {status === "APPROVED" && (
        <div className="status-box approved">
          <h3>✅ KYC Verified</h3>
          <p>
            Your account is fully verified. You can now trade without
            restrictions.
          </p>
        </div>
      )}

      {status === "PENDING" && (
        <div className="status-box pending">
          <h3>⏳ Verification in Progress</h3>
          <p>We have received your documents. Admin verification is pending.</p>
        </div>
      )}

      {(status === "NOT_SUBMITTED" || status === "REJECTED" || status === "DRAFT") && (
        <div className="upload-section">
          <div className="stepper-wrapper">
            <div className={`step-item ${panFile ? "completed" : "active"}`}>
              <div className="step-circle">{panFile ? "✓" : "1"}</div>
              <span className="step-text">PAN Upload</span>
            </div>
            <div className={`step-connector ${panFile ? "active" : ""}`}></div>
            <div className={`step-item ${aadhaarFile ? "completed" : panFile ? "active" : ""}`}>
              <div className="step-circle">{aadhaarFile ? "✓" : "2"}</div>
              <span className="step-text">Aadhaar</span>
            </div>
            <div className={`step-connector ${aadhaarFile ? "active" : ""}`}></div>
            <div className={`step-item ${selfie ? "completed" : aadhaarFile ? "active" : ""}`}>
              <div className="step-circle">{selfie ? "✓" : "3"}</div>
              <span className="step-text">Photo</span>
            </div>
          </div>
          {status === "REJECTED" && (
            <div className="status-box rejected">
              <h3>❌ KYC Rejected</h3>
              <p>Reason: {kycData?.rejectionReason}</p>
              <p>Please re-upload valid documents.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              className="form-group drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "PAN")}
            >
              <label>Upload PAN Card</label>
              <input
                type="file"
                accept="image/*"
                id="pan-input"
                onChange={(e) => handleFileChange(e, "PAN")}
                style={{ display: "none" }}
              />
              <label htmlFor="pan-input" className="file-label">
                Drag & Drop or Click to Upload
              </label>
              {panFile && (
                <img src={panFile} alt="PAN Preview" className="preview-img" />
              )}
            </div>

            <div
              className="form-group drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "AADHAAR")}
            >
              <label>Upload Aadhaar Card</label>
              <input
                type="file"
                accept="image/*"
                id="aadhaar-input"
                onChange={(e) => handleFileChange(e, "AADHAAR")}
                style={{ display: "none" }}
              />
              <label htmlFor="aadhaar-input" className="file-label">
                Drag & Drop or Click to Upload
              </label>
              {aadhaarFile && (
                <img
                  src={aadhaarFile}
                  alt="Aadhaar Preview"
                  className="preview-img"
                />
              )}
            </div>

            <div
              className="form-group drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "SELFIE")}
            >
              <label>Upload Passport Size Photo</label>
              <input
                type="file"
                accept="image/*"
                id="selfie-input"
                onChange={(e) => handleFileChange(e, "SELFIE")}
                style={{ display: "none" }}
              />
              <label htmlFor="selfie-input" className="file-label">
                Drag & Drop or Click to Upload
              </label>
              {selfie && (
                <img
                  src={selfie}
                  alt="Passport Photo Preview"
                  className="preview-img"
                />
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-draft"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save as Draft
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>

            {submissionFailed && !loading && (
              <div className="retry-section">
                <p className="error-msg">Submission failed. Please try again.</p>
                <button type="button" className="btn-retry" onClick={confirmSubmit}>
                  Retry Submission
                </button>
              </div>
            )}

            {loading && (
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </form>
        </div>
      )}

      {croppingImage && (
        <div className="cropper-modal">
          <div className="cropper-wrapper">
            <div className="cropper-container">
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="cropper-controls">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="zoom-range"
              />
              <div className="cropper-buttons">
                <button className="btn-secondary" onClick={closeCropper}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCropSave}>
                  Crop & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Submission"
        message="Are you sure you want to submit your KYC documents? This action cannot be undone."
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Yes, Submit"
        cancelText="Cancel"
      />

      <style>{`
        .kyc-container {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status-box {
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: center;
        }
        .approved { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .pending { background: #fff3e0; color: #ef6c00; border: 1px solid #ffe0b2; }
        .rejected { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .drop-zone {
          border: 2px dashed #ccc;
          padding: 20px;
          text-align: center;
          border-radius: 4px;
          transition: all 0.3s ease;
          background-color: #fafafa;
        }
        .drop-zone.drag-over {
          border-color: #387ed1;
          background-color: #e3f2fd;
        }
        .file-label {
          display: inline-block;
          padding: 8px 16px;
          background: #eee;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 10px;
        }
        .file-label:hover {
          background: #e0e0e0;
        }
        .preview-img {
          margin-top: 10px;
          max-width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #eee;
        }
        .btn-primary {
          flex: 1;
          background: #387ed1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn-draft {
          flex: 1;
          background: #f0f0f0;
          color: #333;
          border: 1px solid #ccc;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn-retry {
          background: #ff9800;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        }
        .retry-section {
          margin-top: 15px;
          text-align: center;
        }
        .error-msg {
          color: #d32f2f;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }
        .btn-primary:disabled { background: #ccc; }
        .progress-container {
          margin-top: 15px;
          width: 100%;
          background-color: #f3f3f3;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          height: 20px;
        }
        .progress-bar {
          height: 100%;
          background-color: #4caf50;
          transition: width 0.3s ease;
        }
        .progress-text {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.8rem;
          color: #333;
          line-height: 20px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
        }
        .stepper-wrapper {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          position: relative;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
          width: 60px;
        }
        .step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #e0e0e0;
          color: #666;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          margin-bottom: 5px;
          transition: all 0.3s;
        }
        .step-item.active .step-circle {
          background-color: #387ed1;
          color: white;
          box-shadow: 0 0 0 4px rgba(56, 126, 209, 0.2);
        }
        .step-item.completed .step-circle {
          background-color: #4caf50;
          color: white;
        }
        .step-text {
          font-size: 0.8rem;
          color: #666;
        }
        .step-item.active .step-text, .step-item.completed .step-text {
          color: #333;
          font-weight: 500;
        }
        .step-connector {
          flex: 1;
          height: 3px;
          background-color: #e0e0e0;
          margin-top: 15px;
          transform: translateY(-50%);
          transition: background-color 0.3s;
        }
        .step-connector.active {
          background-color: #4caf50;
        }
        .cropper-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          z-index: 2000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .cropper-wrapper {
          width: 90%;
          max-width: 600px;
          height: 80%;
          background: white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .cropper-container {
          position: relative;
          flex: 1;
          background: #333;
        }
        .cropper-controls {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: white;
        }
        .zoom-range {
          width: 100%;
        }
        .cropper-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        @keyframes flashAnim {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes progress-bar-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default KYC;
