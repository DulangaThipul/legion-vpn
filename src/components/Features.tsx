import ScrollReveal from "./ScrollReveal";

export default function Features() {
  const features = [
    {
      title: "Ultra Fast Speed",
      description: "Optimized servers with 10Gbps connections for seamless streaming, gaming, and browsing without buffering or lag."
    },
    {
      title: "Secure-Grade Encryption",
      description: "AES-256 encryption protects your data from hackers, ISPs, and government surveillance."
    },
    {
      title: "Global Server Network",
      description: "Access content from 5+ locations worldwide with unlimited bandwidth and no speed restrictions."
    },
    {
      title: "Strict No-Logs Policy",
      description: "We never track, collect, or store your online activity. Your privacy is our priority."
    },
    {
      title: "Unlimited Bandwidth",
      description: "No data caps or throttling. Enjoy unlimited browsing, streaming, and downloading."
    },
    {
      title: "24/7 Customer Support",
      description: "Our expert team is always available to assist you via live chat or email."
    }
  ];

  return (
    <section id="features" style={{ padding: "6rem 0" }}>
      <div className="container">
        <h2 className="text-center text-gradient" style={{ fontSize: "3rem", marginBottom: "3rem" }}>
          Premium Features
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem"
        }}>
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <div className="glass-panel text-center" style={{ height: "100%" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{feature.title}</h3>
                <p style={{ color: "var(--muted-text)", lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
