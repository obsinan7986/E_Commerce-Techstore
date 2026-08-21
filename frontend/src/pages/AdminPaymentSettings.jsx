import { useEffect, useRef, useState } from "react";
import { getPaymentSettings, updatePaymentSettings } from "../services/paymentService";
import "../styles/adminPaymentSettings.css";
import { BASE_URL } from "../services/api";



const EMPTY_ACCOUNT = { bankName: "", accountName: "", accountNumber: "" };

const AdminPaymentSettings = () => {
  const fileRef = useRef(null);

  const [instructions, setInstructions] = useState("");
  const [accounts,     setAccounts]     = useState([{ ...EMPTY_ACCOUNT }]);
  const [currentQr,    setCurrentQr]    = useState("");
  const [qrFile,       setQrFile]       = useState(null);
  const [qrPreview,    setQrPreview]    = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState({ type: "", text: "" });

  useEffect(() => {
    getPaymentSettings()
      .then((d) => {
        const s = d.settings || {};
        setInstructions(s.instructions || "");
        setCurrentQr(s.bankQrCode || "");
        // Support new bankAccounts array OR legacy single-account fields
        if (s.bankAccounts?.length) {
          setAccounts(s.bankAccounts);
        } else if (s.accountNumber) {
          setAccounts([{
            bankName:      s.bankName      || "",
            accountName:   s.accountName   || "",
            accountNumber: s.accountNumber || "",
          }]);
        } else {
          setAccounts([{ ...EMPTY_ACCOUNT }]);
        }
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load settings." }))
      .finally(() => setLoading(false));
  }, []);

  const handleAccountChange = (i, field, val) => {
    setAccounts((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const addAccount = () => setAccounts((p) => [...p, { ...EMPTY_ACCOUNT }]);

  const removeAccount = (i) => {
    if (accounts.length === 1) return; // keep at least one
    setAccounts((p) => p.filter((_, idx) => idx !== i));
  };

  const handleQrFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });

      const fd = new FormData();
      fd.append("instructions",  instructions.trim());
      fd.append("bankAccounts",  JSON.stringify(accounts));
      if (qrFile) fd.append("qrCode", qrFile);

      const res = await updatePaymentSettings(fd);
      setCurrentQr(res.settings?.bankQrCode || currentQr);
      setQrFile(null);
      setQrPreview("");
      if (fileRef.current) fileRef.current.value = "";
      setMsg({ type: "success", text: "Payment settings saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="aps-page"><div className="aps-loading">Loading settings…</div></div>
  );

  return (
    <div className="aps-page">
      <div className="aps-header">
        <h1>Payment Settings</h1>
        <p>Configure bank accounts and QR code shown to customers during checkout.</p>
      </div>

      {msg.text && (
        <div className={`aps-msg aps-msg--${msg.type}`}>{msg.text}</div>
      )}

      <div className="aps-grid">
        {/* Left: bank accounts */}
        <div className="aps-card">
          <div className="aps-card-header">
            <h2>Bank Accounts</h2>
            <button className="aps-add-account-btn" onClick={addAccount}>+ Add Account</button>
          </div>
          <div className="aps-card-body">
            {accounts.map((acc, i) => (
              <div className="aps-account-block" key={i}>
                <div className="aps-account-block-header">
                  <span className="aps-account-num">Account {i + 1}</span>
                  {accounts.length > 1 && (
                    <button className="aps-remove-btn" onClick={() => removeAccount(i)}>✕ Remove</button>
                  )}
                </div>
                <div className="aps-form-group">
                  <label>Bank / Service Name</label>
                  <input
                    type="text"
                    value={acc.bankName}
                    onChange={(e) => handleAccountChange(i, "bankName", e.target.value)}
                    placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
                  />
                </div>
                <div className="aps-form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={acc.accountName}
                    onChange={(e) => handleAccountChange(i, "accountName", e.target.value)}
                    placeholder="e.g. TechStore PLC"
                  />
                </div>
                <div className="aps-form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={acc.accountNumber}
                    onChange={(e) => handleAccountChange(i, "accountNumber", e.target.value)}
                    placeholder="e.g. 1000597550938"
                  />
                </div>
              </div>
            ))}

            <div className="aps-form-group" style={{ marginTop: 8 }}>
              <label>Payment Instructions (shown to customers)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Transfer the exact amount and upload your screenshot."
              />
            </div>
          </div>
        </div>

        {/* Right: QR code */}
        <div className="aps-card">
          <div className="aps-card-header"><h2>Bank QR Code</h2></div>
          <div className="aps-card-body">
            <p className="aps-hint">
              Upload a QR code image that customers can scan to make their payment.
            </p>

            {currentQr && !qrPreview && (
              <div className="aps-qr-current">
                <p>Current QR:</p>
                <img src={`${BASE_URL}${currentQr}`} alt="Current QR" className="aps-qr-img" />
              </div>
            )}

            {qrPreview && (
              <div className="aps-qr-current">
                <p>New QR preview:</p>
                <img src={qrPreview} alt="New QR" className="aps-qr-img" />
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              id="aps-qr-file"
              style={{ display: "none" }}
              onChange={handleQrFile}
            />
            <label htmlFor="aps-qr-file" className="aps-upload-label">
              {qrFile ? `📎 ${qrFile.name}` : "📷 Choose QR Code Image"}
            </label>

            {qrFile && (
              <button
                className="aps-clear-btn"
                onClick={() => { setQrFile(null); setQrPreview(""); if (fileRef.current) fileRef.current.value = ""; }}
              >
                ✕ Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="aps-actions">
        <button className="aps-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
