import { CustechLogoLoader } from '@/components/ui/custech-loader';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white">
      <CustechLogoLoader
        mode="splash"
        size="lg"
        theme="light"
        message="Loading CUSTECH Marketplace..."
      />
    </div>
  );
}
