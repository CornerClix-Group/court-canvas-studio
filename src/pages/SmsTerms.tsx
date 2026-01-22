import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { COMPANY_INFO } from "@/lib/companyInfo";

const SmsTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-black text-secondary mb-8">
          SMS Terms & Conditions
        </h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <p className="text-muted-foreground">
            <strong>Effective Date:</strong> January 22, 2026
          </p>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">1. Program Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              {COMPANY_INFO.displayName} ("{COMPANY_INFO.dbaName}") offers a mobile messaging program that allows 
              customers to receive text messages related to their court construction projects, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-muted-foreground">
              <li>Project updates and scheduling notifications</li>
              <li>Estimate and invoice reminders</li>
              <li>Appointment confirmations</li>
              <li>Service-related communications</li>
              <li>Follow-up messages regarding your inquiry</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">2. Consent & Opt-In</h2>
            <p className="text-muted-foreground leading-relaxed">
              By providing your phone number and checking the SMS opt-in checkbox on our website forms, you expressly 
              consent to receive text messages from {COMPANY_INFO.dbaName}. This consent is not a condition of any 
              purchase. You are not required to opt in to SMS messaging to use our services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Your consent includes receiving autodialed and/or prerecorded text messages at the mobile telephone 
              number you provided. Standard message and data rates may apply. Your carrier's standard messaging rates apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">3. Message Frequency</h2>
            <p className="text-muted-foreground leading-relaxed">
              Message frequency varies based on your project status and communication preferences. Typically, you may 
              receive 1-10 messages per month during active project phases. Message frequency may be higher during 
              critical project milestones or when immediate communication is required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">4. Costs & Charges</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Message and data rates may apply.</strong> {COMPANY_INFO.dbaName} does not charge for SMS messages, 
              but your mobile carrier may charge you for each text message you send or receive. Contact your wireless 
              carrier for details on your texting plan. You are solely responsible for any charges from your carrier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">5. How to Opt Out (STOP)</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may opt out of receiving text messages at any time by texting <strong>STOP</strong> to any message 
              you receive from us. Upon receipt of your STOP request, we will send you a final confirmation message, 
              and you will no longer receive SMS messages from {COMPANY_INFO.dbaName} unless you re-subscribe.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Opting out of SMS messages will not affect your ability to receive email communications or other 
              non-SMS communications from us, nor will it affect any services you have contracted with us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">6. How to Get Help (HELP)</h2>
            <p className="text-muted-foreground leading-relaxed">
              For help or more information about our SMS program, text <strong>HELP</strong> to any message you 
              receive from us. You will receive a response with contact information and instructions. You may also 
              contact us directly:
            </p>
            <ul className="list-none mt-3 space-y-2 text-muted-foreground">
              <li><strong>Phone:</strong> <a href={`tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}`} className="text-primary hover:underline">{COMPANY_INFO.phone}</a></li>
              <li><strong>Email:</strong> <a href={`mailto:${COMPANY_INFO.email}`} className="text-primary hover:underline">{COMPANY_INFO.email}</a></li>
              <li><strong>Address:</strong> {COMPANY_INFO.address.full}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">7. Supported Carriers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our SMS program is designed to work with major U.S. carriers including, but not limited to: AT&T, 
              Verizon Wireless, Sprint, T-Mobile, U.S. Cellular, Boost Mobile, MetroPCS, Virgin Mobile, and 
              Cricket Wireless. Carrier coverage may vary. T-Mobile is not liable for delayed or undelivered messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">8. Carrier Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Carriers are not liable for delayed or undelivered messages. Message delivery is subject to effective 
              transmission from your wireless service provider/network operator and is outside of our control. 
              Neither {COMPANY_INFO.dbaName} nor your mobile carrier will be liable for any delays in the receipt 
              of any SMS messages, as delivery is subject to effective transmission from your network operator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">9. Privacy & Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We respect your privacy. Your phone number and opt-in consent information will be used solely for 
              the purposes of sending you text messages as described in this policy. We will not sell, rent, or 
              share your mobile phone number or SMS opt-in consent with third parties for marketing purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              For complete details on how we collect, use, and protect your information, please review our{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">10. No Warranty</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SMS MESSAGING SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
              OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">11. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these SMS Terms & Conditions at any time. Any changes will be effective 
              immediately upon posting on this page with an updated effective date. Your continued participation in 
              our SMS program after any modifications indicates your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-secondary mb-4">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these SMS Terms & Conditions, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="font-semibold text-foreground">{COMPANY_INFO.legalName}</p>
              <p className="text-muted-foreground">dba {COMPANY_INFO.dbaName}</p>
              <p className="text-muted-foreground mt-2">{COMPANY_INFO.address.street}</p>
              <p className="text-muted-foreground">{COMPANY_INFO.address.suite}</p>
              <p className="text-muted-foreground">{COMPANY_INFO.address.city}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.zip}</p>
              <p className="text-muted-foreground mt-2">
                Phone: <a href={`tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}`} className="text-primary hover:underline">{COMPANY_INFO.phone}</a>
              </p>
              <p className="text-muted-foreground">
                Email: <a href={`mailto:${COMPANY_INFO.email}`} className="text-primary hover:underline">{COMPANY_INFO.email}</a>
              </p>
            </div>
          </section>

          <section className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              By opting in to receive SMS messages from {COMPANY_INFO.dbaName}, you acknowledge that you have read, 
              understand, and agree to be bound by these SMS Terms & Conditions.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SmsTerms;
