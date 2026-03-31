export default function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex flex-col text-white overflow-hidden bg-[#080f1e]">
      {/* Background */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-[1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(8,15,30,0.75) 0%, rgba(8,15,30,0.65) 60%, rgba(8,15,30,0.85) 100%), url('/images/background.jpg')",
        }}
      />

      {/* Content */}
      <div className="relative z-[2] w-full px-[5%] mx-auto flex flex-col items-center justify-center text-center flex-1">
        <h1
          className="font-garamond font-light leading-[1.08]"
          style={{ fontSize: "clamp(3rem, 8vw, 9rem)" }}
        >
          Envie de vivre une
          <br />
          expérience inoubliable ?
        </h1>
      </div>

      {/* Bottom card */}
      <div className="relative z-[2] w-full px-[5%] pb-[5vh]">
        <div className="flex items-stretch border border-white/20 backdrop-blur-sm bg-white/8 rounded-sm overflow-hidden">
          {/* Date */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-4 gap-1 border-r border-white/20">
            <span className="font-garamond leading-none" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>
              25
            </span>
            <span className="uppercase tracking-[0.18em] opacity-80" style={{ fontSize: "clamp(0.65rem, 2vw, 0.95rem)" }}>
              Avril 2026
            </span>
          </div>

          {/* Lieu */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-4 gap-1">
            <span className="font-garamond leading-tight text-center" style={{ fontSize: "clamp(1.4rem, 4.5vw, 2.8rem)" }}>
              Forêt du Banco
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}