// TicketCard.tsx
import React, { useRef, useState } from "react";
import Barcode from "react-barcode";
import { toJpeg, toPng } from "html-to-image";

interface TicketCardProps {
  ticketCode: string;
  holderName?: string;
  templateSrc?: string;
  downloadFormat?: "jpg" | "png";
  onDownloaded?: () => void;
}

export default function TicketCard({
  ticketCode,
  holderName,
  templateSrc = "/images/ticket-bg.jpg",
  downloadFormat = "jpg",
  onDownloaded,
}: TicketCardProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const formattedCode = ticketCode.padStart(7, "0");

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    try {
      const exportFn = downloadFormat === "png" ? toPng : toJpeg;
      const dataUrl = await exportFn(ticketRef.current, {
        quality: 0.98,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const link = document.createElement("a");
      link.download = `ticket_${formattedCode}.${downloadFormat}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      onDownloaded?.();
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Erreur export ticket :", err);
      alert("Impossible de générer l'image.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={styles.wrapper}>

      <div ref={ticketRef} style={styles.ticket}>

        {/* Image de fond */}
        <img
          src={templateSrc}
          alt=""
          style={styles.backgroundImage}
          crossOrigin="anonymous"
        />

        {/* Colonne gauche : code-barres + badge numéro */}
        <div style={styles.leftColumn}>

          {/* Code-barres pivoté -90° */}
          <div style={styles.barcodeWrapper}>
            <Barcode
              value={formattedCode}
              format="CODE128"
              width={3.1}
              height={50}
              displayValue={false}
              background="transparent"
              lineColor="#1a1a1a"
              margin={0}
            />
          </div>

          {/* Badge rouge avec numéro vertical */}
          <div style={styles.numberBadge}>
            <span style={styles.numberText}>{formattedCode}</span>
          </div>

        </div>
      </div>

      {holderName && (
        <p style={styles.holderName}>
          Billet de&nbsp;<strong>{holderName}</strong>
        </p>
      )}

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        style={{
          ...styles.downloadButton,
          ...(isDownloading ? styles.btnLoading : {}),
          ...(downloaded ? styles.btnSuccess : {}),
        }}
      >
        {isDownloading ? (
          <><Spinner />Génération en cours…</>
        ) : downloaded ? (
          <><CheckIcon />Ticket téléchargé !</>
        ) : (
          <><DownloadIcon />Télécharger mon ticket</>
        )}
      </button>

      <p style={styles.hint}>
        Résolution 3× · Format {downloadFormat.toUpperCase()} · À présenter à l'entrée
      </p>

      <style>{`@keyframes tk-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "tk-spin 0.7s linear infinite",
      flexShrink: 0,
      display: "inline-block",
    }} />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
//
// Template : ~1594×570px → ratio ≈ 2.8:1
// Zone beige gauche : ~240px sur 1594px = ~15% → sur 900px = ~135px
// Code-barres : pivoté -90°, height=80 devient largeur après rotation
// Badge rouge : centré sous le code-barres

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    padding: "28px 16px",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },

  ticket: {
    position: "relative",
    width: "1000px",
    height: "450px",
    overflow: "scroll",
    boxShadow: "0 10px 50px rgba(0,0,0,0.4)",
    flexShrink: 0,
  },

  backgroundImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "left center",
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
  },

  // Zone beige = ~15% de 900px = 135px
  // Remplace uniquement la section leftColumn, barcodeWrapper et numberBadge dans les styles

leftColumn: {
  position: "absolute",
  top: 0,
  left: 0,
  width: "95px",
  height: "100%",
  display: "flex",
  flexDirection: "row",        // ← côte à côte
  alignItems: "center",        // ← centré verticalement
  justifyContent: "center"
},

barcodeWrapper: {
  transform: "rotate(-90deg)",
  transformOrigin: "center center",
  width: "275px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginRight: "-95px",
},

numberBadge: {
  //backgroundColor: "#c0392b",
  borderRadius: "4px",
  padding: "8px 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  minHeight: "90px",
  flexShrink: 0,
  marginTop: "-140px",
},

  numberText: {
    color: "#ffffff",
    fontSize: "1.1em",
    fontWeight: "800",
    letterSpacing: "1.5px",
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    lineHeight: 1.1,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },

  holderName: {
    fontSize: "13px",
    color: "#666",
    margin: 0,
  },

  downloadButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    backgroundColor: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px 36px",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.4px",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    minWidth: "250px",
  },

  btnLoading: {
    backgroundColor: "#aaa",
    cursor: "not-allowed",
  },

  btnSuccess: {
    backgroundColor: "#27ae60",
  },

  hint: {
    fontSize: "11px",
    color: "#aaa",
    margin: 0,
    letterSpacing: "0.3px",
  },
};