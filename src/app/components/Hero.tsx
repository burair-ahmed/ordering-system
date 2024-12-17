
export default function Hero() {
    return (
      <>
      {/* <div className="hero flex justify-center items-center w-11/12 mx-auto">
        <div>
          <Image src="/cafe-banner.webp" alt="Banner" width={1920} height={100} className="rounded-[15px]"/>
        </div>
        
      </div> */}
      <div>
      <div className="relative bg-[#000] py-[120px]">
  {/* Background image and overlay */}
  <div className="absolute inset-0 bg-cover bg-center bg-[url('/bg-hero.webp')] opacity-40"></div>
  
  {/* Content */}
  <h1 className="text-5xl font-bold text-center text-white relative z-10">Cafe Little Karachi</h1>
</div>

      </div>
      </>
    );
  }
  