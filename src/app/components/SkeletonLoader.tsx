const SkeletonLoader = () => {
    return (
      <div className="animate-pulse space-y-4 w-full">
        <div className="bg-gray-200 h-48 rounded-lg"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  };
  
  export default SkeletonLoader;
  