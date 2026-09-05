export const metadata = {
  title: "Refund Policy | CUSTECH Marketplace",
}

export default function RefundPolicyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Payment & Refund Policy</h1>
        <p className="text-muted-foreground">Last Updated: October 2024</p>
      </div>

      <section className="space-y-4">
        <h2>1. Platform Payments</h2>
        <p>
          CUSTECH Marketplace provides secure payment integration via Paystack. While we facilitate these payments, the actual transaction occurs between the buyer and seller.
        </p>
      </section>

      <section className="space-y-4">
        <h2>2. Verification Fees</h2>
        <p>
          To maintain a secure community, a nominal one-time verification fee may be required during registration. <strong>This verification fee is non-refundable</strong> under any circumstances, including account suspension for violating our Community Guidelines.
        </p>
      </section>

      <section className="space-y-4">
        <h2>3. Escrow Services</h2>
        <p>
          For transactions processed through our secure payment system, funds are held in escrow until the buyer confirms receipt of the item or 24 hours have passed since the marked delivery, whichever comes first.
        </p>
      </section>

      <section className="space-y-4">
        <h2>4. Transaction Disputes and Refunds</h2>
        <p>Refunds for items purchased from other users are subject to the following:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Mutual Agreement:</strong> The buyer and seller can mutually agree to cancel a transaction and issue a refund before the item is delivered.</li>
          <li><strong>Item Not as Described:</strong> If an item significantly differs from its listing description, the buyer must open a dispute within 24 hours of receipt.</li>
          <li><strong>Non-Delivery:</strong> If a seller fails to deliver the item, the buyer may open a dispute to reclaim their funds.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>5. Dispute Resolution Process</h2>
        <p>
          When a dispute is opened, our administration team will review evidence provided by both parties (photos, messages, listing details). If the dispute is resolved in favor of the buyer, a refund will be issued. The decision of the CUSTECH Marketplace administration is final.
        </p>
      </section>

      <section className="space-y-4">
        <h2>6. Refund Timeline</h2>
        <p>
          Approved refunds are processed immediately on our end but may take 3-7 business days to reflect in your bank account, depending on your financial institution and our payment processor (Paystack).
        </p>
      </section>
    </div>
  )
}
