import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const OptIn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-secondary mb-4">
              Get Updates from CourtPro Augusta
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Request a quote and optionally opt in to receive text message updates about your 
              court construction project, including scheduling, estimates, and appointment reminders.
            </p>
          </div>
        </div>
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default OptIn;
