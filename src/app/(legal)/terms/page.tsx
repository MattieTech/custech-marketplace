export const metadata = {
  title: "Terms and Conditions | CUSTECH Marketplace",
  description: "Terms and Conditions for using CUSTECH Marketplace.",
}

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground">Last Updated: October 2024</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Note:</strong> These terms should be reviewed by a qualified legal professional before deployment.
      </div>

      <section className="space-y-4">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using CUSTECH Marketplace ("the Platform"), you agree to be bound by these Terms and Conditions. The Platform is designed exclusively for the Confluence University of Science and Technology (CUSTECH) community.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Eligibility and Verification</h2>
        <p>
          To use the Platform, you must be a current student or staff member of CUSTECH. Verification requires a valid student/staff ID or institutional email address. You agree to provide accurate, current, and complete information during the registration process.
        </p>
      </section>

      <section className="space-y-4">
        <h2>3. Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2>4. Marketplace Rules</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All listed items must be accurately described and priced.</li>
          <li>Prohibited items include illegal substances, weapons, stolen goods, and academic work (e.g., essays for sale).</li>
          <li>Users must communicate respectfully through the Platform's messaging system.</li>
          <li>Sellers must fulfill orders as agreed upon with buyers.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>5. Payments and Fees</h2>
        <p>
          The Platform facilitates payments through authorized third-party gateways (e.g., Paystack). By using these services, you agree to their respective terms. A non-refundable verification fee may apply.
        </p>
      </section>

      <section className="space-y-4">
        <h2 id="referrals">6. Referral Program</h2>
        <p>
          Users may earn rewards by referring new members to the Platform using their unique referral code. Rewards are credited only when the referred user successfully completes the verification process. The Platform reserves the right to modify or terminate the referral program at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2>7. Disputes</h2>
        <p>
          In the event of a dispute between buyers and sellers, users should first attempt to resolve the issue directly. If unresolved, either party may open a dispute through the Dispute Center. Platform administrators will review the evidence and make a final, binding decision.
        </p>
      </section>

      <section className="space-y-4">
        <h2>8. Limitation of Liability</h2>
        <p>
          CUSTECH Marketplace acts solely as a venue for buyers and sellers. We do not guarantee the quality, safety, or legality of items advertised. We are not liable for any damages arising from transactions conducted on or off the Platform.
        </p>
      </section>
    </div>
  )
}
