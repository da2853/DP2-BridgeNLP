export default function Button2({ children, className, ...props }) {
  return (
    <button
      className={`bg-transparent text-white rounded-full px-8 py-3 
             border border-[#7286ff] hover:border-[#7286ff] hover:text-[#60A5FA] 
             font-semibold text-sm tracking-wide transition-all duration-300 ease-in-out
             hover:bg-[#7286ff]/10 ${className}`}
      {...props}
    >
      {children}
    </button>
  );

}