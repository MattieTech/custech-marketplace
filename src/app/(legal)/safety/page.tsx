export const metadata = {
  title: "Safety & Anti-Scam Policy | CUSTECH Marketplace",
}

export default function SafetyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Safety & Anti-Scam Policy</h1>
        <p className="text-muted-foreground">Last Updated: October 2024</p>
      </div>

      <section className="space-y-4">
        <h2>Our Commitment to Safety</h2>
        <p>
          CUSTECH Marketplace is built exclusively for our campus community. We implement strict verification processes and monitoring systems to ensure a safe trading environment for all students and staff.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Platform Safety Measures</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Mandatory Verification:</strong> All users must verify their CUSTECH identity before trading.</li>
          <li><strong>Trust Scores:</strong> User profiles display trust badges and scores based on transaction history and reviews.</li>
          <li><strong>Secure Messaging:</strong> Keep all communication within the platform to maintain a record of agreements.</li>
          <li><strong>AI Moderation:</strong> Listings and messages are scanned for suspicious patterns or prohibited items.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>How to Identify Potential Scams</h2>
        <p>Watch out for these red flags:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Sellers asking to move communication off the platform (e.g., to WhatsApp).</li>
          <li>Requests for payment before the item is delivered or inspected.</li>
          <li>Prices that are suspiciously low ("too good to be true").</li>
          <li>Refusal to meet in public campus areas for item exchange.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Safe Meeting Practices</h2>
        <p>When meeting for a transaction:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Meet during daylight hours in well-lit, public areas on campus (e.g., library, cafeteria).</li>
          <li>Consider bringing a friend along.</li>
          <li>Inspect the item thoroughly before finalizing the transaction.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Reporting Process</h2>
        <p>
          If you suspect a scam or encounter unsafe behavior, report the user or listing immediately using the "Report" button on their profile or listing page. Our moderation team reviews all reports within 24 hours.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Enforcement Actions</h2>
        <p>
          Violations of our safety policies may result in warnings, temporary suspensions, or permanent bans from the platform. Serious offenses may be reported to university authorities or law enforcement.
        </p>
      </section>
    </div>
  )
}
