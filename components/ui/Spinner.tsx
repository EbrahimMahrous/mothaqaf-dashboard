import { Loader2 } from "lucide-react";

export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2
        style={{ width: size, height: size }}
        className="text-primary animate-spin-slow"
      />
    </div>
  );
}
