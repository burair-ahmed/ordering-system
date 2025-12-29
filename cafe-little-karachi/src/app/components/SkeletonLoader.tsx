const SkeletonLoader = () => {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {/* Image placeholder */}
      <div className="skeleton h-48 w-full rounded-xl shadow-md"></div>

      {/* Text lines */}
      <div className="skeleton h-6 w-3/4 rounded-md shadow"></div>
      <div className="skeleton h-4 w-1/2 rounded-md shadow"></div>
      <div className="skeleton h-6 w-1/3 rounded-md shadow"></div>
    </div>
  );
};

export default SkeletonLoader;
