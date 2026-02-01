import logo from "@/assets/logo.png";

const AahbibiLogo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logo} alt="Aahbibi" className="h-full w-auto object-contain" />
      {/* <span className="font-bold text-2xl tracking-tight">aahbibi</span> */}
    </div>
  );
};

export default AahbibiLogo;
