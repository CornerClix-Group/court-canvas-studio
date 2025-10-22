import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import BuildProcess from "@/components/BuildProcess";
import CourtViewer from "@/components/CourtViewer";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <RecentProjects />
        <BuildProcess />
        <CourtViewer />
        <Services />
        <Testimonials />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
