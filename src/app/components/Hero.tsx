import Image from "next/image";

export default function Hero() {
    return (
      <div className="hero flex justify-center items-center w-11/12 mx-auto">
        <div>
          <Image src="/cafe-banner.webp" alt="Banner" width={1920} height={100} className="rounded-[15px]"/>
        </div>
      </div>
    );
  }
  