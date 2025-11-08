import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-secondary mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
              <p>
                CourtPro Augusta ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p>We may collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information:</strong> Name, email address, phone number, city, and state when you submit forms or request quotes.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent, and clicks.</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies and Google Analytics 4 to track website usage and improve user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Respond to your inquiries and provide quotes for our services</li>
                <li>Improve our website and user experience</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Analyze website traffic and user behavior</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Analytics</h2>
              <p>
                We use Google Analytics 4 to collect and analyze information about website usage. 
                You can control cookie preferences through our cookie consent banner. By accepting cookies, 
                you consent to our use of analytics tools to track your website interactions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Sharing and Disclosure</h2>
              <p>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers who assist in our operations (e.g., CRM systems, email services)</li>
                <li>Analytics providers (e.g., Google Analytics)</li>
                <li>Law enforcement or regulatory authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw cookie consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
              <p>
                We implement reasonable security measures to protect your information from unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet 
                is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect 
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new policy on this page with an updated effective date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>Email: <a href="mailto:estimates@courtproaugusta.com" className="text-primary hover:underline">estimates@courtproaugusta.com</a></li>
                <li>Phone: <a href="tel:+17063091993" className="text-primary hover:underline">(706) 309-1993</a></li>
              </ul>
            </section>

            <p className="text-sm mt-8 pt-8 border-t border-border">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;