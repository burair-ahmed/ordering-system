import Image from 'next/image';

interface HeroProps {
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  title?: string;
  subtitle?: string;
  displayMode?: 'overlay' | 'direct';
  bannerSize?: 'small' | 'medium' | 'large' | 'freesize';
  showText?: boolean;
  overlayOpacity?: number;
  textColor?: string;
  align?: string;
}

export default function Hero({
  backgroundImage,
  mobileBackgroundImage,
  title,
  subtitle = "Authentic Pakistani & Karachi Cuisines",
  displayMode = "overlay",
  bannerSize = "large",
  showText = true,
  overlayOpacity = 0.4,
  textColor = "white",
  align = "center"
}: HeroProps) {
  const bg = backgroundImage || "/bg-hero.webp";
  const mobileBg = mobileBackgroundImage || bg;
  const displayTitle = title || "Little Karachi Express";

  const getAlignClass = () => {
    if (align === 'left') return 'text-left justify-start items-start';
    if (align === 'right') return 'text-right justify-end items-end';
    return 'text-center justify-center items-center';
  };

  const getTextColorClass = () => {
    if (textColor === 'black') return 'text-neutral-900';
    if (textColor === 'fuchsia') return 'text-[#741052]';
    return 'text-white';
  };

  const getContainerHeightClass = () => {
    if (bannerSize === 'freesize') return '';
    switch (bannerSize) {
      case 'small':
        return 'min-h-[30vh] sm:min-h-[40vh]';
      case 'medium':
        return 'min-h-[50vh] sm:min-h-[60vh]';
      case 'large':
      default:
        return 'min-h-[70vh] sm:min-h-[85vh]';
    }
  };

  // Direct Image Layout (No overlays/text)
  if (displayMode === 'direct') {
    if (bannerSize === 'freesize') {
      return (
        <div className="w-full relative select-none">
          {/* Desktop */}
          <div className="w-full hidden md:block relative">
            <Image
              src={bg}
              alt={displayTitle}
              width={0}
              height={0}
              sizes="100vw"
              priority
              className="w-full h-auto"
            />
          </div>
          {/* Mobile */}
          <div className="w-full md:hidden relative">
            <Image
              src={mobileBg}
              alt={displayTitle}
              width={0}
              height={0}
              sizes="100vw"
              priority
              className="w-full h-auto"
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`relative flex items-center justify-center overflow-hidden w-full select-none ${getContainerHeightClass()}`}>
        {/* Background Image - PC */}
        <Image
          src={bg}
          alt={displayTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover hidden md:block"
        />
        {/* Background Image - Mobile */}
        <Image
          src={mobileBg}
          alt={displayTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover md:hidden"
        />
      </div>
    );
  }

  // Overlay Mode Layout
  const textContent = showText !== false && (
    <div className={`relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col ${getAlignClass()} ${getTextColorClass()}`}>
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight drop-shadow-lg mb-4 font-poppins text-center">
        {displayTitle}
      </h1>
      
      {subtitle && (
        <p className="text-lg sm:text-2xl md:text-3xl font-light opacity-90 drop-shadow-md max-w-3xl leading-relaxed text-center">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (bannerSize === 'freesize') {
    return (
      <div className="relative w-full overflow-hidden select-none">
        {/* Desktop Background */}
        <Image
          src={bg}
          alt="Desktop Background"
          width={0}
          height={0}
          sizes="100vw"
          priority
          className="w-full h-auto hidden md:block z-0"
        />
        {/* Mobile Background */}
        <Image
          src={mobileBg}
          alt="Mobile Background"
          width={0}
          height={0}
          sizes="100vw"
          priority
          className="w-full h-auto md:hidden z-0"
        />

        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black z-[5]" 
          style={{ opacity: overlayOpacity }}
        />

        {/* Text Container */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {textContent}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden w-full select-none ${getContainerHeightClass()}`}>
      {/* Background Image - PC */}
      <Image
        src={bg}
        alt={displayTitle}
        fill
        priority
        sizes="100vw"
        className="object-cover hidden md:block"
      />
      {/* Background Image - Mobile */}
      <Image
        src={mobileBg}
        alt={displayTitle}
        fill
        priority
        sizes="100vw"
        className="object-cover md:hidden"
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black z-[5]" 
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      {textContent}
    </div>
  );
}