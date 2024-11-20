import Image from "next/image";
import Dashboard from "./Dashboard";
import Hero from "./components/Hero";

export default function Home() {
  return (
   <div>
    <Hero/>
    <Dashboard/>
   </div>
  );
}
