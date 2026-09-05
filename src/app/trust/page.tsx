import { ShieldCheck, AlertTriangle, CreditCard, Star, Flag, House, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TrustCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Section */}
      <div className="bg-green-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Shield className="h-16 w-16 mx-auto opacity-90" />
          <h1 className="text-4xl md:text-5xl font-bold">Trust Center</h1>
          <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto">
            Learn how CUSTECH Marketplace keeps our community safe, secure, and transparent.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
        <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">How Verification Works</h2>
          </div>
          <div className="space-y-4 text-gray-600">
            <p>Our platform uses a 3-tier trust system to help you make informed decisions:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Registered:</strong> Basic account creation. Email verified.</li>
              <li><strong>CUSTECH Verified:</strong> User has provided a valid student ID or government ID which we have reviewed.</li>
              <li><strong>Trusted Seller:</strong> Earned through consistent positive reviews and successful transactions.</li>
            </ul>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mt-4 text-sm font-medium">
              Note: Verification confirms identity. It does not guarantee future behavior. Always exercise caution.
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">How to Avoid Scams</h2>
            </div>
            <ul className="space-y-3 text-gray-600 text-sm">
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold">•</span> Meet in safe, public locations on campus.</li>
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold">•</span> Never share financial details or passwords.</li>
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold">•</span> Use in-app messaging to keep a record.</li>
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold">•</span> Verify items before confirming payments.</li>
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold">•</span> Trust your instincts—if it feels off, walk away.</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Protected Payments</h2>
            </div>
            <div className="space-y-4 text-gray-600 text-sm">
              <p>When you pay through CUSTECH Marketplace, your funds are held securely until you receive the item.</p>
              <p className="font-medium text-gray-900">Never pay outside the platform.</p>
              <p>If something goes wrong, our support team can help mediate and process refunds when appropriate.</p>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Reputation System</h2>
            </div>
            <div className="space-y-3 text-gray-600 text-sm">
              <p>Users rate each other after transactions. These ratings form the foundation of our Trusted Seller program.</p>
              <p>Reputation cannot be purchased. It must be earned through reliable, honest behavior.</p>
            </div>
          </section>

          <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Reporting & Disputes</h2>
            </div>
            <div className="space-y-3 text-gray-600 text-sm">
              <p>You can report suspicious items or users at any time. Our moderation team reviews all reports.</p>
              <p>If a dispute arises, we follow a strict resolution process analyzing chat logs and transaction data.</p>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-teal-100 rounded-lg">
              <House className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Housing Safety</h2>
          </div>
          <div className="space-y-3 text-gray-600">
            <p>Renting off-campus requires extra diligence:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Always verify landlords and agents in person.</li>
              <li>Visit properties physically before making any commitments.</li>
              <li>Never pay rent without proper signed documentation.</li>
              <li>Report suspicious property listings immediately.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Privacy & Security</h2>
          </div>
          <div className="space-y-3 text-gray-600">
            <p>Your data is encrypted and protected. We only collect information necessary to run the marketplace safely.</p>
            <p>We do not sell your personal data to third parties. You have the right to request deletion of your account at any time.</p>
            <p>Always use strong passwords and do not share your login credentials.</p>
          </div>
        </section>

        <div className="text-center mt-12">
          <h3 className="text-xl font-medium mb-4 text-gray-900">Need to report something?</h3>
          <Button size="lg" variant="destructive">
            Report an Issue
          </Button>
        </div>
      </div>
    </div>
  );
}
