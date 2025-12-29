const Preloader = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
        <div className="flex flex-col items-center">
          <div className="loader rounded-full border-4 border-t-[#741052] border-gray-200 h-16 w-16 mb-4 animate-spin"></div>
          <p className="text-[#741052] font-semibold">Loading...</p>
        </div>
      </div>
    );
  };
  
  export default Preloader;
  
  // Add this CSS for the loader
  <style jsx global>{`
    .loader {
      border-radius: 50%;
      border-top-color: #741052;
      border-right-color: #eee;
      border-bottom-color: #eee;
      border-left-color: #eee;
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `}</style>
  