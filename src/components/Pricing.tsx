"use client";

import ScrollReveal from "./ScrollReveal";
import { useState } from "react";
import GoogleSignIn from "./GoogleSignIn";

export default function Pricing() {
  const [activePlan, setActivePlan] = useState<number | null>(null);
  const plans = [
    {
      price: "RS 400",
      period: "Monthly",
      features: [
        "Singapore Server Locations",
        "100GB DATA",
        "Unlimited IP/S",
        "No-Logs Policy",
        "Easy Setup"
      ],
      popular: false
    },
    {
      price: "RS 800",
      period: "Monthly",
      features: [
        "Singapore Server Locations",
        "Unlimited DATA",
        "3-5 IP/S",
        "No-Logs Policy",
        "Easy Setup"
      ],
      popular: true
    },
    {
      price: "RS 600",
      period: "Monthly",
      features: [
        "Singapore Server Locations",
        "200GB DATA",
        "Unlimited IP/S",
        "No-Logs Policy",
        "Easy Setup"
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" style={{ padding: "6rem 0", background: "linear-gradient(to bottom, var(--bg-color), #0a0a0a)" }}>
      <div className="container">
        <h2 className="text-center text-gradient" style={{ fontSize: "3rem", marginBottom: "3rem" }}>
          Choose Your Plan
        </h2>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "2rem",
          alignItems: "center"
        }}>
          {plans.map((plan, index) => (
            <ScrollReveal key={index} delay={index * 200} className="glass-panel" style={{
              flex: "1 1 300px",
              maxWidth: "350px",
              padding: plan.popular ? "3rem 2rem" : "2rem",
              border: plan.popular ? "2px solid var(--text-color)" : "1px solid var(--card-border)",
              position: "relative"
            }}>
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--text-color)",
                  color: "var(--bg-color)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  zIndex: 1
                }}>
                  Most Popular
                </div>
              )}
              <div className="text-center" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "2.5rem", margin: 0 }}>{plan.price}</h3>
                <p style={{ color: "var(--muted-text)", marginTop: "0.5rem" }}>{plan.period}</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0" }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ 
                    padding: "0.75rem 0", 
                    borderBottom: i !== plan.features.length - 1 ? "1px solid var(--card-border)" : "none",
                    color: "var(--muted-text)"
                  }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <div className="text-center" style={{ minHeight: "45px", display: "flex", justifyContent: "center" }}>
                {activePlan === index ? (
                  <div className="animate-fade-in" style={{ width: "100%" }}>
                    <GoogleSignIn />
                  </div>
                ) : (
                  <button 
                    className={`btn ${plan.popular ? "btn-primary" : "btn-outline"}`} 
                    style={{ width: "100%" }}
                    onClick={() => setActivePlan(index)}
                  >
                    Get Started
                  </button>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
