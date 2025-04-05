import Link from "next/link";

interface LogoDarkProps {
  className?: string;
}

const LogoDark = ({ className }: LogoDarkProps) => {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className || ''}`}>
      <div className="flex items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
          <span className="font-bold text-xl text-white">R</span>
          <span className="font-bold text-xl text-[#1e2c51]">N</span>
        </div>
        <div className="ml-3">
          <h1 className="font-bold text-xl text-white">
            <span className="text-yellow-400">RN</span>
            <span>Student</span>
          </h1>
          <p className="text-sm font-medium text-gray-400 -mt-1">
            Resources
          </p>
        </div>
      </div>
    </Link>
  );
};

export default LogoDark; 