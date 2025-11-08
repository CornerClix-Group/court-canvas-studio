import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-secondary mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Agreement to Terms</h2>
              <p>
                By accessing or using the CourtPro Augusta website and services, you agree to be bound by these 
                Terms of Service. If you disagree with any part of these terms, you may not access our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Services</h2>
              <p>
                CourtPro Augusta provides court construction, resurfacing, and maintenance services for pickleball, 
                tennis, and basketball courts. All services are subject to availability, pricing, and specific 
                agreements established through our quote process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Use of Website</h2>
              <p>You agree to use our website only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Infringe on the rights of others or restrict their use of the website</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Introduce viruses, malware, or other harmful code</li>
                <li>Scrape or systematically download content without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Quotes and Estimates</h2>
              <p>
                All quotes and estimates provided are subject to site inspection and final verification. 
                Prices may vary based on site conditions, material availability, and project scope. 
                Quotes are valid for 30 days unless otherwise specified.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
              <p>
                All content on this website, including text, images, logos, designs, and court visualization tools, 
                is the property of CourtPro Augusta or its licensors and is protected by copyright and trademark laws. 
                You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Court Viewer Tool</h2>
              <p>
                Our interactive court viewer tool is provided for informational and planning purposes only. 
                The SVG files and designs generated are not final construction plans and should not be used 
                as such without professional consultation and approval.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites (e.g., social media, suppliers). 
                We are not responsible for the content, privacy practices, or terms of service of these external sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Warranties and Disclaimers</h2>
              <p>
                Our services are provided "as is" without warranties of any kind, either express or implied. 
                We make every effort to ensure quality work, but we do not guarantee that our services will 
                be error-free, uninterrupted, or meet all your requirements.
              </p>
              <p className="mt-4">
                Specific warranties on materials and workmanship are provided in writing for each project 
                and vary based on the scope of work.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, CourtPro Augusta shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                whether incurred directly or indirectly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless CourtPro Augusta, its officers, employees, and agents 
                from any claims, damages, losses, liabilities, and expenses arising from your use of our services 
                or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
              <p>
                These Terms of Service are governed by the laws of the State of Georgia, United States, 
                without regard to its conflict of law provisions. Any disputes shall be resolved in the 
                courts of Richmond County, Georgia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately 
                upon posting to the website. Your continued use of our services after changes constitutes 
                acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Severability</h2>
              <p>
                If any provision of these terms is found to be unenforceable or invalid, that provision 
                shall be limited or eliminated to the minimum extent necessary so that the remaining terms 
                remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us:
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

export default Terms;