import React, { useRef } from "react";
import Barcode from "react-barcode";

interface TicketCardProps {
  ticketCode: string;
  templateSrc?: string;
  ticketRef?: React.RefObject<HTMLDivElement>;  // ← ref passée depuis le parent
}

export default function TicketCard({
  ticketCode,
  templateSrc = "/images/ticket-bg.jpg",
  ticketRef,
}: TicketCardProps) {
  const formattedCode = ticketCode.padStart(7, "0");

  return (
    <div ref={ticketRef} style={styles.ticket}>

      <img
        src={templateSrc}
        alt=""
        style={styles.backgroundImage}
        crossOrigin="anonymous"
      />

      <div style={styles.leftColumn}>
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

        <div style={styles.numberBadge}>
          <span style={styles.numberText}>{formattedCode}</span>
        </div>
      </div>

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  ticket: {
    position: "relative",
    width: "900px",
    height: "400px",
    maxWidth: "100%",
    overflow: "hidden",
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

  leftColumn: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "95px",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  barcodeWrapper: {
    transform: "rotate(-90deg)",
    transformOrigin: "center center",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: "-95px",
  },

  numberBadge: {
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
};