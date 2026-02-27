import React from 'react';

export const FAQs = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-serif mb-12 text-center">Frequently Asked Questions</h1>
      <div className="space-y-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary/5">
          <h3 className="text-xl font-bold mb-4 text-primary">How long does shipping take?</h3>
          <p className="text-primary/70 leading-relaxed">Orders are typically processed within 2-3 business days. Shipping times vary by location but usually range from 5-10 business days for domestic orders and 10-20 for international ones.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary/5">
          <h3 className="text-xl font-bold mb-4 text-primary">What is your return policy?</h3>
          <p className="text-primary/70 leading-relaxed">Since our products are print-on-demand (created specifically for you), we only accept returns for damaged items or printing errors within 30 days of delivery. Please contact us with photos of the issue.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary/5">
          <h3 className="text-xl font-bold mb-4 text-primary">Are your shirts eco-friendly?</h3>
          <p className="text-primary/70 leading-relaxed">We prioritize high-quality fabrics and work with partners who share our commitment to sustainable production practices. Many of our items are made from organic cotton or recycled materials.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary/5">
          <h3 className="text-xl font-bold mb-4 text-primary">How should I care for my shirt?</h3>
          <p className="text-primary/70 leading-relaxed">To preserve the print and fabric, we recommend washing inside out in cold water and hanging to dry. Avoid ironing directly on the printed design.</p>
        </div>
      </div>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-serif mb-12 text-center">Privacy Policy</h1>
      <div className="space-y-8 text-primary/70 leading-relaxed bg-white p-10 rounded-3xl shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">1. Information Collection</h2>
          <p>At Anfastyle, we respect your privacy. We collect information you provide when placing an order, subscribing to our newsletter, or contacting us. This includes your name, email, shipping address, and payment details (processed securely via our partners).</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">2. Use of Information</h2>
          <p>Your data is used solely to process orders, improve your experience, and send occasional updates if you've opted in. We do not sell or rent your information to third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal data. However, no method of transmission over the internet is 100% secure.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">4. Cookies</h2>
          <p>We use cookies to enhance site navigation, analyze site usage, and assist in our marketing efforts. You can manage your cookie preferences in your browser settings.</p>
        </section>
      </div>
    </div>
  </div>
);

export const TermsOfService = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-serif mb-12 text-center">Terms of Service</h1>
      <div className="space-y-8 text-primary/70 leading-relaxed bg-white p-10 rounded-3xl shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
          <p>By using our website, you agree to comply with these terms. All content on this site is the property of Anfastyle and MEDAIT REGISTERED LLC.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">2. Product Descriptions</h2>
          <p>We strive for accuracy in our product descriptions and images. However, colors may vary slightly due to monitor settings and the nature of print-on-demand technology.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">3. Pricing and Payment</h2>
          <p>Prices and availability are subject to change without notice. We reserve the right to refuse service or cancel orders at our discretion.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">4. Intellectual Property</h2>
          <p>All designs, text, and graphics are protected by copyright laws. Unauthorized use of our intellectual property is strictly prohibited.</p>
        </section>
      </div>
    </div>
  </div>
);

export const Disclaimer = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl font-serif mb-12 text-center">Disclaimer</h1>
      <div className="space-y-8 text-primary/70 leading-relaxed bg-white p-10 rounded-3xl shadow-sm">
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">General Information</h2>
          <p>The information provided on this website is for general informational purposes only. While we strive for accuracy, we make no warranties about the completeness or reliability of the information.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">Print-on-Demand Nature</h2>
          <p>Anfastyle is a print-on-demand service. Product colors and placement may vary slightly from what you see on your screen. We are not responsible for minor variations that occur during the printing process.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary mb-4">External Links</h2>
          <p>Our site may contain links to external websites. We are not responsible for the content or privacy practices of these third-party sites.</p>
        </section>
      </div>
    </div>
  </div>
);
