import { motion } from 'framer-motion';

// Skeleton loader component
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-700/50">
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  );
}

// Dashboard stats skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// List skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full page loading spinner
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-1 left-1 w-14 h-14 border-4 border-pink-500/30 border-t-pink-500 rounded-full"
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gray-400 text-sm"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export function LoadingButton({ loading, children, disabled, className = '', ...props }: LoadingButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={`relative inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all
        ${disabled || loading 
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
          : 'bg-purple-600 hover:bg-purple-500 text-white'
        } ${className}`}
      {...props}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
        />
      )}
      {children}
    </button>
  );
}

// Input with loading state
export function LoadingInput({ loading, className = '' }: { loading?: boolean; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <input
        disabled={loading}
        className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
          placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors
          ${loading ? 'opacity-50' : ''}`}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="block w-4 h-4 border-2 border-gray-500/30 border-t-gray-500 rounded-full"
          />
        </span>
      )}
    </div>
  );
}

export default {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  PageLoader,
  LoadingButton,
  LoadingInput,
};

