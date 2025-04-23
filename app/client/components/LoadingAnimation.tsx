import Image from "next/image";

export default function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center animate-bounce mt-60">
      <Image src="/logo.png" alt="logo" width={100} height={100} />
    </div>
  );
}
