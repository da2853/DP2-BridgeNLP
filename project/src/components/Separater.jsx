export default function Separater() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-24 bg-repeat-x"
      style={{
        backgroundImage:
          "radial-gradient(circle, #ffffff 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.1,
      }}
    />
  );
}