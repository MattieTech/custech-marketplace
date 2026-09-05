export const metadata = {
  title: "Privacy Policy | CUSTECH Marketplace",
  description: "Privacy Policy for CUSTECH Marketplace.",
}

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last Updated: October 2024</p>
      </div>

      <section className="space-y-4">
        <h2>1. Introduction</h2>
        <p>
          Welcome to CUSTECH Marketplace. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Data We Collect</h2>
        <p>We may collect, use, store, and transfer different kinds of personal data about you, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Identity Data:</strong> First name, last name, username, student ID, profile picture.</li>
          <li><strong>Contact Data:</strong> Institutional email address, phone number.</li>
          <li><strong>Financial Data:</strong> Bank account details (processed securely via Paystack).</li>
          <li><strong>Transaction Data:</strong> Details about payments and items you have purchased or sold.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>3. How We Use Your Data</h2>
        <p>We use your data for the following purposes:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>To verify your identity as a CUSTECH student or staff member.</li>
          <li>To facilitate transactions and messaging between users.</li>
          <li>To manage our relationship with you, including customer support and disputes.</li>
          <li>To improve our platform, services, and AI-powered features.</li>
          <li>To maintain platform safety and prevent fraud.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>4. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share your data with trusted third-party service providers, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Supabase:</strong> For secure database and authentication services.</li>
          <li><strong>Paystack:</strong> For secure payment processing.</li>
          <li><strong>Google AI:</strong> For content moderation and platform enhancements (data is anonymized where possible).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>5. Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We comply with Nigerian data protection regulations.
        </p>
      </section>

      <section className="space-y-4">
        <h2>6. Your Rights</h2>
        <p>
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing.
        </p>
      </section>

      <section className="space-y-4">
        <h2>7. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact our support team at privacy@marketplace.custech.edu.ng.
        </p>
      </section>
    </div>
  )
}
