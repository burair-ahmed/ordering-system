
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
  <div className="absolute inset-0 bg-cover bg-center bg-[url('/bg-hero.webp')]">
    <div className="absolute inset-0 bg-black opacity-40"></div>
    <div className="absolute inset-0 bg-[#C46A47] opacity-[0.08]"></div>
  </div>
  
  {/* Content */}
  <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center text-white relative z-10 tracking-tight drop-shadow-2xl">
    <span className="block text-sm uppercase tracking-[0.3em] font-medium mb-4 opacity-80">Welcome To</span>
    The Chai Company
  </h1>
</div>

      </div>
      </>
    );
  }
  