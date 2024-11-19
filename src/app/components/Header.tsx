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
            backgroundSize: "400px 80px", // Ensures tiles are 100px wide and fit the height
            backgroundPosition: "0 0", // Aligns the background at the top-left corner
          }}
        ></div>
        <div className="">
            <div>
                <div className="contact"></div>
                <div className="location"></div>
            </div>
          <div className="flex mx-auto justify-center w-2/12">
            <Image src="/logo.webp" alt="" width={120} height={120} />
          </div>
          <div>
            <div className="cart"></div>
            <div className="offcanvas"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
