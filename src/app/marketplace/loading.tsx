import { CustechLogoLoader } from '@/components/ui/custech-loader';

export default function MarketplaceLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <CustechLogoLoader
        mode="splash"
        size="lg"
        theme="light"
        message="Loading CUSTECH Marketplace..."
      />
    </div>
  );
}
