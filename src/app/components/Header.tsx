import Image from "next/image";

export default function Header() {
  return (
    <div className="p-0">
      <div className="fading-gradient">
        <div
          className="background-repeat p-0 -mt-5"
          style={{
            zIndex: "1",
            padding: "0px",
            width: "100%",
            height: "80px",
            backgroundImage: "url(/group426.png)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "400px 80px", 
            backgroundPosition: "0 0", 
        }}
        ></div>

        <div className="grid grid-cols-12 flex items-center w-11/12 mx-auto pt-4">
          <div className="col-span-5 flex gap-4">
            <div className="contact ">
            <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/contact.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                    <p className="text-[10px] font-regular">+92 123456789</p>
                  </div>
                </div>
              </button>
            </div>
            <div className="location">
            <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/location.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                    <p className="text-[10px] font-regular">+92 123456789</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        <div className="col-span-2"></div>
          <div className="col-span-5 flex gap-4 justify-end">
            <div className="cart">
            <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/contact.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                    <p className="text-[10px] font-regular">+92 123456789</p>
                  </div>
                </div>
              </button>
            </div>
            <div className="offcanvas">
            <button className="bg-[#ff9824] rounded-[5px] px-4 py-1">
                <div className="flex items-center gap-2 mx-auto">
                  <div className="flex items-center">
                    <Image src="/location.svg" alt="" width={15} height={15} />
                  </div>
                  <div className="text-left">
                    <h1 className="text-[11px] font-extrabold">Contact Now</h1>
                    <p className="text-[10px] font-regular">+92 123456789</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex mx-auto w-2/12 z-1">
          <div className="col-span-2 p-0 -mt-16">
            <Image src="/logo.webp" alt="" width={120} height={120} />
          </div>
        </div>
      </div>
    </div>
  );
}
