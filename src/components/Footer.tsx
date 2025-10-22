const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">
              © {currentYear} CourtPro Augusta • 200+ courts built & maintained
            </p>
            <p>All rights reserved.</p>
          </div>
          <div className="text-xs">
            This site features Laykold color options. CourtPro Augusta is not affiliated with Laykold.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
