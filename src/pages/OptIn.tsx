import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const OptIn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <section className="max-w-3xl mx-auto px-4 space-y-8">
          <header className="space-y-4 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-secondary">
              Text Updates & Support
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              To start a text conversation with CourtPro Augusta, use the chat widget on this site.
              For legal details, review our SMS terms before opting in.
            </p>
          </header>

          <section className="rounded-lg border border-border bg-card p-6 md:p-8 space-y-5 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">How to opt in</h2>
              <p className="text-muted-foreground leading-relaxed">
                Open the chat bubble in the lower corner, enter your contact details there, and follow
                the prompts to consent to text messaging.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" size="lg" onClick={() => (window.location.href = "/sms-terms")}>
                View SMS Terms
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OptIn;
