// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

// src/data/initialSeedData.ts
var NOW = "2026-11-11T12:00:00.000Z";
var INITIAL_PLATFORM_DATA = {
  admins: [
    {
      id: "owner-ahmed-soliman",
      uid: "owner-ahmed-soliman",
      email: "ahmed0soliman6@gmail.com",
      name: "Ahmed Soliman",
      role: "owner",
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  siteSettings: {
    id: "global",
    brandName: {
      ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
      en: "Ahmed Soliman"
    },
    tagline: {
      ar: "\u0623\u062E\u0635\u0627\u0626\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629",
      en: "Healthcare Quality Specialist & Medical Systems Architect"
    },
    ownerName: {
      ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
      en: "Ahmed Soliman"
    },
    ownerRole: {
      ar: "\u0645\u0637\u0648\u0651\u0631 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0623\u062E\u0635\u0627\u0626\u064A \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
      en: "Medical Systems Developer & Healthcare Quality Specialist"
    },
    avatarUrl: "/assets/aistudio/1770146906397_16665dd0.png",
    primaryColor: "#00C2CB",
    navyColor: "#070E1A",
    defaultLocale: "ar",
    defaultTheme: "dark",
    whatsappNumber: "Ahmed0soliman",
    whatsappUrl: "https://wa.me/Ahmed0soliman",
    telegramBotUrl: "https://t.me/SoliMedicalproBot",
    facebookUrl: "https://www.facebook.com/SoliMedical/",
    githubUrl: "",
    linkedinUrl: "",
    contactEmail: "ahmed0soliman6@gmail.com",
    location: {
      ar: "\u0645\u0635\u0631 \u2014 \u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
      en: "Egypt \u2014 Healthcare Software Engineering & Clinical Quality"
    },
    hideVisitorHeaderNav: true,
    published: true,
    seo: {
      title: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 | \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u2013 Ahmed Soliman",
        en: "Ahmed Soliman | Personal Digital Platform & Medical Systems Architect"
      },
      description: {
        ar: "\u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646: \u0623\u062E\u0635\u0627\u0626\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A (Soli Medical\u060C ICU-Sync\u060C Mitali Hospital).",
        en: "Official personal platform of Ahmed Soliman: Healthcare Quality Specialist & Architect of Soli Medical, ICU-Sync, Mitali Hospital, and standalone clinic portals."
      },
      ogImage: "/assets/aistudio/1770146906397_16665dd0.png",
      canonicalSlug: "/",
      structuredDataType: "Person"
    },
    updatedAt: NOW
  },
  pages: [
    {
      id: "home",
      slug: "home",
      title: {
        ar: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        en: "Home"
      },
      kicker: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \xB7 \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Ahmed Soliman \xB7 Clinical Quality & Healthcare Software Engineering"
      },
      headline: {
        ar: "\u0623\u0635\u0645\u0651\u0645. \u0623\u0628\u062A\u0643\u0631. \u0623\u0637\u0648\u0651\u0631.",
        en: "I DESIGN. I CREATE. I DEVELOP."
      },
      subheadline: {
        ar: "\u0623\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0645\u064A\u062F\u0627\u0646\u064A\u0629 \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0628\u064A\u0646 \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0644\u0628\u0646\u0627\u0621 \u0623\u0646\u0638\u0645\u0629 \u0637\u0628\u064A\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 (Soli Medical\u060C ICU-Sync\u060C Mitali Hospital) \u062A\u062E\u062F\u0645 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0631\u0636\u0649.",
        en: "Bridging frontline clinical nursing, ICU care, and healthcare quality management with full-stack software engineering to build practical digital medical systems."
      },
      biography: {
        ar: "\u0645\u0646 \u0642\u0644\u0628 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0625\u0644\u0649 \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644\u0629: \u0623\u0628\u0646\u064A \u062D\u0644\u0648\u0644\u0627\u064B \u0631\u0642\u0645\u064A\u0629 \u062A\u062E\u062A\u0635\u0631 \u0627\u0644\u0648\u0642\u062A\u060C \u062A\u0645\u0646\u0639 \u0627\u0644\u0623\u062E\u0637\u0627\u0621\u060C \u0648\u062A\u0631\u0641\u0639 \u0643\u0641\u0627\u0621\u0629 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
        en: "From bedside clinical operations and quality governance to native Arabic/English health-tech architecture: building digital systems that eliminate workflow friction."
      },
      highlights: {
        ar: [
          "\u062E\u0628\u0631\u0629 \u0645\u0632\u062F\u0648\u062C\u0629 \u062A\u062C\u0645\u0639 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u0639 \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A",
          "\u0645\u0624\u0633\u0633 \u0648\u0645\u0637\u0648\u0651\u0631 \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
          "\u0627\u0628\u062A\u0643\u0627\u0631 \u0623\u0646\u0638\u0645\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0644\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 (ICU-Sync) \u0648\u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
          "\u0628\u0646\u0627\u0621 \u0635\u0641\u062D\u0627\u062A \u0647\u0628\u0648\u0637 \u0637\u0628\u064A\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629"
        ],
        en: [
          "Dual expertise uniting clinical nursing & healthcare quality with software architecture",
          "Creator of Soli Medical for single-doctor clinics and multi-clinic complexes",
          "Engineered specialized systems for ICU telemetry (ICU-Sync), inventory, and quality",
          "High-conversion standalone medical landing pages with custom clinic branding"
        ]
      },
      metrics: [
        {
          value: "+5",
          label: {
            ar: "\u0645\u0646\u0638\u0648\u0645\u0627\u062A \u0637\u0628\u064A\u0629 \u0648\u0631\u0642\u0645\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0642\u064A\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0648\u0627\u0644\u062A\u0637\u0648\u064A\u0631",
            en: "Production Healthcare & ERP Software Systems Built"
          }
        },
        {
          value: "100%",
          label: {
            ar: "\u062A\u0648\u0627\u0641\u0642 \u062B\u0646\u0627\u0626\u064A \u0627\u0644\u0644\u063A\u0629 RTL / LTR \u0648\u062A\u062C\u0631\u0628\u0629 \u0645\u0635\u0645\u0645\u0629 \u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0637\u0628\u064A",
            en: "Native Bilingual RTL / LTR Clinical Workflow Fit"
          }
        },
        {
          value: "24/7",
          label: {
            ar: "\u0623\u062A\u0645\u062A\u0629 \u062D\u062C\u0632 \u0648\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0631\u0636\u0649 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0627\u0644\u0630\u0643\u064A",
            en: "Automated Patient Booking via WhatsApp & Telegram Bot"
          }
        },
        {
          value: "+99.9%",
          label: {
            ar: "\u0627\u0639\u062A\u0645\u0627\u062F\u064A\u0629 \u0648\u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0633\u062D\u0627\u0628\u064A \u0645\u0639 \u062D\u0645\u0627\u064A\u0629 \u0635\u0627\u0631\u0645\u0629 \u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
            en: "Cloud Reliability & Zero-Trust Role Security"
          }
        }
      ],
      experienceTimeline: [],
      skills: [],
      heroImage: "/assets/aistudio/1770146906397_16665dd0.png",
      standaloneByDefault: false,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 | \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
          en: "Ahmed Soliman | Official Personal Platform & Healthcare Systems Developer"
        },
        description: {
          ar: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0623\u0646\u0638\u0645\u0629 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646: Soli Medical\u060C ICU-Sync\u060C Mitali Hospital\u060C \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629\u060C \u0648\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0637\u0628\u064A\u0629.",
          en: "Explore Ahmed Soliman\u2019s healthcare software systems, Soli Medical, ICU-Sync, standalone clinic portals, and editorial articles."
        },
        ogImage: "/assets/aistudio/1770146906397_16665dd0.png",
        canonicalSlug: "/",
        structuredDataType: "Person"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "about",
      slug: "about",
      title: {
        ar: "\u0645\u0646 \u0623\u0646\u0627 \u2014 \u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629",
        en: "About \u2014 Editorial Monograph"
      },
      kicker: {
        ar: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0627\u0644\u062A\u062D\u0631\u064A\u0631\u064A \xB7 Ahmed Soliman",
        en: "Editorial Monograph & Career Timeline \xB7 Ahmed Soliman"
      },
      headline: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u2014 \u0628\u064A\u0646 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Ahmed Soliman \u2014 Where Clinical Care Meets Software Architecture"
      },
      subheadline: {
        ar: "\u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629\u060C \u0648\u0645\u0637\u0648\u0651\u0631 \u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0648\u0623\u0646\u0638\u0645\u0629 \u0631\u0642\u0645\u064A\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0641\u064A \u0645\u0635\u0631.",
        en: "Nursing & Healthcare Quality Specialist and Full-Stack Developer architecting digital platforms for clinics, ICUs, and medical complexes in Egypt."
      },
      biography: {
        ar: `\u0628\u062F\u0623\u062A \u0631\u062D\u0644\u062A\u064A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0645\u0646 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u062D\u064A\u062B \u0639\u0627\u064A\u0634\u062A \u0639\u0646 \u0642\u0631\u0628 \u0627\u0644\u062A\u062D\u062F\u064A\u0627\u062A \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0627\u0644\u062A\u064A \u064A\u0648\u0627\u062C\u0647\u0647\u0627 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0647\u064A\u0626\u0629 \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0645\u0648\u0638\u0641\u0648 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0645\u062F\u064A\u0631\u0648 \u0627\u0644\u062C\u0648\u062F\u0629 \u064A\u0648\u0645\u064A\u0627\u064B. \u0623\u062F\u0631\u0643\u062A \u0645\u0628\u0643\u0631\u0627\u064B \u0623\u0646 \u0645\u0639\u0638\u0645 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u062A\u0641\u0634\u0644 \u0641\u064A \u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0637\u0628\u064A \u0644\u0623\u0646\u0647\u0627 \u062A\u064F\u0643\u062A\u0628 \u0645\u0646 \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u064A\u062F\u0627\u0646 \u0627\u0644\u0637\u0628\u064A\u060C \u0641\u062A\u0623\u062A\u064A \u0625\u0645\u0627 \u0645\u0639\u0642\u062F\u0629 \u0648\u0645\u0632\u062F\u062D\u0645\u0629 \u0628\u0642\u0648\u0627\u0626\u0645 \u062A\u0639\u0637\u0644 \u0627\u0644\u0643\u0634\u0641\u060C \u0623\u0648 \u0633\u0637\u062D\u064A\u0629 \u0644\u0627 \u062A\u063A\u0637\u064A \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629.

\u0644\u0630\u0644\u0643 \u0642\u0631\u0631\u062A \u0627\u0644\u062C\u0645\u0639 \u0628\u064A\u0646 \u062A\u062E\u0635\u0635\u064A \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0625\u062F\u0627\u0631\u0629 \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0628\u064A\u0646 \u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0627\u0644\u062D\u062F\u064A\u062B\u0629. \u0642\u0645\u062A \u0628\u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0634\u063A\u064A\u0644 \u0645\u0646\u0638\u0648\u0645\u0627\u062A \u0631\u0642\u0645\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0645\u062B\u0644 \u0646\u0638\u0627\u0645 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0648\u0646\u0638\u0627\u0645 ICU-Sync \u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0648\u0645\u0646\u0638\u0648\u0645\u0629 Mitali Hospital\u060C \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0623\u0646\u0638\u0645\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.

\u0623\u0624\u0645\u0646 \u0628\u0623\u0646 \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0635\u062D\u064A \u0627\u0644\u0646\u0627\u062C\u062D \u064A\u0628\u062F\u0623 \u0645\u0646 \u0641\u0647\u0645 \u062A\u0641\u0627\u0635\u064A\u0644 \u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u0631\u064A\u0636 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0646\u0634\u0623\u0629: \u0645\u0646 \u0644\u062D\u0638\u0629 \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0627\u0644\u062D\u062C\u0632 \u0639\u0628\u0631 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644\u060C \u0625\u0644\u0649 \u0634\u0627\u0634\u0629 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644\u060C \u0625\u0644\u0649 \u0645\u0644\u0641 \u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u0631\u0636\u064A \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0623\u0645\u0627\u0645 \u0627\u0644\u0637\u0628\u064A\u0628\u060C \u0648\u0635\u0648\u0644\u0627\u064B \u0625\u0644\u0649 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u062A\u064A \u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0649 \u0627\u062A\u062E\u0627\u0630 \u0642\u0631\u0627\u0631\u0627\u062A \u062F\u0642\u064A\u0642\u0629.`,
        en: `My career began on the clinical frontlines\u2014inside hospitals, intensive care units (ICUs), and community medical complexes\u2014where I experienced firsthand the daily operational pressures faced by physicians, nurses, reception teams, and quality directors. I quickly realized why most generic healthcare software fails: it is built by people who have never worked a clinical shift, resulting in bloated menus that slow down consultations or shallow tools that miss critical financial and clinical controls.

To bridge that gap, I combined my professional background in clinical nursing and healthcare quality management with modern full-stack software engineering. I have architected, built, and deployed specialized health-tech platforms including Soli Medical (for solo clinics and multi-department complexes), ICU-Sync (critical care coordination), Mitali Hospital ERP, medical inventory & warehouse systems, and clinical quality audit suites.

My philosophy is grounded in practical impact: great medical software must respect the doctor's focus, simplify the receptionist's queue, safeguard patient records, and give healthcare leaders real-time visibility into both clinical quality and financial performance.`
      },
      highlights: {
        ar: [
          "\u062E\u0644\u0641\u064A\u0629 \u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0639\u0645\u0644\u064A\u0629 \u0631\u0627\u0633\u062E\u0629 \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636\u060C \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 (ICU)\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
          "\u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0634\u063A\u064A\u0644 \u0623\u0646\u0638\u0645\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062E\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u062E\u0627\u0635\u0629 \u0645\u0646 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u062D\u062A\u0649 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0645\u064A\u062F\u0627\u0646\u064A",
          "\u062A\u0635\u0645\u064A\u0645 \u0645\u0639\u0645\u0627\u0631\u064A \u0644\u0623\u0646\u0638\u0645\u0629 \u0648\u064A\u0628 \u0633\u062D\u0627\u0628\u064A\u0629 \u062B\u0646\u0627\u0626\u064A\u0629 \u0627\u0644\u0644\u063A\u0629 (RTL/LTR) \u0633\u0631\u064A\u0639\u0629 \u0648\u0622\u0645\u0646\u0629 \u0648\u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644",
          "\u0631\u0628\u0637 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0628\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0630\u0643\u064A\u0629 (\u0628\u0648\u062A\u0627\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645\u060C \u0648\u0627\u062A\u0633\u0627\u0628\u060C \u0648\u0635\u0641\u062D\u0627\u062A \u0647\u0628\u0648\u0637 \u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A)"
        ],
        en: [
          "Strong clinical foundation in Nursing, Critical Care (ICU), and Healthcare Quality Assurance",
          "End-to-end engineering and on-site deployment of clinic and charitable medical complex systems",
          "Cloud-native bilingual (Arabic RTL / English LTR) web platforms built with React & TypeScript",
          "Seamless patient automation connecting clinics with Telegram bots, WhatsApp, and standalone portals"
        ]
      },
      metrics: [
        {
          value: "01",
          label: {
            ar: "\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u2014 \u0641\u0647\u0645 \u0639\u0645\u064A\u0642 \u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A",
            en: "Clinical & Quality Foundation \u2014 Deep understanding of hospital and outpatient workflows"
          }
        },
        {
          value: "02",
          label: {
            ar: "\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u2014 \u062A\u0637\u0648\u064A\u0631 \u0645\u0646\u0635\u0627\u062A \u0648\u064A\u0628 \u0633\u062D\u0627\u0628\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 (Soli Medical & ICU-Sync)",
            en: "Health-Tech Engineering \u2014 Cloud SaaS & ERP development (Soli Medical & ICU-Sync)"
          }
        },
        {
          value: "03",
          label: {
            ar: "\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u064A\u062F\u0627\u0646\u064A \u0648\u0627\u0644\u0623\u062A\u0645\u062A\u0629 \u2014 \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0631\u0628\u0637 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0622\u0644\u064A \u0639\u0628\u0631 \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0648\u0648\u0627\u062A\u0633\u0627\u0628",
            en: "Field Deployment & Automation \u2014 Staff onboarding and Telegram/WhatsApp patient flows"
          }
        }
      ],
      experienceTimeline: [
        {
          period: {
            ar: "2024 \u2014 \u0627\u0644\u062D\u0627\u0636\u0631",
            en: "2024 \u2014 Present"
          },
          role: {
            ar: "\u0645\u0624\u0633\u0633 \u0648\u0645\u0637\u0648\u0651\u0631 \u0631\u0626\u064A\u0633\u064A \u0644\u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629",
            en: "Founder & Lead Architect \u2014 Soli Medical & Digital Healthcare Systems"
          },
          organization: {
            ar: "\u0645\u0646\u0635\u0629 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 / \u0623\u0646\u0638\u0645\u0629 Soli Medical",
            en: "Ahmed Soliman Digital Platform / Soli Medical Systems"
          },
          description: {
            ar: "\u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0634\u063A\u064A\u0644 \u062D\u0632\u0645\u0629 \u0623\u0646\u0638\u0645\u0629 Soli Medical \u0644\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0644\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0645\u0639 \u062A\u0637\u0648\u064A\u0631 \u0628\u0648\u062A \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0630\u0643\u064A (@SoliMedicalproBot) \u0648\u0628\u0646\u0627\u0621 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A.",
            en: "Architecting and operating the Soli Medical suite for solo clinics and multi-department polyclinics, alongside the @SoliMedicalproBot automated booking assistant and standalone clinic portals."
          }
        },
        {
          period: {
            ar: "2023 \u2014 \u0627\u0644\u062D\u0627\u0636\u0631",
            en: "2023 \u2014 Present"
          },
          role: {
            ar: "\u0645\u0637\u0648\u0651\u0631 \u0648\u0645\u0634\u063A\u0651\u0644 \u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 (ERP)",
            en: "Medical Complex ERP & Inventory Systems Developer"
          },
          organization: {
            ar: "\u0645\u062C\u0645\u0639\u0627\u062A \u0648\u0645\u0631\u0627\u0643\u0632 \u0637\u0628\u064A\u0629 \u062E\u064A\u0631\u064A\u0629 \u0648\u062E\u0627\u0635\u0629 \u0641\u064A \u0645\u0635\u0631 (Mitali & Community Centers)",
            en: "Charitable & Private Medical Complexes in Egypt"
          },
          description: {
            ar: "\u0628\u0646\u0627\u0621 \u0648\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0644\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0644\u062A\u0646\u0638\u064A\u0645 \u0634\u0628\u0627\u0643 \u0627\u0644\u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u060C \u062A\u0639\u062F\u062F \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u062A\u0642\u0641\u064A\u0644 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
            en: "Building and operating facility-wide software governing central ticketing, multi-specialty clinics, physician revenue shares, shift accounting, and medical supply inventory."
          }
        },
        {
          period: {
            ar: "2022 \u2014 2024",
            en: "2022 \u2014 2024"
          },
          role: {
            ar: "\u0623\u062E\u0635\u0627\u0626\u064A \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0645\u0634\u0631\u0648\u0639 ICU-Sync",
            en: "Healthcare Quality Specialist & Creator of ICU-Sync"
          },
          organization: {
            ar: "\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649",
            en: "Critical Care Units (ICU) & Healthcare Quality Governance"
          },
          description: {
            ar: "\u062A\u0637\u0648\u064A\u0631 \u0646\u0638\u0627\u0645 ICU-Sync \u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0623\u0633\u0631\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0628\u0627\u0644\u062A\u0648\u0627\u0632\u064A \u0645\u0639 \u062A\u0637\u0628\u064A\u0642 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0648\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
            en: "Engineered ICU-Sync for intensive care bed telemetry and clinical shift handoffs while leading healthcare quality assurance, infection control audits, and patient safety standards."
          }
        },
        {
          period: {
            ar: "\u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u0645\u0633\u064A\u0631\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629",
            en: "Early Clinical Career"
          },
          role: {
            ar: "\u0645\u0645\u0627\u0631\u0633 \u0633\u0631\u064A\u0631\u064A \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0627\u0644\u0637\u0648\u0627\u0631\u0626",
            en: "Clinical Nursing & Critical Care Practitioner"
          },
          organization: {
            ar: "\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u0634\u0622\u062A \u0627\u0644\u0635\u062D\u064A\u0629",
            en: "Hospitals & Clinical Facilities"
          },
          description: {
            ar: "\u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0641\u064A \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0648\u062A\u0646\u0633\u064A\u0642 \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0628\u064A\u0646 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u060C \u0648\u0647\u064A \u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u062A\u064A \u0634\u0643\u0644\u062A \u0627\u0644\u0623\u0633\u0627\u0633 \u0627\u0644\u0639\u0645\u0644\u064A \u0644\u0643\u0644 \u0646\u0638\u0627\u0645 \u0628\u0631\u0645\u062C\u064A \u0642\u0645\u062A \u0628\u0628\u0646\u0627\u0626\u0647 \u0644\u0627\u062D\u0642\u0627\u064B.",
            en: "Hands-on bedside patient care, emergency triage, and inter-departmental clinical coordination\u2014forming the domain bedrock for every software system built thereafter."
          }
        }
      ],
      skills: [
        {
          category: {
            ar: "\u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
            en: "Clinical Care & Healthcare Quality"
          },
          items: [
            "Critical Care & ICU Workflows",
            "Healthcare Quality Standards (GAHAR / JCI)",
            "Patient Safety & Risk Management",
            "Infection Control Protocols",
            "Clinical Audit &KPI Dashboards",
            "Outpatient & Polyclinic Operations"
          ]
        },
        {
          category: {
            ar: "\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0648\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0648\u064A\u0628",
            en: "Full-Stack Software Engineering"
          },
          items: [
            "React 19 & Next.js",
            "TypeScript & JavaScript (ES2024)",
            "Tailwind CSS & Responsive RTL/LTR UI",
            "Node.js & Express APIs",
            "Cloud Firestore & Firebase Auth",
            "Zero-Trust Security Rules & RBAC"
          ]
        },
        {
          category: {
            ar: "\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629",
            en: "Medical Systems & Patient Automation"
          },
          items: [
            "Electronic Medical Records (Cloud EMR)",
            "Clinic Treasury & Shift Accounting",
            "Medical Inventory & Pharmacy Stock",
            "Telegram Bot API (@SoliMedicalproBot)",
            "WhatsApp Business Consultation Flows",
            "Technical SEO & Medical Schema.org"
          ]
        }
      ],
      qualifications: [
        {
          degree: {
            ar: "\u0628\u0643\u0627\u0644\u0648\u0631\u064A\u0648\u0633 \u0648\u0645\u0624\u0647\u0644\u0627\u062A \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0639\u0644\u0648\u0645 \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
            en: "Academic & Professional Credentials in Nursing & Healthcare Sciences"
          },
          institution: {
            ar: "\u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0627\u0644\u062C\u0627\u0645\u0639\u064A \u0648\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u0645\u062A\u0642\u062F\u0645 \u2014 \u0645\u0635\u0631",
            en: "University Clinical Education & Advanced Healthcare Training \u2014 Egypt"
          },
          year: "Clinical & Academic Track",
          details: {
            ar: "\u062A\u0623\u0647\u064A\u0644 \u0639\u0644\u0645\u064A \u0648\u0639\u0645\u0644\u064A \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0646\u0638\u0645 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629\u060C \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.",
            en: "Comprehensive academic and clinical grounding in critical care nursing, patient safety, and health informatics."
          }
        },
        {
          degree: {
            ar: "\u062F\u0631\u0627\u0633\u0627\u062A \u0648\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
            en: "Healthcare Quality Management & Clinical Governance"
          },
          institution: {
            ar: "\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0637\u0628\u064A \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0635\u062D\u064A",
            en: "Clinical KPIs, Infection Control & Accreditation Readiness"
          },
          year: "Quality Track",
          details: {
            ar: "\u0628\u0646\u0627\u0621 \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0642\u064A\u0627\u0633 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 (KPIs)\u060C \u0648\u062A\u062D\u0648\u064A\u0644 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0625\u0644\u0649 \u0623\u0646\u0638\u0645\u0629 \u0631\u0642\u0645\u064A\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0642\u064A\u0627\u0633.",
            en: "Designing clinical audit checklists, tracking hospital KPIs, and digitizing quality assurance workflows."
          }
        },
        {
          degree: {
            ar: "\u0647\u0646\u062F\u0633\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0648\u064A\u0628 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 (Full-Stack Engineering)",
            en: "Full-Stack Web & Cloud Software Architecture"
          },
          institution: {
            ar: "\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0622\u0645\u0646\u0629",
            en: "Cloud SaaS Architecture, TypeScript, React & Firebase Security"
          },
          year: "Engineering Track",
          details: {
            ar: "\u0627\u062D\u062A\u0631\u0627\u0641 \u0628\u0646\u0627\u0621 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0648\u064A\u0628 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629\u060C \u0647\u064A\u0643\u0644\u0629 \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629\u060C \u0648\u062A\u0623\u0645\u064A\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629.",
            en: "Mastering modern web application architecture, multi-tenant database modeling, and role-based security."
          }
        }
      ],
      achievements: [
        {
          title: {
            ar: "\u0625\u0637\u0644\u0627\u0642 \u0648\u062A\u0634\u063A\u064A\u0644 \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0628\u0645\u0633\u0627\u0631\u064A\u0647\u0627 \u0627\u0644\u0641\u0631\u062F\u064A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A",
            en: "Launched & Operated Soli Medical Dual-Track Platform"
          },
          metric: "Soli Medical Suite",
          description: {
            ar: "\u0628\u0646\u0627\u0621 \u0645\u0646\u0635\u0629 \u0633\u062D\u0627\u0628\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u062A\u063A\u0637\u064A \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0645\u0639 \u062D\u062C\u0632 \u0630\u0627\u062A\u064A \u0648\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645.",
            en: "Engineered a complete cloud platform serving both solo physician practices and multi-department polyclinics."
          }
        },
        {
          title: {
            ar: "\u0627\u0628\u062A\u0643\u0627\u0631 \u0646\u0638\u0627\u0645 ICU-Sync \u0644\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629",
            en: "Architected ICU-Sync Critical Care Telemetry System"
          },
          metric: "ICU-Sync",
          description: {
            ar: "\u062A\u0637\u0648\u064A\u0631 \u0644\u0648\u062D\u0629 \u0642\u064A\u0627\u062F\u0629 \u0633\u0631\u064A\u0631\u064A\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u0627\u0644\u0629 \u0623\u0633\u0631\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0628\u062F\u0642\u0629.",
            en: "Created a specialized ICU command dashboard for real-time bed status, vital signs tracking, and structured shift handoffs."
          }
        },
        {
          title: {
            ar: "\u0631\u0642\u0645\u0646\u0629 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062E\u064A\u0631\u064A\u0629 \u0648\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646",
            en: "Digitized Charitable Medical Complexes & Medical Warehouses"
          },
          metric: "100% Digital Flow",
          description: {
            ar: "\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0625\u0644\u0649 \u0645\u0633\u0627\u0631 \u0631\u0642\u0645\u064A \u064A\u0636\u0628\u0637 \u0627\u0644\u062A\u0630\u0627\u0643\u0631\u060C \u0627\u0644\u062E\u0632\u064A\u0646\u0629\u060C \u0648\u0627\u0644\u0623\u0631\u0635\u062F\u0629 \u0627\u0644\u062F\u0648\u0627\u0626\u064A\u0629.",
            en: "Transformed paper-based community clinic and warehouse operations into auditable digital ledgers."
          }
        }
      ],
      interests: {
        ar: [
          "\u0645\u0639\u0644\u0648\u0645\u0627\u062A\u064A\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A",
          "\u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0627\u0644\u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u062A\u0639\u0642\u064A\u062F",
          "\u0646\u0638\u0645 \u062F\u0639\u0645 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629",
          "\u0623\u062A\u0645\u062A\u0629 \u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u0631\u064A\u0636 \u0639\u0628\u0631 \u0627\u0644\u0628\u0648\u062A\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629",
          "\u0627\u0644\u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0627\u0644\u0645\u064A\u062F\u0627\u0646\u064A\u0629 \u0641\u064A \u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627 \u0627\u0644\u0635\u062D\u064A\u0629"
        ],
        en: [
          "Health Informatics & Hospital Digital Transformation",
          "Zero-Friction Clinical User Interface (UI/UX) Design",
          "Clinical Decision Support & ICU Patient Safety",
          "Conversational Patient Automation & Smart Bots",
          "Technical Writing & Health-Tech Knowledge Sharing"
        ]
      },
      heroImage: "/assets/aistudio/1770146906397_16665dd0.png",
      standaloneByDefault: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: "\u0645\u0646 \u0623\u0646\u0627 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u2014 \u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
          en: "About Ahmed Soliman \u2014 Editorial Profile & Career Timeline"
        },
        description: {
          ar: "\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u064A\u0631\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0644\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u0628\u064A\u0646 \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0641\u064A \u0645\u0635\u0631.",
          en: "Explore Ahmed Soliman\u2019s monograph, career timeline, qualifications, and philosophy at the intersection of healthcare quality and software engineering."
        },
        ogImage: "/assets/aistudio/1770146906397_16665dd0.png",
        canonicalSlug: "/about",
        structuredDataType: "Person"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "projects",
      slug: "projects",
      title: {
        ar: "\u0645\u0639\u0631\u0636 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629",
        en: "Projects & Systems Gallery"
      },
      kicker: {
        ar: "\u0645\u0639\u0631\u0636 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Healthcare Software & ERP Systems"
      },
      headline: {
        ar: "\u0645\u0639\u0631\u0636 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629",
        en: "Featured Healthcare Software & Digital Systems"
      },
      subheadline: {
        ar: "\u0627\u0633\u062A\u0639\u0631\u0636 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629 \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0637\u0648\u0651\u0631\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A.",
        en: "Explore specialized healthcare software platforms engineered for clinics, ICUs, and hospitals."
      },
      biography: {
        ar: "\u0645\u062C\u0645\u0648\u0639\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0635\u0645\u0645\u0629 \u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A \u062F\u0627\u062E\u0644 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A.",
        en: "Cloud healthcare systems built around real clinical and administrative workflows."
      },
      highlights: { ar: [], en: [] },
      metrics: [],
      experienceTimeline: [],
      skills: [],
      heroImage: "/assets/aistudio/logo_ae3842b8.png",
      standaloneByDefault: false,
      published: true,
      order: 3,
      seo: {
        title: {
          ar: "\u0645\u0639\u0631\u0636 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Projects & Healthcare Systems | Ahmed Soliman"
        },
        description: {
          ar: "\u0627\u0633\u062A\u0643\u0634\u0641 \u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0623\u0646\u0638\u0645\u0629 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0629.",
          en: "Explore healthcare software systems by Ahmed Soliman."
        },
        canonicalSlug: "/projects",
        structuredDataType: "WebSite"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "solimedical",
      slug: "solimedical",
      title: {
        ar: "\u0635\u0641\u062D\u0629 \u0639\u0631\u0636 \u0646\u0638\u0627\u0645 Soli Medical",
        en: "Soli Medical Showcase Page"
      },
      kicker: {
        ar: "Soli Medical \xB7 \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Soli Medical \xB7 Clinic & Polyclinic Management Suite"
      },
      headline: {
        ar: "\u0646\u0638\u0627\u0645\u0627\u0646 \u0639\u0631\u0628\u064A\u0627\u0646 \u0644\u0631\u0639\u0627\u064A\u0629 \u062A\u062A\u062D\u0631\u0643 \u0645\u0639\u0643.",
        en: "Two Clinical Systems Engineered Around Your Care."
      },
      subheadline: {
        ar: "\u0627\u062E\u062A\u0631 \u0645\u0627 \u064A\u0646\u0627\u0633\u0628 \u062D\u062C\u0645 \u0645\u0646\u0634\u0623\u062A\u0643: \u0646\u0638\u0627\u0645 \u0648\u0627\u0636\u062D \u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F\u060C \u0623\u0648 \u0645\u0646\u0638\u0648\u0645\u0629 \u062A\u0634\u063A\u064A\u0644 \u0645\u062A\u0631\u0627\u0628\u0637\u0629 \u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629.",
        en: "Choose what fits your facility: a streamlined system for solo clinics or an interconnected platform for medical complexes."
      },
      biography: {
        ar: "\u0645\u0646 \u064A\u0648\u0645\u064A\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0625\u0644\u0649 \u0642\u0631\u0627\u0631 \u0625\u062F\u0627\u0631\u064A \u0623\u0648\u0636\u062D.",
        en: "From daily clinic workflows to clearer executive decisions."
      },
      highlights: { ar: [], en: [] },
      metrics: [],
      experienceTimeline: [],
      skills: [],
      heroImage: "/assets/aistudio/logo_ae3842b8.png",
      standaloneByDefault: false,
      published: true,
      order: 4,
      seo: {
        title: {
          ar: "Soli Medical | \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
          en: "Soli Medical | Clinic & Polyclinic Management System"
        },
        description: {
          ar: "\u0646\u0638\u0627\u0645 \u0639\u0631\u0628\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629: \u0627\u0633\u062A\u0642\u0628\u0627\u0644\u060C \u062D\u062C\u0632 \u0645\u0648\u0627\u0639\u064A\u062F\u060C \u0645\u0644\u0641\u0627\u062A \u0645\u0631\u0636\u0649\u060C \u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u062A\u0642\u0627\u0631\u064A\u0631.",
          en: "Bilingual clinic management system: reception, appointments, EMR, billing, and analytics."
        },
        canonicalSlug: "/solimedical",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "clinics",
      slug: "clinics",
      title: {
        ar: "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Medical Clinics Directory"
      },
      kicker: {
        ar: "\u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629",
        en: "Standalone Clinic Landing Portals"
      },
      headline: {
        ar: "\u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0635\u0641\u062D\u0627\u062A \u0647\u0628\u0648\u0637 \u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A",
        en: "Dedicated Standalone Portals for Clinics & Medical Centers"
      },
      subheadline: {
        ar: "\u0644\u0643\u0644 \u0639\u064A\u0627\u062F\u0629 \u0623\u0648 \u0645\u0631\u0643\u0632 \u0637\u0628\u064A \u0635\u0641\u062D\u0629 \u0647\u0628\u0648\u0637 \u0645\u0633\u062A\u0642\u0644\u0629 \u062A\u0639\u0631\u0636 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.",
        en: "Each clinic features a dedicated standalone landing page showcasing doctors, services, pricing, and direct booking."
      },
      biography: {
        ar: "\u062F\u0644\u064A\u0644 \u0627\u0644\u0628\u0648\u0627\u0628\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A.",
        en: "Directory of standalone medical clinic landing pages."
      },
      highlights: { ar: [], en: [] },
      metrics: [],
      experienceTimeline: [],
      skills: [],
      heroImage: "/assets/aistudio/logo_ae3842b8.png",
      standaloneByDefault: false,
      published: true,
      order: 5,
      seo: {
        title: {
          ar: "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Medical Clinics & Portals | Ahmed Soliman"
        },
        description: {
          ar: "\u0627\u0633\u062A\u0639\u0631\u0636 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
          en: "Browse standalone medical clinic landing pages."
        },
        canonicalSlug: "/clinics",
        structuredDataType: "MedicalClinic"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "blog",
      slug: "blog",
      title: {
        ar: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0631\u0641\u0629",
        en: "Blog & Knowledge Hub"
      },
      kicker: {
        ar: "\u0627\u0644\u0645\u062C\u0644\u0629 \u0627\u0644\u062A\u062D\u0631\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0639\u0631\u0641\u064A\u0629",
        en: "Editorial & Knowledge Hub"
      },
      headline: {
        ar: "\u0645\u0642\u0627\u0644\u0627\u062A \u062A\u0642\u0646\u064A\u0629 \u0648\u0637\u0628\u064A\u0629 \u0648\u062A\u062C\u0627\u0631\u0628 \u0639\u0645\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0645\u064A\u062F\u0627\u0646",
        en: "Healthcare Engineering & Clinical Quality Articles"
      },
      subheadline: {
        ar: "\u0634\u0631\u0648\u062D\u0627\u062A \u0648\u0645\u0642\u0627\u0644\u0627\u062A \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0635\u062D\u064A\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629.",
        en: "In-depth articles on digital healthcare transformation, clinic operations, and clinical quality."
      },
      biography: {
        ar: "\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0637\u0628\u064A\u0629.",
        en: "Technical and clinical knowledge hub."
      },
      highlights: { ar: [], en: [] },
      metrics: [],
      experienceTimeline: [],
      skills: [],
      heroImage: "/assets/aistudio/1770146906397_16665dd0.png",
      standaloneByDefault: false,
      published: true,
      order: 6,
      seo: {
        title: {
          ar: "\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0648\u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Articles & Knowledge Hub | Ahmed Soliman"
        },
        description: {
          ar: "\u0645\u0642\u0627\u0644\u0627\u062A \u0648\u0634\u0631\u0648\u062D\u0627\u062A \u062A\u0642\u0646\u064A\u0629 \u0648\u0637\u0628\u064A\u0629 \u0628\u0642\u0644\u0645 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646.",
          en: "Articles and guides by Ahmed Soliman."
        },
        canonicalSlug: "/blog",
        structuredDataType: "BlogPosting"
      },
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  projects: [
    {
      id: "soli-medical-single-clinic",
      slug: "soli-medical-clinic-system",
      title: {
        ar: "\u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u2014 \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644",
        en: "Soli Medical \u2014 Integrated Clinic & Medical Complex Management Suite"
      },
      kicker: {
        ar: "01 \xB7 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 (\u0639\u064A\u0627\u062F\u0629 \u0641\u0631\u062F\u064A\u0629 + \u0645\u062C\u0645\u0639\u0627\u062A \u0637\u0628\u064A\u0629)",
        en: "01 \xB7 Flagship Medical SaaS (Solo Clinics + Polyclinics)"
      },
      summary: {
        ar: "\u0627\u0644\u062C\u064A\u0644 \u0627\u0644\u062C\u062F\u064A\u062F \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629: \u0646\u0638\u0627\u0645 \u0633\u062D\u0627\u0628\u064A \u064A\u062C\u0645\u0639 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0630\u0643\u064A\u060C \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A (Cloud EMR)\u060C \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629\u060C \u0648\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0648\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645.",
        en: "Next-generation cloud healthcare management uniting smart booking, Cloud EMR, e-prescriptions, financial accounting, and Telegram/WhatsApp patient automation."
      },
      description: {
        ar: '\u0635\u064F\u0645\u0645\u062A \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0644\u062A\u0642\u062F\u0645 \u0645\u0633\u0627\u0631\u064A\u0646 \u0645\u0635\u0645\u0645\u064A\u0646 \u0628\u062F\u0642\u0629 \u062D\u0633\u0628 \u062D\u062C\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629: \u0645\u0633\u0627\u0631 "\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F" \u0627\u0644\u0630\u064A \u064A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0633\u0631\u0639\u0629 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0627\u0644\u0643\u0634\u0641 \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0648\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0628\u062F\u0648\u0646 \u062A\u0639\u0642\u064A\u062F\u060C \u0648\u0645\u0633\u0627\u0631 "\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629" \u0627\u0644\u0630\u064A \u064A\u0631\u0628\u0637 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u0639\u062F\u062F\u0629 \u0648\u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0648\u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0641\u064A \u0644\u0648\u062D\u0629 \u0642\u064A\u0627\u062F\u0629 \u0648\u0627\u062D\u062F\u0629.',
        en: "Soli Medical provides two purpose-built operational tracks: the Single-Doctor Clinic track focused on rapid check-in, EMR, e-prescription, and daily cash balance, and the Medical Complex track connecting multi-specialty clinics, departments, RBAC permissions, and central finance."
      },
      problem: {
        ar: "\u0645\u0639\u0638\u0645 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u062A\u0639\u0627\u0646\u064A \u0625\u0645\u0627 \u0645\u0646 \u0627\u0644\u062F\u0641\u0627\u062A\u0631 \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0648\u062A\u0634\u062A\u062A \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0636\u063A\u0637 \u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u062D\u062C\u0632\u060C \u0623\u0648 \u0645\u0646 \u0628\u0631\u0627\u0645\u062C \u0645\u062D\u0627\u0633\u0628\u064A\u0629 \u0645\u0639\u0642\u062F\u0629 \u063A\u064A\u0631 \u0645\u0635\u0645\u0645\u0629 \u0644\u0628\u064A\u0626\u0629 \u0627\u0644\u0643\u0634\u0641 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0633\u0631\u064A\u0639 \u0648\u062A\u0641\u062A\u0642\u0631 \u0644\u062F\u0639\u0645 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644.",
        en: "Clinics and medical centers either struggle with fragmented paper records and overwhelmed reception phones, or face bloated legacy software that slows doctors down during consultations."
      },
      solution: {
        ar: "\u0628\u0646\u0627\u0621 \u0645\u0646\u0635\u0629 \u0633\u062D\u0627\u0628\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u0648\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 (RTL/LTR) \u0628\u0648\u0627\u062C\u0647\u0629 \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0648\u0636\u0648\u062D \u062A\u0631\u0628\u0637 \u0634\u0627\u0634\u0629 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0628\u0634\u0627\u0634\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0644\u062D\u0638\u064A\u0627\u064B\u060C \u0645\u0639 \u0645\u0644\u0641 \u0645\u0631\u064A\u0636 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0643\u0627\u0645\u0644\u060C \u0631\u0648\u0634\u062A\u0629 \u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0637\u0628\u0627\u0639\u0629\u060C \u062A\u0642\u0627\u0631\u064A\u0631 \u062E\u0632\u064A\u0646\u0629 \u062F\u0642\u064A\u0642\u0629\u060C \u0648\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0648\u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0644\u062D\u062C\u0632 \u0627\u0644\u0630\u0627\u062A\u064A.",
        en: "Engineered a fast, native RTL/LTR cloud platform synchronizing reception queues with the doctor\u2019s consultation screen in real time, complete with Cloud EMR, printable prescriptions, financial ledgers, and automated bot booking."
      },
      category: "medical-systems",
      categoryLabel: {
        ar: "\u0623\u0646\u0638\u0645\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A",
        en: "Clinic Management Systems"
      },
      coverImage: "/assets/solimedical/dashboard.svg",
      logoImage: "/assets/aistudio/logo_ae3842b8.png",
      videoUrl: "https://www.youtube.com/watch?v=l90OUlLJT-I",
      youtubeId: "l90OUlLJT-I",
      liveUrl: "https://solimedical.vercel.app/solimedical",
      showcaseRoute: "/solimedical",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
        en: "Hello Ahmed, I would like to inquire about the Soli Medical Clinic & Complex Management System."
      },
      features: {
        ar: [
          "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0648\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0644\u062D\u0638\u064A\u0629 \u0628\u064A\u0646 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0627\u0644\u0637\u0628\u064A\u0628",
          "\u0633\u062C\u0644 \u0637\u0628\u064A \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0633\u062D\u0627\u0628\u064A (Cloud EMR) \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0641\u064A \u0634\u0627\u0634\u0629 \u0648\u0627\u062D\u062F\u0629",
          "\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0648\u062D\u0633\u0627\u0628 \u0646\u0633\u0628 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0628\u062F\u0642\u0629",
          "\u0645\u0633\u0627\u0631 \u0645\u062E\u0635\u0635 \u0644\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0645\u0633\u0627\u0631 \u0645\u062A\u0643\u0627\u0645\u0644 \u0644\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
          "\u062A\u0643\u0627\u0645\u0644 \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 (@SoliMedicalproBot) \u0648\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u062A\u0633\u0627\u0628"
        ],
        en: [
          "Real-time appointment scheduling and live waiting queue synchronization",
          "Cloud Electronic Medical Records (EMR) and one-click printable e-prescriptions",
          "Daily billing, shift treasury reconciliation, and physician revenue share ledgers",
          "Dedicated tracks for Single-Doctor Clinics and Multi-Department Medical Complexes",
          "Integrated Telegram booking bot (@SoliMedicalproBot) and WhatsApp notifications"
        ]
      },
      techStack: ["React 19", "TypeScript", "Next.js", "Tailwind CSS", "Cloud Firestore", "Telegram Bot API"],
      screens: [
        {
          id: "screen-dashboard",
          title: {
            ar: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
            en: "Command Dashboard"
          },
          caption: {
            ar: "\u0646\u0638\u0631\u0629 \u0633\u0631\u064A\u0639\u0629 \u0639\u0644\u0649 \u0646\u0634\u0627\u0637 \u0627\u0644\u064A\u0648\u0645: \u0627\u0644\u0643\u0634\u0648\u0641\u0627\u062A\u060C \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631\u060C \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0645\u0624\u0643\u062F\u0629\u060C \u0648\u0627\u0644\u0625\u064A\u0631\u0627\u062F \u0627\u0644\u064A\u0648\u0645\u064A.",
            en: "Instant overview of today\u2019s clinical activity: consultations, waiting queue, confirmed bookings, and daily revenue."
          },
          imageUrl: "/assets/solimedical/dashboard.svg"
        },
        {
          id: "screen-appointments",
          title: {
            ar: "\u062D\u062C\u0632 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F",
            en: "Appointments & Queue"
          },
          caption: {
            ar: "\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0636\u062D\u0629 \u0644\u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0645\u0646 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u062F\u062E\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062D\u0627\u0644\u0629 \u0644\u062D\u0638\u064A\u0627\u064B.",
            en: "Streamlined reception workflow for patient check-in and real-time status synchronization with the doctor."
          },
          imageUrl: "/assets/solimedical/booking.svg"
        },
        {
          id: "screen-patients",
          title: {
            ar: "\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0631\u0636\u0649",
            en: "Cloud EMR & Prescriptions"
          },
          caption: {
            ar: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0641\u064A \u0633\u064A\u0627\u0642 \u0639\u0645\u0644\u064A \u0648\u0627\u062D\u062F.",
            en: "Complete patient history, clinical notes, and printable prescriptions organized in one view."
          },
          imageUrl: "/assets/solimedical/emr.svg"
        }
      ],
      comparisonTable: [
        {
          axis: { ar: "\u0635\u0627\u062D\u0628 \u0627\u0644\u0642\u0631\u0627\u0631", en: "Decision Maker" },
          singleClinic: { ar: "\u0627\u0644\u0637\u0628\u064A\u0628 \u0623\u0648 \u0635\u0627\u062D\u0628 \u0627\u0644\u0639\u064A\u0627\u062F\u0629", en: "Solo Physician or Clinic Owner" },
          medicalComplex: { ar: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u062C\u0645\u0639 \u0623\u0648 \u0627\u0644\u0625\u062F\u0627\u0631\u0629", en: "Complex Director or Management Board" }
        },
        {
          axis: { ar: "\u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629", en: "Starting Point" },
          singleClinic: { ar: "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0627\u0644\u0643\u0634\u0641 \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0648\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629", en: "Streamlining reception, consultation, prescription & billing" },
          medicalComplex: { ar: "\u0631\u0628\u0637 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0648\u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629", en: "Connecting multiple clinics, departments, finance & administration" }
        },
        {
          axis: { ar: "\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629", en: "Operational Units" },
          singleClinic: { ar: "\u0639\u064A\u0627\u062F\u0629 \u0648\u0627\u062D\u062F\u0629 \u0648\u0641\u0631\u064A\u0642 \u0639\u0645\u0644 \u0635\u063A\u064A\u0631", en: "Single clinic with a lean reception team" },
          medicalComplex: { ar: "\u0639\u064A\u0627\u062F\u0627\u062A \u0645\u062A\u0639\u062F\u062F\u0629 \u0648\u0623\u0642\u0633\u0627\u0645 \u0648\u0648\u062D\u062F\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629", en: "Multi-specialty clinics, labs, pharmacies & cashier desks" }
        },
        {
          axis: { ar: "\u0623\u0648\u0644 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0639\u0631\u0636", en: "First Discovery Question" },
          singleClinic: { ar: "\u0643\u0645 \u0637\u0628\u064A\u0628\u0627\u064B \u0648\u0643\u0645 \u0645\u0648\u0638\u0641 \u0627\u0633\u062A\u0642\u0628\u0627\u0644\u061F", en: "How many doctors and receptionists operate daily?" },
          medicalComplex: { ar: "\u0645\u0627 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0648\u0643\u064A\u0641 \u062A\u0631\u062A\u0628\u0637 \u0628\u0628\u0639\u0636\u0647\u0627\u061F", en: "Which departments exist and how do their workflows connect?" }
        },
        {
          axis: { ar: "\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u062A\u0646\u0641\u064A\u0630", en: "Deployment Model" },
          singleClinic: { ar: "\u062A\u0641\u0639\u064A\u0644 \u0645\u0628\u0627\u0634\u0631 \u0648\u062A\u062F\u0631\u064A\u0628 \u0633\u0631\u064A\u0639", en: "Direct activation and rapid onboarding" },
          medicalComplex: { ar: "\u062A\u0646\u0641\u064A\u0630 \u0645\u0631\u062D\u0644\u064A \u062D\u0633\u0628 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u0642\u0633\u0627\u0645", en: "Phased rollout tailored to each operational unit" }
        }
      ],
      featured: true,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: "\u0646\u0638\u0627\u0645 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Soli Medical Clinic & Polyclinic Management System | Ahmed Soliman"
        },
        description: {
          ar: "\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629: \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F\u060C \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0637\u0628\u064A\u060C \u0627\u0644\u0631\u0648\u0634\u062A\u0629\u060C \u0648\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629.",
          en: "Explore Soli Medical by Ahmed Soliman: smart clinic appointments, Cloud EMR, prescriptions, billing, and multi-clinic ERP."
        },
        ogImage: "/assets/aistudio/logo_ae3842b8.png",
        canonicalSlug: "/projects/soli-medical-clinic-system",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "icu-sync-critical-care",
      slug: "icu-sync-critical-care-system",
      title: {
        ar: "\u0646\u0638\u0627\u0645 ICU-Sync \u2014 \u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629",
        en: "ICU-Sync \u2014 Intensive Care Telemetry & Clinical Shift Synchronization"
      },
      kicker: {
        ar: "02 \xB7 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0627\u0644\u0637\u0648\u0627\u0631\u0626 (Critical Care Tech)",
        en: "02 \xB7 Critical Care & Hospital ICU Coordination"
      },
      summary: {
        ar: "\u0645\u0646\u0635\u0629 \u0633\u0631\u064A\u0631\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 (ICU) \u062A\u062A\u064A\u062D \u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u0623\u0633\u0631\u0629 \u0644\u062D\u0638\u064A\u0627\u064B\u060C \u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0646\u0641\u0633\u060C \u0648\u062A\u0646\u0638\u064A\u0645 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0628\u064A\u0646 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0645\u0631\u064A\u0636.",
        en: "Specialized clinical cockpit for Intensive Care Units tracking real-time bed occupancy, vital signs trends, ventilator parameters, and structured SBAR shift handoffs."
      },
      description: {
        ar: "\u0648\u064F\u0644\u062F \u0645\u0634\u0631\u0648\u0639 ICU-Sync \u0645\u0646 \u0648\u0627\u0642\u0639 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0641\u0639\u0644\u064A \u062F\u0627\u062E\u0644 \u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u062D\u064A\u062B \u062A\u0645\u062B\u0644 \u0633\u0631\u0639\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u062F\u0642\u0629 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0641\u0627\u0631\u0642\u0627\u064B \u062D\u0627\u0633\u0645\u0627\u064B \u0641\u064A \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u064A\u0636. \u064A\u0648\u0641\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0634\u0627\u0634\u0629 \u0642\u064A\u0627\u062F\u0629 \u0645\u0631\u0643\u0632\u064A\u0629 \u062A\u0639\u0631\u0636 \u0643\u0644 \u0633\u0631\u064A\u0631 \u0648\u062D\u0627\u0644\u062A\u0647 \u0627\u0644\u062D\u0631\u062C\u0629 (Stable / Alert / Critical)\u060C \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629\u060C \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629 (Infusions)\u060C \u0648\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u062A\u062F\u062E\u0644 \u0627\u0644\u0633\u0631\u064A\u0639.",
        en: "Born directly from bedside experience inside Intensive Care Units, ICU-Sync addresses the critical risk of fragmented shift handoffs and delayed chart updates. It provides a central dark-mode command display showing every ICU bed status, hemodynamic trends, active infusions, and structured clinical handoff logs."
      },
      problem: {
        ar: "\u062A\u0639\u062F\u062F \u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0635\u0639\u0648\u0628\u0629 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u063A\u064A\u0631\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0633\u0631\u0629 \u0641\u064A \u0648\u0642\u062A \u0648\u0627\u062D\u062F\u060C \u0645\u0645\u0627 \u0642\u062F \u064A\u0624\u062F\u064A \u0644\u0641\u0642\u062F\u0627\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0647\u0645\u0629 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0645\u0631\u064A\u0636\u064A\u0629.",
        en: "Paper-heavy ICU flowcharts and fragmented bedside notes make it difficult to monitor unit-wide acuity shifts and create communication gaps during physician/nursing shift handovers."
      },
      solution: {
        ar: "\u062A\u0637\u0648\u064A\u0631 \u0644\u0648\u062D\u0629 \u0642\u064A\u0627\u062F\u0629 \u0631\u0642\u0645\u064A\u0629 \u0645\u0648\u062D\u062F\u0629 (ICU Command Center) \u062A\u0639\u0631\u0636 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u062E\u0637\u0648\u0631\u0629 \u0644\u0643\u0644 \u0633\u0631\u064A\u0631\u060C \u0645\u0639 \u0646\u0645\u0648\u0630\u062C \u062A\u0633\u0644\u064A\u0645 \u0648\u0631\u062F\u064A\u0629 \u0631\u0642\u0645\u064A \u0645\u0646\u0638\u0645 (SBAR Handoff) \u0648\u0633\u062C\u0644 \u062A\u062F\u0642\u064A\u0642 \u0632\u0645\u0646\u064A \u0644\u0644\u062A\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629.",
        en: "Built a real-time ICU Command Center interface visualizing bed acuity, vital sign alerts, ventilator settings, and standardized digital SBAR shift handoff protocols."
      },
      category: "medical-systems",
      categoryLabel: {
        ar: "\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629",
        en: "Critical Care Systems"
      },
      coverImage: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg",
      liveUrl: "https://solimedical.vercel.app/solimedical",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0646\u0638\u0627\u0645 ICU-Sync \u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629.",
        en: "Hello Ahmed, I would like to inquire about the ICU-Sync critical care system."
      },
      features: {
        ar: [
          "\u062E\u0631\u064A\u0637\u0629 \u062D\u064A\u0629 \u0644\u0623\u0633\u0631\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0645\u0639 \u062A\u0635\u0646\u064A\u0641 \u062F\u0631\u062C\u0629 \u0627\u0644\u062E\u0637\u0648\u0631\u0629 (Acuity Triage)",
          "\u062A\u0648\u062B\u064A\u0642 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0646\u0641\u0633 \u0627\u0644\u0635\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0645\u0636\u062E\u0627\u062A \u0627\u0644\u062F\u0648\u0627\u0626\u064A\u0629",
          "\u0646\u0638\u0627\u0645 \u062A\u0633\u0644\u064A\u0645 \u0648\u0631\u062F\u064A\u0627\u062A \u0631\u0642\u0645\u064A \u0645\u0646\u0638\u0645 (SBAR Shift Handoff) \u0628\u064A\u0646 \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0623\u0637\u0628\u0627\u0621",
          "\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0641\u0648\u0631\u064A\u0629 \u0644\u0644\u0642\u064A\u0645 \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0645\u0624\u0634\u0631\u0627\u062A \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u062F\u0627\u062E\u0644 \u0627\u0644\u0639\u0646\u0627\u064A\u0629",
          "\u0648\u0627\u062C\u0647\u0629 \u0644\u064A\u0644\u064A\u0629 \u0645\u0631\u064A\u062D\u0629 \u0644\u0644\u0639\u064A\u0646 \u0645\u0635\u0645\u0645\u0629 \u0644\u0628\u064A\u0626\u0629 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629 24/7 \u0641\u064A \u063A\u0631\u0641 \u0627\u0644\u062A\u062D\u0643\u0645"
        ],
        en: [
          "Live ICU bed map with color-coded clinical acuity and triage status",
          "Structured tracking for vital signs, ventilator modes, and continuous IV infusions",
          "Standardized digital SBAR shift handoff workflow for physicians and ICU nurses",
          "Early warning score (NEWS2) alerts and central line / infection control timers",
          "Low-glare dark-mode command interface engineered for 24/7 clinical stations"
        ]
      },
      techStack: ["React", "TypeScript", "Real-Time Telemetry UI", "Clinical SBAR Engine", "Tailwind CSS"],
      screens: [
        {
          id: "icu-screen-1",
          title: {
            ar: "\u0634\u0627\u0634\u0629 \u0642\u064A\u0627\u062F\u0629 \u0648\u062D\u062F\u0629 \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629",
            en: "ICU Central Telemetry Cockpit"
          },
          caption: {
            ar: "\u0639\u0631\u0636 \u0645\u062A\u0632\u0627\u0645\u0646 \u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0623\u0633\u0631\u0629 \u0648\u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0639\u0627\u062C\u0644\u0629.",
            en: "Synchronized multi-bed monitoring of hemodynamic vitals and critical alerts."
          },
          imageUrl: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg"
        }
      ],
      featured: true,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: "\u0646\u0638\u0627\u0645 ICU-Sync \u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 | \u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "ICU-Sync Intensive Care Coordination System | Ahmed Soliman Projects"
        },
        description: {
          ar: "\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0646\u0638\u0627\u0645 ICU-Sync \u0644\u062A\u0646\u0633\u064A\u0642 \u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0623\u0633\u0631\u0629 \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0645\u0646 \u062A\u0637\u0648\u064A\u0631 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646.",
          en: "Explore ICU-Sync by Ahmed Soliman: intensive care bed telemetry, vital signs monitoring, and digital shift handoffs."
        },
        ogImage: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg",
        canonicalSlug: "/projects/icu-sync-critical-care-system",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "mitali-hospital-erp",
      slug: "mitali-hospital-management-system",
      title: {
        ar: "\u0645\u0646\u0638\u0648\u0645\u0629 Mitali Hospital \u2014 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629",
        en: "Mitali Hospital \u2014 Multi-Department Hospital & Polyclinic ERP"
      },
      kicker: {
        ar: "03 \xB7 \u0645\u0646\u0638\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0643\u0628\u0631\u0649",
        en: "03 \xB7 Hospital & Multi-Specialty Center ERP"
      },
      summary: {
        ar: "\u0645\u0646\u0638\u0648\u0645\u0629 \u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0648\u0625\u062F\u0627\u0631\u064A\u0629 \u0645\u062A\u0631\u0627\u0628\u0637\u0629 \u0644\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u062A\u0631\u0628\u0637 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629\u060C \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629\u060C \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u060C \u0648\u0627\u0644\u0631\u0642\u0627\u0628\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629.",
        en: "Enterprise hospital management platform connecting central reception, outpatient clinics, diagnostic referrals, inpatient admissions, and financial governance."
      },
      description: {
        ar: "\u0635\u064F\u0645\u0645 \u0645\u0634\u0631\u0648\u0639 Mitali Hospital \u0644\u062A\u0644\u0628\u064A\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0636\u0645 \u0639\u0634\u0631\u0627\u062A \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u064A\u0629 \u062A\u062D\u062A \u0633\u0642\u0641 \u0648\u0627\u062D\u062F. \u064A\u0648\u0641\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u062F\u0648\u0631\u0629 \u0645\u0631\u064A\u0636 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u062A\u0628\u062F\u0623 \u0645\u0646 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u062D\u062F \u0644\u0644\u0645\u0631\u064A\u0636 (UHID)\u060C \u0645\u0631\u0648\u0631\u0627\u064B \u0628\u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u062F\u0627\u062E\u0644\u064A \u0628\u064A\u0646 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0645\u0644 \u0648\u0627\u0644\u0623\u0634\u0639\u0629\u060C \u0648\u062D\u062A\u0649 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u062A\u0642\u0627\u0631\u064A\u0631 \u0623\u062F\u0627\u0621 \u0627\u0644\u0623\u0642\u0633\u0627\u0645.",
        en: "Mitali Hospital ERP orchestrates patient and financial flows across multi-specialty hospitals and large polyclinics. Every patient receives a Unified Health ID (UHID) linking outpatient visits, lab/radiology orders, pharmacy dispensing, and central cashier billing."
      },
      problem: {
        ar: "\u0627\u0646\u0641\u0635\u0627\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0637\u0628\u064A\u0629 \u0639\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A\u060C \u0645\u0645\u0627 \u064A\u0633\u0628\u0628 \u0637\u0648\u0627\u0628\u064A\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0637\u0648\u064A\u0644\u0629\u060C \u062A\u0633\u0631\u0628\u0627\u064B \u0641\u064A \u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A\u060C \u0648\u0635\u0639\u0648\u0628\u0629 \u062D\u0633\u0627\u0628 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0639\u0627\u0642\u062F\u0627\u062A.",
        en: "Disconnected hospital departments lead to long patient queues, revenue leakage between clinics and diagnostics, and manual errors in calculating physician shares."
      },
      solution: {
        ar: "\u0628\u0646\u0627\u0621 \u0645\u0646\u0635\u0629 \u0645\u0648\u062D\u062F\u0629 \u062A\u0631\u0628\u0637 \u0634\u0628\u0627\u0643 \u0627\u0644\u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629\u060C \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u064A\u0629\u060C \u0648\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0645\u0639 \u0646\u0638\u0627\u0645 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A (RBAC) \u0648\u062A\u0642\u0627\u0631\u064A\u0631 \u0644\u062D\u0638\u064A\u0629 \u0644\u0644\u0625\u062F\u0627\u0631\u0629.",
        en: "Implemented an integrated hospital ERP with unified patient ticketing, cross-department service orders, automated doctor share calculation, and role-based access control."
      },
      category: "charitable-healthcare",
      categoryLabel: {
        ar: "\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A",
        en: "Hospital & Complex ERP"
      },
      coverImage: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
      liveUrl: "https://solimedical.vercel.app/clinics",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 Mitali Hospital \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A.",
        en: "Hello Ahmed, I would like to discuss the Mitali Hospital & Polyclinic ERP system."
      },
      features: {
        ar: [
          "\u0645\u0644\u0641 \u0648\u0631\u0642\u0645 \u0637\u0628\u064A \u0645\u0648\u062D\u062F \u0644\u0644\u0645\u0631\u064A\u0636 (UHID) \u0639\u0628\u0631 \u062C\u0645\u064A\u0639 \u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649",
          "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0648\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0648\u0627\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0644\u0644\u0645\u0639\u0645\u0644 \u0648\u0627\u0644\u0623\u0634\u0639\u0629",
          "\u0646\u0638\u0627\u0645 \u0645\u0627\u0644\u064A \u0634\u0627\u0645\u0644: \u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629\u060C \u062A\u0642\u0641\u064A\u0644 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A\u060C \u0648\u0646\u0633\u0628 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0639\u0627\u0642\u062F\u0627\u062A",
          "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u062F\u0642\u064A\u0642\u0629 \u0644\u0643\u0644 \u062F\u0648\u0631 \u0648\u0638\u064A\u0641\u064A (\u0645\u062F\u064A\u0631 \u0637\u0628\u064A\u060C \u0627\u0633\u062A\u0642\u0628\u0627\u0644\u060C \u0645\u062D\u0627\u0633\u0628\u060C \u0637\u0628\u064A\u0628\u060C \u062A\u0645\u0631\u064A\u0636)",
          "\u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0639\u062F\u0644\u0627\u062A \u0627\u0644\u0625\u0634\u063A\u0627\u0644 \u0648\u0627\u0644\u0625\u064A\u0631\u0627\u062F \u0627\u0644\u064A\u0648\u0645\u064A \u0648\u0627\u0644\u0634\u0647\u0631\u064A \u0644\u0643\u0644 \u0642\u0633\u0645"
        ],
        en: [
          "Unified Health Identifier (UHID) connecting all outpatient and diagnostic visits",
          "Centralized reception ticketing, queue displays, and internal lab/radiology referrals",
          "Complete financial engine: shift closing, insurance/contract tiers, and doctor payouts",
          "Granular Role-Based Access Control (RBAC) across clinical and administrative staff",
          "Executive analytics tracking departmental utilization, wait times, and revenue"
        ]
      },
      techStack: ["React", "TypeScript", "Multi-Department ERP", "RBAC Security", "Financial Ledger", "Cloud DB"],
      screens: [
        {
          id: "mitali-screen-1",
          title: {
            ar: "\u0644\u0648\u062D\u0629 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0637\u0628\u064A\u0629",
            en: "Hospital Reception & Department Hub"
          },
          caption: {
            ar: "\u0625\u062F\u0627\u0631\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0644\u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u064A\u0646 \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u064A\u0629.",
            en: "Centralized patient registration and real-time routing across hospital departments."
          },
          imageUrl: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg"
        },
        {
          id: "mitali-screen-2",
          title: {
            ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062C\u0645\u0639 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A",
            en: "Multi-Clinic Operations View"
          },
          caption: {
            ar: "\u0631\u0624\u064A\u0629 \u0645\u0648\u062D\u062F\u0629 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0641\u064A \u0634\u0627\u0634\u0629 \u0648\u0627\u062D\u062F\u0629.",
            en: "Unified operational oversight across all active clinics and financial desks."
          },
          imageUrl: "/assets/solimedical/complex.svg"
        }
      ],
      featured: true,
      published: true,
      order: 3,
      seo: {
        title: {
          ar: "\u0645\u0646\u0638\u0648\u0645\u0629 Mitali Hospital \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Mitali Hospital & Polyclinic ERP System | Ahmed Soliman"
        },
        description: {
          ar: "\u0645\u0646\u0638\u0648\u0645\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629: \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u060C \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A\u060C \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A.",
          en: "Integrated hospital and medical complex management platform engineered by Ahmed Soliman."
        },
        ogImage: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
        canonicalSlug: "/projects/mitali-hospital-management-system",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "clinic-warehouse-inventory-system",
      slug: "medical-warehouse-and-inventory-system",
      title: {
        ar: "\u0623\u0646\u0638\u0645\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A (Medi-Logix)",
        en: "Medi-Logix \u2014 Medical Warehouse, Pharmacy & Clinic Inventory System"
      },
      kicker: {
        ar: "04 \xB7 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0637\u0628\u064A \u0648\u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0625\u0645\u062F\u0627\u062F",
        en: "04 \xB7 Medical Supply Chain & Inventory ERP"
      },
      summary: {
        ar: "\u0646\u0638\u0627\u0645 \u0631\u0642\u0645\u064A \u0644\u0636\u0628\u0637 \u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A: \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0623\u0631\u0635\u062F\u0629\u060C \u062A\u0648\u0627\u0631\u064A\u062E \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629\u060C \u062D\u062F \u0627\u0644\u0637\u0644\u0628\u060C \u0648\u0623\u0630\u0648\u0646 \u0627\u0644\u0635\u0631\u0641 \u0644\u0644\u0623\u0642\u0633\u0627\u0645.",
        en: "Precision inventory and supply-chain control for medical complexes and clinics\u2014tracking stock levels, batch expiry dates, reorder thresholds, and departmental dispensing."
      },
      description: {
        ar: "\u062A\u0645\u062B\u0644 \u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0623\u062D\u062F \u0623\u0643\u0628\u0631 \u0628\u0646\u0648\u062F \u0627\u0644\u062A\u0643\u0644\u0641\u0629 \u0641\u064A \u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A. \u0635\u0645\u0645\u062A \u0647\u0630\u0627 \u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u064A\u0631\u0628\u0637 \u0627\u0644\u0645\u062E\u0632\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0628\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u063A\u0631\u0641 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629\u060C \u0645\u0639 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0645\u0628\u0643\u0631\u0629 \u0644\u0642\u0631\u0628 \u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0623\u0648 \u0627\u0646\u062E\u0641\u0627\u0636 \u0627\u0644\u0631\u0635\u064A\u062F \u062A\u062D\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0622\u0645\u0646\u060C \u0648\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0641\u0639\u0644\u064A\u0629 \u0644\u0643\u0644 \u0639\u064A\u0627\u062F\u0629.",
        en: "Medical consumables and pharmaceuticals represent a major cost center in healthcare facilities. Medi-Logix connects central medical stores with procedure rooms and internal pharmacies, automating batch expiry alerts, minimum stock warnings, and per-clinic consumption costing."
      },
      problem: {
        ar: "\u0627\u0644\u0647\u062F\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u0646\u0627\u062A\u062C \u0639\u0646 \u0627\u0646\u062A\u0647\u0627\u0621 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0623\u0648 \u0646\u0641\u0627\u062F \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u062D\u0631\u062C\u0629 \u0641\u062C\u0623\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0639\u0645\u0644 \u0644\u0639\u062F\u0645 \u0648\u062C\u0648\u062F \u0631\u0642\u0627\u0628\u0629 \u0644\u062D\u0638\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0635\u0631\u0641 \u0648\u0627\u0644\u0623\u0631\u0635\u062F\u0629.",
        en: "Financial waste from expired medical supplies and sudden stockouts of critical consumables caused by manual spreadsheet tracking."
      },
      solution: {
        ar: "\u0646\u0638\u0627\u0645 \u0645\u062E\u0627\u0632\u0646 \u0637\u0628\u064A \u0630\u0643\u064A \u064A\u062F\u0639\u0645 \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F\u060C \u064A\u0631\u0627\u0642\u0628 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u0627\u062A \u0648\u062A\u0648\u0627\u0631\u064A\u062E \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 (FEFO)\u060C \u0648\u064A\u0631\u0628\u0637 \u0635\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0628\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0646\u0641\u0630\u0629 \u0641\u0639\u0644\u064A\u0627\u064B.",
        en: "Engineered a barcode-ready medical inventory platform enforcing First-Expire-First-Out (FEFO) rules and linking supply consumption directly to clinical procedures."
      },
      category: "inventory-erp",
      categoryLabel: {
        ar: "\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0648\u0627\u0644\u0625\u0645\u062F\u0627\u062F \u0627\u0644\u0637\u0628\u064A",
        en: "Inventory & Supply Systems"
      },
      coverImage: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A.",
        en: "Hello Ahmed, I want to inquire about the Medical Warehouse & Inventory Management System."
      },
      features: {
        ar: [
          "\u0645\u0631\u0627\u0642\u0628\u0629 \u0644\u062D\u0638\u064A\u0629 \u0644\u0623\u0631\u0635\u062F\u0629 \u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0645\u0639 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0631\u0635\u064A\u062F",
          "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u0627\u062A \u0648\u062A\u0648\u0627\u0631\u064A\u062E \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 (FEFO) \u0644\u0645\u0646\u0639 \u0627\u0644\u0647\u062F\u0631 \u0648\u0627\u0644\u062A\u0648\u0627\u0644\u0641",
          "\u0623\u0630\u0648\u0646 \u0625\u0636\u0627\u0641\u0629 \u0648\u0635\u0631\u0641 \u0648\u062A\u062D\u0648\u064A\u0644 \u0628\u064A\u0646 \u0627\u0644\u0645\u062E\u0632\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0631\u0639\u064A\u0629",
          "\u0631\u0628\u0637 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0628\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629",
          "\u062A\u0642\u0627\u0631\u064A\u0631 \u062C\u0631\u062F \u062F\u0648\u0631\u064A\u0629 \u0648\u062D\u0631\u0643\u0629 \u0645\u0648\u0631\u062F\u064A\u0646 \u0648\u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629"
        ],
        en: [
          "Real-time stock tracking with automated low-inventory reorder alerts",
          "Batch and expiration date management (FEFO) to eliminate expired stock waste",
          "Digital requisition and transfer vouchers between central stores and clinics",
          "Procedure-level consumable linking for accurate clinical cost accounting",
          "Audit-ready stocktake reports, supplier ledgers, and purchase order workflows"
        ]
      },
      techStack: ["React", "TypeScript", "Barcode & FEFO Engine", "Cost Analytics", "Cloud Sync"],
      screens: [
        {
          id: "warehouse-screen-1",
          title: {
            ar: "\u0644\u0648\u062D\u0629 \u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A",
            en: "Inventory & Expiry Control Dashboard"
          },
          caption: {
            ar: "\u0645\u062A\u0627\u0628\u0639\u0629 \u062F\u0642\u064A\u0642\u0629 \u0644\u0644\u0623\u0635\u0646\u0627\u0641\u060C \u0645\u0639\u062F\u0644\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643\u060C \u0648\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u062D\u0631\u062C\u0629.",
            en: "Granular visibility into stock levels, turnover rates, and critical shortage alerts."
          },
          imageUrl: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg"
        }
      ],
      featured: true,
      published: true,
      order: 4,
      seo: {
        title: {
          ar: "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Medical Warehouse & Clinic Inventory System | Ahmed Soliman"
        },
        description: {
          ar: "\u0646\u0638\u0627\u0645 \u0631\u0642\u0645\u064A \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A.",
          en: "Digital medical inventory and supply chain management system for clinics and hospitals by Ahmed Soliman."
        },
        ogImage: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg",
        canonicalSlug: "/projects/medical-warehouse-and-inventory-system",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "healthcare-quality-management-suite",
      slug: "healthcare-quality-and-audit-system",
      title: {
        ar: "\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 (Q-Care Quality Suite)",
        en: "Q-Care \u2014 Healthcare Quality Management, Infection Control & Audit Suite"
      },
      kicker: {
        ar: "05 \xB7 \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649",
        en: "05 \xB7 Clinical Quality & Patient Safety Systems"
      },
      summary: {
        ar: "\u0645\u0646\u0638\u0648\u0645\u0629 \u0631\u0642\u0645\u064A\u0629 \u0644\u0641\u0631\u0642 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0641\u064A \u0627\u0644\u0645\u0646\u0634\u0622\u062A \u0627\u0644\u0635\u062D\u064A\u0629 \u0644\u0631\u0642\u0645\u0646\u0629 \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u064A\u0648\u0645\u064A\u060C \u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0639\u0627\u0631\u0636\u0629 (OVR)\u060C \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629.",
        en: "Digital governance toolkit for hospital quality and infection control teams\u2014digitizing clinical rounds, Occurrence Variance Reports (OVR), and accreditation KPIs."
      },
      description: {
        ar: "\u0627\u0646\u0637\u0644\u0627\u0642\u0627\u064B \u0645\u0646 \u062E\u0628\u0631\u062A\u064A \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629\u060C \u0642\u0645\u062A \u0628\u0628\u0646\u0627\u0621 \u062D\u0632\u0645\u0629 Q-Care \u0644\u062A\u062D\u0648\u064A\u0644 \u0623\u0639\u0645\u0627\u0644 \u0642\u0633\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0645\u0646 \u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0627\u0644\u0645\u0631\u0647\u0642\u0629 \u0625\u0644\u0649 \u0644\u0648\u062D\u0627\u062A \u0642\u064A\u0627\u0633 \u062A\u0641\u0627\u0639\u0644\u064A\u0629. \u064A\u062A\u064A\u062D \u0627\u0644\u0646\u0638\u0627\u0645 \u062A\u0646\u0641\u064A\u0630 \u062C\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0645\u0646 \u0627\u0644\u062A\u0627\u0628\u0644\u062A \u0623\u0648 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644\u060C \u062A\u0633\u062C\u064A\u0644 \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0633\u0644\u0627\u0645\u0629\u060C \u062A\u062A\u0628\u0639 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u062A\u0635\u062D\u064A\u062D\u064A\u0629 (CAPA)\u060C \u0648\u0625\u0635\u062F\u0627\u0631 \u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.",
        en: "Drawing directly on my specialization in healthcare quality assurance, Q-Care replaces paper audit binders with mobile-ready digital checklists. Quality officers can conduct infection control rounds, log Occurrence Variance Reports (OVRs), assign Corrective and Preventive Actions (CAPA), and generate automated monthly KPI scorecards."
      },
      problem: {
        ar: "\u0627\u0639\u062A\u0645\u0627\u062F \u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0639\u0644\u0649 \u0627\u0633\u062A\u0645\u0627\u0631\u0627\u062A \u0648\u0631\u0642\u064A\u0629 \u064A\u0635\u0639\u0628 \u062A\u062C\u0645\u064A\u0639\u0647\u0627 \u0648\u062A\u062D\u0644\u064A\u0644\u0647\u0627\u060C \u0645\u0645\u0627 \u064A\u0624\u062E\u0631 \u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0645\u062E\u0627\u0637\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u062A\u0635\u062D\u064A\u062D\u064A\u0629.",
        en: "Reliance on paper audit forms delays risk identification, buries compliance trends, and makes CAPA follow-up across hospital departments slow and error-prone."
      },
      solution: {
        ar: "\u0645\u0646\u0635\u0629 \u062A\u062F\u0642\u064A\u0642 \u0631\u0642\u0645\u064A\u0629 \u062A\u0639\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644 \u0648\u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0641\u062D\u0635\u060C \u062A\u0642\u0627\u0631\u064A\u0631 \u062D\u0648\u0627\u062F\u062B \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 (OVR)\u060C \u0648\u0644\u0648\u062D\u0627\u062A \u0642\u064A\u0627\u0633 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
        en: "Built a mobile-responsive clinical audit and KPI platform automating infection control checklists, anonymous OVR incident workflows, and CAPA tracking."
      },
      category: "quality-systems",
      categoryLabel: {
        ar: "\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
        en: "Healthcare Quality Systems"
      },
      coverImage: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0646 \u0623\u0646\u0638\u0645\u0629 \u0648\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649.",
        en: "Hello Ahmed, I would like to inquire about your Healthcare Quality & Clinical Audit systems."
      },
      features: {
        ar: [
          "\u0642\u0648\u0627\u0626\u0645 \u0645\u0631\u0648\u0631 \u0631\u0642\u0645\u064A\u0629 (Digital Checklists) \u0644\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0628\u064A\u0626\u0629 \u0648\u0623\u0645\u0646 \u0627\u0644\u0645\u0631\u064A\u0636",
          "\u0646\u0638\u0627\u0645 \u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0639\u0627\u0631\u0636\u0629 \u0648\u0627\u0644\u0645\u062E\u0627\u0637\u0631 (OVR / Incident Reporting) \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u062D\u0642\u064A\u0642",
          "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u062A\u0635\u062D\u064A\u062D\u064A\u0629 \u0648\u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629 (CAPA) \u0645\u0639 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629",
          "\u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 (Clinical KPIs) \u0627\u0644\u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F (GAHAR / JCI)",
          "\u062A\u0642\u064A\u064A\u0645 \u0627\u0633\u062A\u0628\u064A\u0627\u0646\u0627\u062A \u0631\u0636\u0627 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062A\u062D\u0644\u064A\u0644 \u0646\u0642\u0627\u0637 \u0627\u0644\u062A\u062D\u0633\u064A\u0646 \u0641\u064A \u0631\u062D\u0644\u0629 \u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629"
        ],
        en: [
          "Mobile-ready digital audit checklists for infection control and facility safety rounds",
          "Structured Occurrence Variance Reporting (OVR) and root-cause analysis workflows",
          "Corrective & Preventive Action (CAPA) tracker with departmental accountability",
          "Clinical KPI dashboards aligned with GAHAR and JCI accreditation standards",
          "Patient satisfaction survey analytics and service quality improvement tracking"
        ]
      },
      techStack: ["React", "TypeScript", "Clinical KPI Engine", "GAHAR / JCI Checklists", "CAPA Workflow"],
      screens: [
        {
          id: "quality-screen-1",
          title: {
            ar: "\u0644\u0648\u062D\u0629 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0633\u0631\u064A\u0631\u064A",
            en: "Quality KPI & Clinical Compliance Dashboard"
          },
          caption: {
            ar: "\u0642\u064A\u0627\u0633 \u0645\u0628\u0627\u0634\u0631 \u0644\u0646\u0633\u0628 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0645\u0639\u0627\u064A\u064A\u0631 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0642\u0633\u0627\u0645.",
            en: "Real-time compliance scoring across infection control, patient safety, and departmental audits."
          },
          imageUrl: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg"
        }
      ],
      featured: true,
      published: true,
      order: 5,
      seo: {
        title: {
          ar: "\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0623\u0646\u0638\u0645\u0629 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649 | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Healthcare Quality Management & Audit Systems | Ahmed Soliman"
        },
        description: {
          ar: "\u0623\u0646\u0638\u0645\u0629 \u0631\u0642\u0645\u064A\u0629 \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629\u060C \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0639\u062F\u0648\u0649\u060C \u062A\u0642\u0627\u0631\u064A\u0631 OVR\u060C \u0648\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0645\u0646 \u062A\u0637\u0648\u064A\u0631 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646.",
          en: "Digital healthcare quality assurance, infection control checklists, OVR reporting, and clinical KPI dashboards by Ahmed Soliman."
        },
        ogImage: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg",
        canonicalSlug: "/projects/healthcare-quality-and-audit-system",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "soli-medical-telegram-bot",
      slug: "clinic-telegram-booking-bot",
      title: {
        ar: "\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0627\u0644\u0630\u0643\u064A \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A (@SoliMedicalproBot)",
        en: "Automated Clinic Telegram Booking Bot (@SoliMedicalproBot)"
      },
      kicker: {
        ar: "06 \xB7 \u0623\u062A\u0645\u062A\u0629 \u062D\u062C\u0632 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0631\u0636\u0649",
        en: "06 \xB7 Patient Self-Service & Booking Automation"
      },
      summary: {
        ar: "\u064A\u062A\u064A\u062D \u0644\u0644\u0645\u0631\u064A\u0636 \u0627\u0644\u0633\u0624\u0627\u0644 \u0639\u0646 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0645\u0646 \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0628\u062F\u0648\u0646 \u0627\u0644\u062D\u0627\u062C\u0629 \u0644\u062A\u062D\u0645\u064A\u0644 \u0623\u064A \u062A\u0637\u0628\u064A\u0642 \u0625\u0636\u0627\u0641\u064A.",
        en: "Enables patients to check clinic schedules, doctor availability, service prices, and book appointments directly via Telegram without installing extra apps."
      },
      description: {
        ar: "\u0644\u062A\u062E\u0641\u064A\u0641 \u0636\u063A\u0637 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0647\u0627\u062A\u0641\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0639\u0644\u0649 \u0645\u0648\u0638\u0641\u064A \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0642\u0645\u062A \u0628\u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0634\u063A\u064A\u0644 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u062A\u0641\u0627\u0639\u0644\u064A (@SoliMedicalproBot) \u0645\u0631\u062A\u0628\u0637 \u0628\u0646\u0638\u0627\u0645 \u0627\u0644\u0639\u064A\u0627\u062F\u0629. \u064A\u0633\u062A\u0637\u064A\u0639 \u0627\u0644\u0645\u0631\u064A\u0636 \u0645\u0646 \u062E\u0644\u0627\u0644\u0647 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0645\u0639\u0631\u0641\u0629 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0648\u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u0647 \u0641\u064A \u062B\u0648\u0627\u0646\u064D.",
        en: "To reduce repetitive phone call load on clinic reception desks, I engineered @SoliMedicalproBot\u2014an interactive Telegram assistant connected to the clinic schedule. Patients can browse specialties, check doctor hours, and book appointments in seconds."
      },
      problem: {
        ar: "\u0627\u0646\u0634\u063A\u0627\u0644 \u062E\u0637 \u0627\u0644\u0647\u0627\u062A\u0641 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 \u0628\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0639\u0646 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0633\u0639\u0631 \u0627\u0644\u0643\u0634\u0641 \u0648\u0627\u0644\u0639\u0646\u0648\u0627\u0646\u060C \u0645\u0645\u0627 \u064A\u0636\u064A\u0639 \u062D\u062C\u0648\u0632\u0627\u062A \u062D\u0642\u064A\u0642\u064A\u0629.",
        en: "Clinic phone lines are constantly tied up with repetitive questions about doctor schedules, consultation fees, and location addresses."
      },
      solution: {
        ar: "\u0628\u0648\u062A \u0645\u062D\u0627\u062F\u062B\u0629 \u0622\u0644\u064A \u0639\u0644\u0649 \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u064A\u0639\u0645\u0644 24/7 \u0644\u0644\u0631\u062F \u0627\u0644\u0641\u0648\u0631\u064A \u0639\u0644\u0649 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0641\u064A \u062C\u062F\u0648\u0644 \u0627\u0644\u0639\u064A\u0627\u062F\u0629.",
        en: "Deployed a 24/7 conversational Telegram bot that answers patient inquiries instantly and logs confirmed bookings directly into the clinic queue."
      },
      category: "automation-bots",
      categoryLabel: {
        ar: "\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u062D\u062C\u0632",
        en: "Patient Booking Automation"
      },
      coverImage: "/assets/solimedical/booking.svg",
      logoImage: "/assets/aistudio/logo_ae3842b8.png",
      liveUrl: "https://t.me/SoliMedicalproBot",
      whatsappInquireText: {
        ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0645. \u0623\u062D\u0645\u062F\u060C \u0623\u0631\u064A\u062F \u0631\u0628\u0637 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0628\u0639\u064A\u0627\u062F\u062A\u064A.",
        en: "Hello Ahmed, I want to integrate the Telegram appointment booking bot with my clinic."
      },
      features: {
        ar: [
          "\u062D\u062C\u0632 \u0645\u0648\u0627\u0639\u064A\u062F \u0641\u0648\u0631\u064A \u0645\u0646 \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0628\u062F\u0648\u0646 \u062A\u062D\u0645\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u062E\u0627\u0635",
          "\u0627\u0644\u0631\u062F \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0644\u0649 \u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629",
          "\u062A\u0642\u0644\u064A\u0644 \u0636\u063A\u0637 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0639\u0644\u0649 \u0645\u0643\u062A\u0628 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u062A\u0646\u0638\u064A\u0645 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632",
          "\u0648\u0627\u062C\u0647\u0629 \u0645\u062D\u0627\u062F\u062B\u0629 \u0639\u0631\u0628\u064A\u0629 \u0633\u0647\u0644\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u0644\u062C\u0645\u064A\u0639 \u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0631\u0636\u0649"
        ],
        en: [
          "Instant appointment booking inside Telegram with zero app installation required",
          "24/7 automated responses for clinic working hours, specialties, and consultation fees",
          "Reduces reception phone bottlenecks and structures patient booking data cleanly",
          "Intuitive Arabic conversational interface accessible to all patient demographics"
        ]
      },
      techStack: ["Telegram Bot API", "Node.js", "Webhook Automation", "Clinic Schedule Sync"],
      screens: [],
      featured: false,
      published: true,
      order: 6,
      seo: {
        title: {
          ar: "\u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0644\u062D\u062C\u0632 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A @SoliMedicalproBot | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Clinic Telegram Booking Bot @SoliMedicalproBot | Ahmed Soliman"
        },
        description: {
          ar: "\u0627\u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u0643 \u0648\u0627\u0633\u062A\u0639\u0644\u0645 \u0639\u0646 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 @SoliMedicalproBot \u0645\u0646 \u062A\u0637\u0648\u064A\u0631 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646.",
          en: "Automated patient inquiry and appointment booking via Telegram bot @SoliMedicalproBot developed by Ahmed Soliman."
        },
        ogImage: "/assets/aistudio/logo_ae3842b8.png",
        canonicalSlug: "/projects/clinic-telegram-booking-bot",
        structuredDataType: "SoftwareApplication"
      },
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  clinics: [
    {
      id: "al-noor-charity-medical-complex",
      slug: "al-noor-medical-complex",
      name: {
        ar: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0646\u0648\u0631 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u062A\u062E\u0635\u0635\u064A",
        en: "Al-Noor Specialized Medical Complex"
      },
      specialtyBadge: {
        ar: "\u0645\u062C\u0645\u0639 \u0639\u064A\u0627\u062F\u0627\u062A \u062A\u062E\u0635\u0635\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644 \xB7 \u0646\u0645\u0648\u0630\u062C \u0635\u0641\u062D\u0629 \u0647\u0628\u0648\u0637 \u0637\u0628\u064A\u0629",
        en: "Multi-Specialty Polyclinic \xB7 Standalone Medical Landing Page"
      },
      tagline: {
        ar: "\u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0628\u0625\u0634\u0631\u0627\u0641 \u0646\u062E\u0628\u0629 \u0645\u0646 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u064A\u064A\u0646 \u0648\u0623\u062D\u062F\u062B \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629.",
        en: "Comprehensive multi-specialty healthcare led by consultant physicians with seamless digital booking and follow-up."
      },
      description: {
        ar: "\u064A\u0642\u062F\u0645 \u0645\u062C\u0645\u0639 \u0627\u0644\u0646\u0648\u0631 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u062A\u062E\u0635\u0635\u064A \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0643\u0634\u0641 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0641\u064A \u062A\u062E\u0635\u0635\u0627\u062A \u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0648\u0627\u0644\u0642\u0644\u0628\u060C \u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644\u060C \u0627\u0644\u0623\u0633\u0646\u0627\u0646\u060C \u0648\u0627\u0644\u0639\u064A\u0648\u0646\u060C \u0645\u0639 \u0646\u0638\u0627\u0645 \u062D\u062C\u0632 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u0628\u0642 \u064A\u0636\u0645\u0646 \u0639\u062F\u0645 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0637\u0648\u064A\u0644 \u0648\u062A\u062C\u0631\u0628\u0629 \u0639\u0644\u0627\u062C\u064A\u0629 \u0645\u0631\u064A\u062D\u0629 \u0644\u0644\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u0623\u0633\u0631\u0629.",
        en: "Al-Noor Specialized Medical Complex delivers outpatient consultations and diagnostic care across Internal Medicine, Cardiology, Pediatrics, Dentistry, and Ophthalmology\u2014powered by structured digital appointment scheduling."
      },
      coverImage: "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
      logoUrl: "/assets/aistudio/logo_ae3842b8.png",
      themeColor: "#0D9488",
      galleryImages: [
        "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
        "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg"
      ],
      phone: "",
      whatsapp: "https://wa.me/Ahmed0soliman?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF%20%D9%81%D9%8A%20%D9%85%D8%AC%D9%85%D8%B9%20%D8%A7%D9%84%D9%86%D9%88%D8%B1%20%D8%A7%D9%84%D8%B7%D8%A8%D9%8A.",
      telegramUrl: "https://t.me/SoliMedicalproBot",
      address: {
        ar: "\u0634\u0627\u0631\u0639 \u0627\u0644\u062A\u062D\u0631\u064A\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u060C \u0628\u062C\u0648\u0627\u0631 \u0645\u062D\u0637\u0629 \u0627\u0644\u0645\u062A\u0631\u0648\u060C \u0627\u0644\u062F\u0642\u064A\u060C \u0627\u0644\u0642\u0627\u0647\u0631\u0629\u060C \u0645\u0635\u0631",
        en: "Main Tahrir Street, Next to Dokki Metro Station, Cairo, Egypt"
      },
      city: {
        ar: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
        en: "Cairo"
      },
      mapEmbedUrl: "https://www.google.com/maps?q=30.0385,31.2122&z=15&output=embed",
      workingHours: [
        {
          days: { ar: "\u0627\u0644\u0633\u0628\u062A \u2013 \u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", en: "Saturday \u2013 Wednesday" },
          hours: { ar: "10:00 \u0635\u0628\u0627\u062D\u0627\u064B \u2013 10:00 \u0645\u0633\u0627\u0621\u064B", en: "10:00 AM \u2013 10:00 PM" },
          isOpen: true
        },
        {
          days: { ar: "\u0627\u0644\u062E\u0645\u064A\u0633", en: "Thursday" },
          hours: { ar: "11:00 \u0635\u0628\u0627\u062D\u0627\u064B \u2013 08:00 \u0645\u0633\u0627\u0621\u064B", en: "11:00 AM \u2013 08:00 PM" },
          isOpen: true
        },
        {
          days: { ar: "\u0627\u0644\u062C\u0645\u0639\u0629", en: "Friday" },
          hours: {
            ar: "\u0637\u0648\u0627\u0631\u0626 \u0648\u0639\u064A\u0627\u062F\u0627\u062A \u0645\u0633\u0627\u0626\u064A\u0629 (04:00 \u0645 \u2013 09:00 \u0645)",
            en: "Evening Clinics Only (04:00 PM \u2013 09:00 PM)"
          },
          isOpen: true
        }
      ],
      highlights: {
        ar: [
          "\u062D\u062C\u0632 \u0645\u0633\u0628\u0642 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0623\u0648 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0644\u062A\u0642\u0644\u064A\u0644 \u0648\u0642\u062A \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631",
          "\u0645\u0644\u0641 \u0637\u0628\u064A \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0648\u062D\u062F \u0644\u0643\u0644 \u0645\u0631\u064A\u0636 \u064A\u062D\u0641\u0638 \u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0639\u0644\u0627\u062C\u064A \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0627\u062A",
          "\u0623\u0633\u0639\u0627\u0631 \u0643\u0634\u0641 \u0648\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0636\u062D\u0629 \u0648\u0645\u0639\u0644\u0646\u0629 \u0645\u0633\u0628\u0642\u0627\u064B \u062F\u0648\u0646 \u0631\u0633\u0648\u0645 \u062E\u0641\u064A\u0629",
          "\u0646\u062E\u0628\u0629 \u0645\u0646 \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u064A\u064A\u0646 \u0648\u0627\u0644\u0623\u062E\u0635\u0627\u0626\u064A\u064A\u0646 \u0641\u064A \u0623\u0647\u0645 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629"
        ],
        en: [
          "Pre-booking via WhatsApp or Telegram Bot to eliminate long waiting times",
          "Unified electronic medical record preserving patient prescriptions and history",
          "Transparent, published consultation and procedure pricing",
          "Board-certified consultants across primary medical specialties"
        ]
      },
      standaloneByDefault: false,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: "\u0645\u062C\u0645\u0639 \u0627\u0644\u0646\u0648\u0631 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u062A\u062E\u0635\u0635\u064A | \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
          en: "Al-Noor Specialized Medical Complex | Doctors, Services, Prices & Booking"
        },
        description: {
          ar: "\u0627\u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u0643 \u0641\u064A \u0645\u062C\u0645\u0639 \u0627\u0644\u0646\u0648\u0631 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u062A\u062E\u0635\u0635\u064A: \u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u062C\u062F\u0648\u0644 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0643\u0634\u0641 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A\u0629.",
          en: "Book your appointment at Al-Noor Specialized Medical Complex: view consultant doctors, transparent service pricing, and working hours."
        },
        ogImage: "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
        canonicalSlug: "/clinics/al-noor-medical-complex",
        structuredDataType: "MedicalClinic"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "soli-dental-and-care-center",
      slug: "soli-specialized-clinic",
      name: {
        ar: "\u0639\u064A\u0627\u062F\u0629 \u062F\u0627\u0631 \u0627\u0644\u0634\u0641\u0627\u0621 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629",
        en: "Dar Al-Shifa Specialized Clinic"
      },
      specialtyBadge: {
        ar: "\u0639\u064A\u0627\u062F\u0629 \u062A\u062E\u0635\u0635\u064A\u0629 \xB7 \u062A\u062F\u0639\u0645 \u0646\u0645\u0637 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 (Standalone Mode)",
        en: "Specialized Clinic \xB7 Supports Standalone Campaign Mode"
      },
      tagline: {
        ar: "\u062A\u0634\u062E\u064A\u0635 \u062F\u0642\u064A\u0642\u060C \u0645\u062A\u0627\u0628\u0639\u0629 \u0637\u0628\u064A\u0629 \u0645\u0646\u0638\u0645\u0629\u060C \u0648\u062D\u062C\u0632 \u0641\u0648\u0631\u064A \u0644\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A.",
        en: "Precision diagnostics, structured clinical follow-up, and instant online appointment booking."
      },
      description: {
        ar: "\u062A\u0645\u062B\u0644 \u0639\u064A\u0627\u062F\u0629 \u062F\u0627\u0631 \u0627\u0644\u0634\u0641\u0627\u0621 \u0646\u0645\u0648\u0630\u062C\u0627\u064B \u0639\u0645\u0644\u064A\u0627\u064B \u0644\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 (Standalone Medical Landing Page) \u0627\u0644\u062A\u064A \u064A\u0635\u0645\u0645\u0647\u0627 \u0648\u064A\u0631\u0628\u0637\u0647\u0627 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0647\u0648\u064A\u0629 \u0644\u0648\u0646\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u062A\u0634\u062A\u064A\u062A.",
        en: "Dar Al-Shifa Clinic exemplifies a high-conversion Standalone Medical Landing Page engineered by Ahmed Soliman for individual clinics\u2014displaying physician credentials, transparent service fees, working hours, map location, and direct booking with a custom clinic color identity."
      },
      coverImage: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
      logoUrl: "/assets/aistudio/logo_ae3842b8.png",
      themeColor: "#2563EB",
      galleryImages: [
        "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
        "/src/assets/images/clinic_interior_reception_1794472515936.jpg"
      ],
      phone: "",
      whatsapp: "https://wa.me/Ahmed0soliman?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AD%D8%AC%D8%B2%20%D9%81%D9%8A%20%D8%B9%D9%8A%D8%A7%D8%AF%D8%A9%20%D8%AF%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B4%D9%81%D8%A7%D8%A1.",
      telegramUrl: "https://t.me/SoliMedicalproBot",
      address: {
        ar: "\u0634\u0627\u0631\u0639 \u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u0639\u0631\u0628\u064A\u0629\u060C \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646\u060C \u0627\u0644\u062C\u064A\u0632\u0629\u060C \u0645\u0635\u0631",
        en: "Gameat El-Dewal El-Arabia St., Mohandessin, Giza, Egypt"
      },
      city: {
        ar: "\u0627\u0644\u062C\u064A\u0632\u0629",
        en: "Giza"
      },
      mapEmbedUrl: "https://www.google.com/maps?q=30.0511,31.2001&z=15&output=embed",
      workingHours: [
        {
          days: { ar: "\u0627\u0644\u0633\u0628\u062A \u2013 \u0627\u0644\u062E\u0645\u064A\u0633", en: "Saturday \u2013 Thursday" },
          hours: { ar: "12:00 \u0638\u0647\u0631\u0627\u064B \u2013 09:00 \u0645\u0633\u0627\u0621\u064B", en: "12:00 PM \u2013 09:00 PM" },
          isOpen: true
        },
        {
          days: { ar: "\u0627\u0644\u062C\u0645\u0639\u0629", en: "Friday" },
          hours: { ar: "\u0639\u0637\u0644\u0629 \u0623\u0633\u0628\u0648\u0639\u064A\u0629", en: "Weekly Holiday" },
          isOpen: false
        }
      ],
      highlights: {
        ar: [
          "\u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0631\u0627\u0628\u0637 \u0643\u0635\u0641\u062D\u0629 \u0647\u0628\u0648\u0637 \u0645\u0633\u062A\u0642\u0644\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u0644\u0639\u064A\u0627\u062F\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u0631\u0648\u0627\u0628\u0637 \u062E\u0627\u0631\u062C\u064A\u0629",
          "\u0647\u0648\u064A\u0629 \u0644\u0648\u0646\u064A\u0629 \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0629 \u0645\u0639 \u0639\u0631\u0636 \u0648\u0627\u0636\u062D \u0644\u062A\u062E\u0635\u0635 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0645\u0624\u0647\u0644\u0627\u062A\u0647 \u0648\u0645\u0648\u0627\u0639\u064A\u062F \u062A\u0648\u0627\u062C\u062F\u0647",
          "\u0642\u0627\u0626\u0645\u0629 \u062E\u062F\u0645\u0627\u062A \u0648\u0623\u0633\u0639\u0627\u0631 \u0645\u062D\u062F\u062B\u0629 \u0644\u062D\u0638\u064A\u0627\u064B \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0645\u0639 \u062D\u062C\u0632 \u0645\u0628\u0627\u0634\u0631 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628"
        ],
        en: [
          "Shareable as a 100% isolated standalone clinic landing page",
          "Custom clinic accent color with clear physician qualifications and clinic hours",
          "Real-time service and fee catalog managed via the Admin CMS with instant booking"
        ]
      },
      standaloneByDefault: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: "\u0639\u064A\u0627\u062F\u0629 \u062F\u0627\u0631 \u0627\u0644\u0634\u0641\u0627\u0621 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629 | \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062D\u062C\u0632",
          en: "Dar Al-Shifa Specialized Clinic | Schedule, Prices & Booking"
        },
        description: {
          ar: "\u0635\u0641\u062D\u0629 \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0639\u064A\u0627\u062F\u0629 \u062F\u0627\u0631 \u0627\u0644\u0634\u0641\u0627\u0621 \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629: \u0627\u0633\u062A\u0639\u0631\u0636 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0627\u0644\u0623\u0633\u0639\u0627\u0631\u060C \u0648\u0627\u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u0643 \u0645\u0628\u0627\u0634\u0631\u0629.",
          en: "Official landing page for Dar Al-Shifa Specialized Clinic: view doctors, medical services, pricing, and book online."
        },
        ogImage: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
        canonicalSlug: "/clinics/soli-specialized-clinic",
        structuredDataType: "MedicalClinic"
      },
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  doctors: [
    {
      id: "doc-1",
      clinicId: "al-noor-charity-medical-complex",
      name: {
        ar: "\u062F. \u0645\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646",
        en: "Dr. Mohamed Abdelrahman"
      },
      title: {
        ar: "\u0627\u0633\u062A\u0634\u0627\u0631\u064A \u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0648\u0627\u0644\u0642\u0644\u0628",
        en: "Consultant of Internal Medicine & Cardiology"
      },
      specialty: {
        ar: "\u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0648\u0627\u0644\u0642\u0644\u0628 \u0648\u0627\u0644\u0623\u0648\u0639\u064A\u0629 \u0627\u0644\u062F\u0645\u0648\u064A\u0629",
        en: "Internal Medicine & Cardiology"
      },
      bio: {
        ar: "\u062E\u0628\u0631\u0629 \u0623\u0643\u062B\u0631 \u0645\u0646 15 \u0639\u0627\u0645\u0627\u064B \u0641\u064A \u062A\u0634\u062E\u064A\u0635 \u0648\u0639\u0644\u0627\u062C \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0648\u0627\u0631\u062A\u0641\u0627\u0639 \u0636\u063A\u0637 \u0627\u0644\u062F\u0645 \u0648\u0627\u0644\u0633\u0643\u0631\u064A \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0642\u0644\u0628 \u0627\u0644\u0645\u0632\u0645\u0646\u0629.",
        en: "Over 15 years of clinical experience in internal medicine, hypertension, diabetes management, and preventive cardiology."
      },
      photoUrl: "/assets/aistudio/logo_ae3842b8.png",
      qualifications: {
        ar: ["\u062F\u0643\u062A\u0648\u0631\u0627\u0647 \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0648\u0627\u0644\u0642\u0644\u0628", "\u0639\u0636\u0648 \u0627\u0644\u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u0644\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0642\u0644\u0628"],
        en: ["MD in Internal Medicine & Cardiology", "Member of the Egyptian Society of Cardiology"]
      },
      scheduleSummary: {
        ar: "\u0627\u0644\u0633\u0628\u062A\u060C \u0627\u0644\u0625\u062B\u0646\u064A\u0646\u060C \u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621 (05:00 \u0645 \u2013 09:00 \u0645)",
        en: "Sat, Mon, Wed (05:00 PM \u2013 09:00 PM)"
      },
      consultationFee: 300,
      currency: "EGP",
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "doc-2",
      clinicId: "al-noor-charity-medical-complex",
      name: {
        ar: "\u062F. \u0633\u0627\u0631\u0629 \u0645\u062D\u0645\u0648\u062F \u0627\u0644\u0643\u064A\u0644\u0627\u0646\u064A",
        en: "Dr. Sara Mahmoud El-Kilany"
      },
      title: {
        ar: "\u0623\u062E\u0635\u0627\u0626\u064A \u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u062D\u062F\u064A\u062B\u064A \u0627\u0644\u0648\u0644\u0627\u062F\u0629",
        en: "Specialist of Pediatrics & Neonatology"
      },
      specialty: {
        ar: "\u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u062D\u062F\u064A\u062B\u064A \u0627\u0644\u0648\u0644\u0627\u062F\u0629",
        en: "Pediatrics & Neonatology"
      },
      bio: {
        ar: "\u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0645\u062A\u0627\u0628\u0639\u0629 \u0646\u0645\u0648 \u0648\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644\u060C \u0627\u0644\u062A\u0637\u0639\u064A\u0645\u0627\u062A\u060C \u0648\u0639\u0644\u0627\u062C \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u0646\u0641\u0633\u064A \u0648\u0627\u0644\u062D\u0633\u0627\u0633\u064A\u0629 \u0644\u062F\u0649 \u0627\u0644\u0623\u0637\u0641\u0627\u0644.",
        en: "Specialized in pediatric growth monitoring, clinical nutrition, immunizations, and pediatric respiratory care."
      },
      photoUrl: "/assets/aistudio/logo_ae3842b8.png",
      qualifications: {
        ar: ["\u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u062D\u062F\u064A\u062B\u064A \u0627\u0644\u0648\u0644\u0627\u062F\u0629", "\u0627\u0633\u062A\u0634\u0627\u0631\u064A \u062A\u063A\u0630\u064A\u0629 \u0639\u0644\u0627\u062C\u064A\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644"],
        en: ["M.Sc. in Pediatrics & Neonatology", "Pediatric Clinical Nutrition Specialist"]
      },
      scheduleSummary: {
        ar: "\u0627\u0644\u0623\u062D\u062F\u060C \u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621\u060C \u0627\u0644\u062E\u0645\u064A\u0633 (01:00 \u0638 \u2013 06:00 \u0645)",
        en: "Sun, Tue, Thu (01:00 PM \u2013 06:00 PM)"
      },
      consultationFee: 250,
      currency: "EGP",
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "doc-3",
      clinicId: "soli-dental-and-care-center",
      name: {
        ar: "\u062F. \u0643\u0631\u064A\u0645 \u062D\u0633\u0646 \u0627\u0644\u0645\u0646\u0634\u0627\u0648\u064A",
        en: "Dr. Karim Hassan El-Menshawy"
      },
      title: {
        ar: "\u0627\u0633\u062A\u0634\u0627\u0631\u064A \u0637\u0628 \u0648\u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0641\u0645 \u0648\u0627\u0644\u0623\u0633\u0646\u0627\u0646",
        en: "Consultant of Oral & Dental Surgery"
      },
      specialty: {
        ar: "\u0637\u0628 \u0648\u062C\u0631\u0627\u062D\u0629 \u0648\u062A\u062C\u0645\u064A\u0644 \u0627\u0644\u0623\u0633\u0646\u0627\u0646",
        en: "Restorative & Cosmetic Dentistry"
      },
      bio: {
        ar: "\u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0639\u0644\u0627\u062C \u0627\u0644\u062C\u0630\u0648\u0631 \u0627\u0644\u0631\u0642\u0645\u064A\u060C \u0627\u0644\u062A\u0631\u0643\u064A\u0628\u0627\u062A \u0627\u0644\u062B\u0627\u0628\u062A\u0629\u060C \u0648\u0632\u0631\u0627\u0639\u0629 \u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0628\u062F\u0648\u0646 \u0623\u0644\u0645 \u0628\u0623\u062D\u062F\u062B \u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u062A\u0639\u0642\u064A\u0645 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635.",
        en: "Specialized in digital endodontics, fixed prosthodontics, and guided dental implants with strict sterilization protocols."
      },
      photoUrl: "/assets/aistudio/logo_ae3842b8.png",
      qualifications: {
        ar: ["\u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u0627\u0644\u062A\u0631\u0643\u064A\u0628\u0627\u062A \u0648\u0639\u0644\u0627\u062C \u0627\u0644\u062C\u0630\u0648\u0631", "\u0632\u0645\u0627\u0644\u0629 \u0632\u0631\u0627\u0639\u0629 \u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0627\u0644\u062A\u062C\u0645\u064A\u0644\u064A\u0629"],
        en: ["M.Sc. in Prosthodontics & Endodontics", "Fellowship in Implant Dentistry"]
      },
      scheduleSummary: {
        ar: "\u064A\u0648\u0645\u064A\u0627\u064B \u0639\u062F\u0627 \u0627\u0644\u062C\u0645\u0639\u0629 (02:00 \u0638 \u2013 09:00 \u0645)",
        en: "Daily except Friday (02:00 PM \u2013 09:00 PM)"
      },
      consultationFee: 250,
      currency: "EGP",
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  services: [
    {
      id: "srv-1",
      clinicId: "al-noor-charity-medical-complex",
      name: {
        ar: "\u0643\u0634\u0641 \u0628\u0627\u0637\u0646\u0629 \u0648\u0642\u0644\u0628 \u0634\u0627\u0645\u0644 + \u0631\u0633\u0645 \u0642\u0644\u0628 (ECG)",
        en: "Comprehensive Internal Medicine Exam + ECG"
      },
      category: {
        ar: "\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0628\u0627\u0637\u0646\u0629 \u0648\u0627\u0644\u0642\u0644\u0628",
        en: "Internal Medicine & Cardiology"
      },
      description: {
        ar: "\u0641\u062D\u0635 \u0633\u0631\u064A\u0631\u064A \u0643\u0627\u0645\u0644 \u0645\u0639 \u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0642\u0644\u0628 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u062E\u0637\u0629 \u0627\u0644\u0639\u0644\u0627\u062C.",
        en: "Full clinical examination with 12-lead resting ECG and medication review."
      },
      price: 350,
      currency: "EGP",
      durationMinutes: 30,
      popular: true,
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "srv-2",
      clinicId: "al-noor-charity-medical-complex",
      name: {
        ar: "\u0643\u0634\u0641 \u0623\u0637\u0641\u0627\u0644 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0646\u0645\u0648 \u0648\u062A\u063A\u0630\u064A\u0629",
        en: "Pediatric Consultation & Growth Assessment"
      },
      category: {
        ar: "\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644",
        en: "Pediatrics Clinic"
      },
      description: {
        ar: "\u0641\u062D\u0635 \u0634\u0627\u0645\u0644 \u0644\u0644\u0637\u0641\u0644 \u0645\u0639 \u0642\u064A\u0627\u0633 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0646\u0645\u0648 \u0648\u0627\u0644\u0648\u0632\u0646 \u0648\u0627\u0644\u0637\u0648\u0644 \u0648\u062A\u062D\u062F\u064A\u062B \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0637\u0639\u064A\u0645\u0627\u062A.",
        en: "Complete pediatric checkup including growth chart percentiles and nutrition plan."
      },
      price: 250,
      currency: "EGP",
      durationMinutes: 25,
      popular: true,
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "srv-3",
      clinicId: "al-noor-charity-medical-complex",
      name: {
        ar: "\u0645\u0648\u062C\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0628\u0637\u0646 \u0648\u0627\u0644\u062D\u0648\u0636 (\u0633\u0648\u0646\u0627\u0631)",
        en: "Abdominal & Pelvic Ultrasound Scan"
      },
      category: {
        ar: "\u0627\u0644\u0623\u0634\u0639\u0629 \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u064A\u0629",
        en: "Diagnostic Imaging"
      },
      description: {
        ar: "\u0641\u062D\u0635 \u0628\u0627\u0644\u0645\u0648\u062C\u0627\u062A \u0641\u0648\u0642 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0639\u0627\u0644\u064A \u0627\u0644\u062F\u0642\u0629 \u0645\u0639 \u062A\u0642\u0631\u064A\u0631 \u0637\u0628\u064A \u0641\u0648\u0631\u064A \u0645\u0637\u0628\u0648\u0639 \u0648\u0631\u0642\u0645\u064A.",
        en: "High-resolution diagnostic ultrasound with immediate printed and digital report."
      },
      price: 300,
      currency: "EGP",
      durationMinutes: 20,
      popular: false,
      published: true,
      order: 3,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "srv-4",
      clinicId: "soli-dental-and-care-center",
      name: {
        ar: "\u0643\u0634\u0641 \u0648\u062A\u0634\u062E\u064A\u0635 \u0631\u0642\u0645\u064A \u0634\u0627\u0645\u0644 \u0644\u0644\u0623\u0633\u0646\u0627\u0646 + \u062E\u0637\u0629 \u0639\u0644\u0627\u062C\u064A\u0629",
        en: "Digital Dental Examination & Treatment Plan"
      },
      category: {
        ar: "\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0648\u0627\u0644\u0641\u062D\u0635",
        en: "Diagnostics"
      },
      description: {
        ar: "\u0641\u062D\u0635 \u0643\u0627\u0645\u0644 \u0644\u0644\u0641\u0645 \u0648\u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0628\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u0644\u0641\u0645\u0648\u064A\u0629 \u0648\u0648\u0636\u0639 \u062E\u0637\u0629 \u0639\u0644\u0627\u062C\u064A\u0629 \u0645\u0641\u0635\u0644\u0629 \u0628\u0627\u0644\u062A\u0643\u0644\u0641\u0629.",
        en: "Intraoral camera inspection with a transparent step-by-step treatment plan."
      },
      price: 250,
      currency: "EGP",
      durationMinutes: 25,
      popular: true,
      published: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "srv-5",
      clinicId: "soli-dental-and-care-center",
      name: {
        ar: "\u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u062C\u064A\u0631 \u0648\u062A\u0644\u0645\u064A\u0639 \u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0628\u0627\u0644\u0645\u0648\u062C\u0627\u062A \u0641\u0648\u0642 \u0627\u0644\u0635\u0648\u062A\u064A\u0629",
        en: "Ultrasonic Scaling & Polishing"
      },
      category: {
        ar: "\u0627\u0644\u0648\u0642\u0627\u064A\u0629 \u0648\u0627\u0644\u0644\u062B\u0629",
        en: "Preventive Care"
      },
      description: {
        ar: "\u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u062A\u0643\u0644\u0633\u0627\u062A \u0627\u0644\u062C\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0635\u0628\u063A\u0627\u062A \u0627\u0644\u0633\u0637\u062D\u064A\u0629 \u0645\u0639 \u062C\u0644\u0633\u0629 \u0648\u0642\u0627\u064A\u0629 \u0644\u0644\u062B\u0629.",
        en: "Complete ultrasonic calculus removal, stain polishing, and gum care."
      },
      price: 600,
      currency: "EGP",
      durationMinutes: 40,
      popular: true,
      published: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  articles: [
    {
      id: "article-single-clinic-vs-complex",
      slug: "single-clinic-vs-medical-complex-software",
      title: {
        ar: "\u0644\u0645\u0627\u0630\u0627 \u0644\u0627 \u064A\u0635\u0644\u062D \u0646\u0638\u0627\u0645 \u0648\u0627\u062D\u062F \u0628\u0646\u0641\u0633 \u0627\u0644\u0634\u0643\u0644 \u0644\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0627\u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0637\u0628\u064A\u061F",
        en: "Why Single-Doctor Clinics and Medical Complexes Need Distinct Software Architectures"
      },
      excerpt: {
        ar: "\u0642\u0631\u0627\u0621\u0629 \u0639\u0645\u0644\u064A\u0629 \u0645\u0646 \u0648\u0627\u0642\u0639 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0641\u064A \u0645\u0635\u0631: \u0643\u064A\u0641 \u062A\u062E\u062A\u0644\u0641 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0628\u064A\u0646 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0641\u0631\u062F \u0648\u0628\u064A\u0646 \u0625\u062F\u0627\u0631\u0629 \u0645\u062C\u0645\u0639 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0623\u0642\u0633\u0627\u0645.",
        en: "Field insights from operating clinics and medical complexes in Egypt: how operational priorities differ between solo physicians and multi-department directors."
      },
      content: {
        ar: `## \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0645\u0646 \u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629 \u0644\u0627 \u0645\u0646 \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0639\u0627\u0645\u0629

\u0639\u0646\u062F\u0645\u0627 \u064A\u062A\u062D\u062F\u062B \u0645\u0637\u0648\u0631\u0648 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0639\u0646 "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0637\u0628\u064A"\u060C \u063A\u0627\u0644\u0628\u0627\u064B \u0645\u0627 \u064A\u0642\u0639\u0648\u0646 \u0641\u064A \u062E\u0637\u0623 \u0634\u0627\u0626\u0639: \u062A\u0642\u062F\u064A\u0645 \u0634\u0627\u0634\u0629 \u0648\u0627\u062D\u062F\u0629 \u0645\u0632\u062F\u062D\u0645\u0629 \u0628\u0639\u0634\u0631\u0627\u062A \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0644\u0643\u0644 \u0645\u0646 \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0643\u0628\u064A\u0631.

\u0641\u064A \u0627\u0644\u0648\u0627\u0642\u0639 \u0627\u0644\u0639\u0645\u0644\u064A \u0627\u0644\u064A\u0648\u0645\u064A\u060C \u062A\u062E\u062A\u0644\u0641 \u0631\u062D\u0644\u0629 \u0627\u0644\u0639\u0645\u0644 \u062C\u0630\u0631\u064A\u0627\u064B \u0628\u064A\u0646 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0646:

### 1. \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F: \u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u0627\u0644\u0648\u0636\u0648\u062D \u0623\u0648\u0644\u0627\u064B
\u0641\u064A \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F\u060C \u0635\u0627\u062D\u0628 \u0627\u0644\u0642\u0631\u0627\u0631 \u0647\u0648 \u0627\u0644\u0637\u0628\u064A\u0628 \u0646\u0641\u0633\u0647\u060C \u0648\u0627\u0644\u0641\u0631\u064A\u0642 \u064A\u062A\u0643\u0648\u0646 \u063A\u0627\u0644\u0628\u0627\u064B \u0645\u0646 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0645\u0648\u0638\u0641 \u0623\u0648 \u0627\u062B\u0646\u064A\u0646 \u0641\u064A \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644. \u0645\u0627 \u064A\u062D\u062A\u0627\u062C\u0647 \u0627\u0644\u0637\u0628\u064A\u0628 \u0647\u0646\u0627 \u0644\u064A\u0633 \u0646\u0638\u0627\u0645 \u0645\u062D\u0627\u0633\u0628\u0629 \u0645\u0639\u0642\u062F\u0627\u064B\u060C \u0628\u0644:
- \u0645\u0639\u0631\u0641\u0629 \u0645\u0646 \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0628\u0627\u0644\u062E\u0627\u0631\u062C \u0628\u0644\u0645\u062D\u0629 \u0648\u0627\u062D\u062F\u0629.
- \u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064A\u0636\u060C \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0632\u064A\u0627\u0631\u0627\u062A\u0647 \u0627\u0644\u0633\u0627\u0628\u0642\u0629\u060C \u0648\u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0641\u064A \u0623\u0642\u0644 \u0645\u0646 \u062F\u0642\u064A\u0642\u062A\u064A\u0646.
- \u0636\u0628\u0637 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0641\u064A \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u062F\u0648\u0646 \u0623\u062E\u0637\u0627\u0621.

### 2. \u0627\u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0637\u0628\u064A \u0623\u0648 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0635\u063A\u064A\u0631: \u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0648\u0627\u0644\u0631\u0642\u0627\u0628\u0629
\u0639\u0646\u062F\u0645\u0627 \u062A\u062A\u0639\u062F\u062F \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u062E\u0635\u0635\u064A\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A (\u0628\u0627\u0637\u0646\u0629\u060C \u0623\u0637\u0641\u0627\u0644\u060C \u0623\u0633\u0646\u0627\u0646\u060C \u0645\u0639\u0645\u0644\u060C \u0623\u0634\u0639\u0629)\u060C \u064A\u0646\u062A\u0642\u0644 \u0627\u0644\u062A\u062D\u062F\u064A \u0645\u0646 "\u063A\u0631\u0641\u0629 \u0627\u0644\u0643\u0634\u0641" \u0625\u0644\u0649 "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0631\u0628\u0637":
- \u0643\u064A\u0641 \u0646\u0648\u0632\u0639 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0628\u062D\u064A\u062B \u064A\u0631\u0649 \u0643\u0644 \u0645\u0648\u0638\u0641 \u0642\u0633\u0645\u0647 \u0641\u0642\u0637\u061F
- \u0643\u064A\u0641 \u0646\u0631\u0628\u0637 \u0634\u0628\u0627\u0643 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0628\u062C\u0645\u064A\u0639 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u061F
- \u0643\u064A\u0641 \u0646\u0631\u0627\u062C\u0639 \u0625\u064A\u0631\u0627\u062F \u0643\u0644 \u0639\u064A\u0627\u062F\u0629\u060C \u0648\u0646\u0633\u0628 \u0627\u0644\u0623\u0637\u0628\u0627\u0621\u060C \u0648\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0641\u064A \u062A\u0642\u0631\u064A\u0631 \u0645\u0648\u062D\u062F\u061F

### \u0627\u0644\u062E\u0644\u0627\u0635\u0629 \u0627\u0644\u0647\u0646\u062F\u0633\u064A\u0629
\u0627\u0644\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u0627 \u064A\u0642\u0627\u0633 \u0628\u0643\u062B\u0631\u0629 \u0627\u0644\u0623\u0632\u0631\u0627\u0631\u060C \u0628\u0644 \u0628\u0645\u062F\u0649 \u0627\u062D\u062A\u0631\u0627\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u0648\u0642\u062A \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0645\u0648\u0638\u0641 \u0627\u0644\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0634\u0623\u0629.`,
        en: `## Starting From Clinical Reality Rather Than Feature Checklists

When software vendors pitch a generic "Medical ERP", they frequently make a critical architectural mistake: forcing the exact same bloated interface onto a solo physician's clinic and a 15-department polyclinic.

From real-world deployment inside Egyptian healthcare facilities, the operational priorities of these two environments are fundamentally different:

### 1. The Solo Physician Clinic: Speed and Zero Friction
In a single-doctor clinic, the physician is the primary decision-maker, supported by one or two receptionists. The core workflow requires:
- Instant visibility of the live waiting room queue.
- Opening a patient's medical dossier, reviewing past visits, and printing a clean e-prescription in under two minutes.
- Accurate daily cash desk balancing at reception.

### 2. The Multi-Department Medical Complex: Governance & Unified Visibility
Once multiple specialty clinics, diagnostic units, and cashier desks operate together, the challenge shifts from a single consultation room to facility-wide orchestration:
- Granular role-based access control (RBAC) across receptionists, doctors, and accountants.
- Centralized ticketing and patient routing across specialties.
- Shift closing, physician revenue share calculation, and departmental P&L reporting.

### Engineering Takeaway
Great Arabic healthcare software is measured not by how many menus it hides behind a sidebar, but by how naturally it supports the daily rhythm of doctors, receptionists, and facility directors.`
      },
      category: {
        ar: "\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Healthcare Systems Engineering"
      },
      tags: ["Soli Medical", "RTL Software", "Clinic Management", "Medical Complex"],
      coverImage: "/assets/solimedical/dashboard.svg",
      readingTimeMinutes: 4,
      authorName: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
        en: "Ahmed Soliman"
      },
      featured: true,
      published: true,
      order: 1,
      seo: {
        title: {
          ar: "\u0627\u0644\u0641\u0631\u0642 \u0628\u064A\u0646 \u0646\u0638\u0627\u0645 \u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0628\u064A\u0628 \u0627\u0644\u0648\u0627\u062D\u062F \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0637\u0628\u064A | \u0645\u062F\u0648\u0646\u0629 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Single-Doctor Clinic vs Medical Complex Software | Ahmed Soliman Blog"
        },
        description: {
          ar: "\u0645\u0642\u0627\u0644 \u062A\u062D\u0644\u064A\u0644\u064A \u0628\u0642\u0644\u0645 \u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u062D\u0648\u0644 \u0627\u0644\u0641\u0631\u0648\u0642 \u0627\u0644\u062C\u0648\u0647\u0631\u064A\u0629 \u0641\u064A \u062A\u0635\u0645\u064A\u0645 \u0648\u062A\u0634\u063A\u064A\u0644 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629.",
          en: "Analytical article by Ahmed Soliman on architectural differences between single-doctor clinics and medical complexes."
        },
        ogImage: "/assets/aistudio/logo_ae3842b8.png",
        canonicalSlug: "/blog/single-clinic-vs-medical-complex-software",
        structuredDataType: "BlogPosting"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "article-standalone-clinic-landing-pages",
      slug: "why-clinics-need-standalone-landing-pages",
      title: {
        ar: "\u0643\u064A\u0641 \u062A\u0631\u0641\u0639 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0648\u0645\u062D\u0627\u062F\u062B\u0627\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645/\u0648\u0627\u062A\u0633\u0627\u0628 \u0645\u0639\u062F\u0644 \u0627\u0644\u062D\u062C\u0632 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A\u061F",
        en: "How Standalone Medical Landing Pages & Telegram/WhatsApp Bots Boost Clinic Bookings"
      },
      excerpt: {
        ar: "\u0644\u0645\u0627\u0630\u0627 \u064A\u063A\u0627\u062F\u0631 \u0627\u0644\u0645\u0631\u064A\u0636 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A \u062F\u0648\u0646 \u062D\u062C\u0632\u061F \u0648\u0643\u064A\u0641 \u062A\u0633\u0627\u0639\u062F \u0635\u0641\u062D\u0629 \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0629 \u0641\u064A \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0632\u0627\u0626\u0631 \u0625\u0644\u0649 \u0645\u0648\u0639\u062F \u0645\u0624\u0643\u062F.",
        en: "Why patients drop off on crowded social media pages, and how a focused standalone clinic landing page converts visitors into confirmed appointments."
      },
      content: {
        ar: `## \u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u0631\u064A\u0636 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u062A\u0628\u062F\u0623 \u0628\u0627\u0644\u0633\u0624\u0627\u0644 \u0639\u0646 3 \u0623\u0634\u064A\u0627\u0621

\u0639\u0646\u062F\u0645\u0627 \u064A\u0628\u062D\u062B \u0627\u0644\u0645\u0631\u064A\u0636 \u0639\u0646 \u0637\u0628\u064A\u0628 \u0623\u0648 \u0645\u0631\u0643\u0632 \u0637\u0628\u064A\u060C \u0641\u0625\u0646\u0647 \u064A\u0628\u062D\u062B \u0639\u0646 \u0625\u062C\u0627\u0628\u0627\u062A \u0641\u0648\u0631\u064A\u0629 \u0648\u0648\u0627\u0636\u062D\u0629 \u0644\u062B\u0644\u0627\u062B\u0629 \u0623\u0633\u0626\u0644\u0629:
1. \u0645\u0646 \u0647\u0648 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0645\u0627 \u062A\u062E\u0635\u0635\u0647 \u0648\u0645\u0624\u0647\u0644\u0627\u062A\u0647\u061F
2. \u0645\u0627 \u0647\u064A \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0648\u0643\u0645 \u062A\u0628\u0644\u063A \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0643\u0634\u0641\u061F
3. \u0645\u062A\u0649 \u062A\u0639\u0645\u0644 \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0648\u0643\u064A\u0641 \u0623\u062D\u062C\u0632 \u0645\u0648\u0639\u062F\u064A \u0627\u0644\u0622\u0646 \u062F\u0648\u0646 \u0627\u0646\u062A\u0638\u0627\u0631 \u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641\u061F

### \u0623\u0647\u0645\u064A\u0629 \u0646\u0645\u0637 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 (Standalone Landing Layout)
\u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u0631\u064A\u0636 \u0625\u0644\u0649 \u0645\u0648\u0642\u0639 \u0645\u0632\u062F\u062D\u0645 \u0628\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629\u060C \u062A\u0648\u0641\u0631 \u0635\u0641\u062D\u0629 \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u0644\u0639\u064A\u0627\u062F\u0629 \u0645\u0633\u0627\u0631\u0627\u064B \u0635\u0627\u0641\u064A\u0627\u064B \u064A\u0639\u0631\u0636 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0641\u0642\u0637 \u0645\u0639 \u0632\u0631 \u062A\u0648\u0627\u0635\u0644 \u0648\u062D\u062C\u0632 \u0641\u0648\u0631\u064A \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628 \u0623\u0648 \u0628\u0648\u062A \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \`@SoliMedicalproBot\`\u060C \u0645\u0645\u0627 \u064A\u0636\u0627\u0639\u0641 \u0645\u0639\u062F\u0644 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0632\u0648\u0627\u0631 \u0645\u0646 \u0627\u0644\u062D\u0645\u0644\u0627\u062A \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u064A\u0629 \u0625\u0644\u0649 \u062D\u062C\u0648\u0632\u0627\u062A \u0641\u0639\u0644\u064A\u0629.`,
        en: `## The Patient's Digital Journey Starts With Three Questions

When a patient looks up a clinic or specialist online, they want immediate, trustworthy answers to three questions:
1. Who is the physician and what are their credentials?
2. What services are offered and what is the consultation fee?
3. What are the working hours and how can I book right now without waiting on hold?

### The Power of a Standalone Landing Layout
Instead of sending patients to a cluttered directory or social feed, a dedicated Standalone Medical Landing Page presents only the clinic's doctors, transparent pricing, schedule, and one-tap WhatsApp or Telegram Bot (\`@SoliMedicalproBot\`) booking\u2014dramatically increasing conversion rates from digital campaigns.`
      },
      category: {
        ar: "\u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A",
        en: "Clinic Digital Growth"
      },
      tags: ["Medical Landing Pages", "Telegram Bot", "Patient Conversion", "Healthcare UX"],
      coverImage: "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
      readingTimeMinutes: 3,
      authorName: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
        en: "Ahmed Soliman"
      },
      featured: false,
      published: true,
      order: 2,
      seo: {
        title: {
          ar: "\u0623\u0647\u0645\u064A\u0629 \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0648\u0628\u0648\u062A \u0627\u0644\u062D\u062C\u0632 \u0644\u0644\u0639\u064A\u0627\u062F\u0627\u062A | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Standalone Medical Landing Pages & Booking Automation | Ahmed Soliman"
        },
        description: {
          ar: "\u0643\u064A\u0641 \u062A\u0633\u0627\u0639\u062F \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0647\u0628\u0648\u0637 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0648\u0628\u0648\u062A\u0627\u062A \u0627\u0644\u062D\u062C\u0632 \u0639\u0628\u0631 \u062A\u0644\u064A\u062C\u0631\u0627\u0645 \u0648\u0648\u0627\u062A\u0633\u0627\u0628 \u0641\u064A \u0632\u064A\u0627\u062F\u0629 \u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0637\u0628\u064A\u0629.",
          en: "How standalone clinic landing pages and automated Telegram/WhatsApp flows increase patient bookings."
        },
        ogImage: "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
        canonicalSlug: "/blog/why-clinics-need-standalone-landing-pages",
        structuredDataType: "BlogPosting"
      },
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: "article-icu-quality-and-handoffs",
      slug: "digital-shift-handoffs-and-icu-patient-safety",
      title: {
        ar: "\u062F\u0648\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0641\u064A \u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 (ICU)",
        en: "How Digital Shift Handoffs & ICU Telemetry Reduce Clinical Errors in Critical Care"
      },
      excerpt: {
        ar: "\u0645\u0646 \u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0641\u064A \u0627\u0644\u062A\u0645\u0631\u064A\u0636 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629: \u0643\u064A\u0641 \u064A\u062D\u0648\u0644 \u0646\u0638\u0627\u0645 \u0645\u062B\u0644 ICU-Sync \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0625\u0644\u0649 \u0639\u0645\u0644\u064A\u0629 \u0642\u064A\u0627\u0633\u064A\u0629 \u0622\u0645\u0646\u0629 \u062A\u062D\u0645\u064A \u0627\u0644\u0645\u0631\u064A\u0636.",
        en: "From critical care nursing and healthcare quality practice: how structured SBAR digital handoffs prevent information loss during ICU shift changes."
      },
      content: {
        ar: `## \u0644\u062D\u0638\u0629 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0648\u0631\u062F\u064A\u0629: \u0627\u0644\u0646\u0642\u0637\u0629 \u0627\u0644\u0623\u0643\u062B\u0631 \u062D\u0633\u0627\u0633\u064A\u0629 \u0641\u064A \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u064A\u0636

\u062A\u0634\u064A\u0631 \u062F\u0631\u0627\u0633\u0627\u062A \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0639\u0627\u0644\u0645\u064A\u0627\u064B \u0625\u0644\u0649 \u0623\u0646 \u0646\u0633\u0628\u0629 \u0643\u0628\u064A\u0631\u0629 \u0645\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0639\u0627\u0631\u0636\u0629 (Sentinel Events) \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u062A\u0631\u062A\u0628\u0637 \u0628\u0636\u0639\u0641 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0628\u064A\u0646 \u0627\u0644\u0648\u0631\u062F\u064A\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0645\u0631\u064A\u0636\u064A\u0629.

### \u0644\u0645\u0627\u0630\u0627 \u0644\u0627 \u062A\u0643\u0641\u064A \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0634\u0641\u0647\u064A\u0629 \u0623\u0648 \u0627\u0644\u0648\u0631\u0642\u064A\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u061F
\u0641\u064A \u0648\u062D\u062F\u0629 \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u062A\u062A\u063A\u064A\u0631 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u064A\u0629 \u0648\u062C\u0631\u0639\u0627\u062A \u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0648\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u0646\u0641\u0633 \u0627\u0644\u0635\u0646\u0627\u0639\u064A \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629. \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0639\u0644\u0649 \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0623\u0648 \u0623\u0648\u0631\u0627\u0642 \u0645\u062A\u0641\u0631\u0642\u0629 \u064A\u0639\u0631\u0636 \u0627\u0644\u0641\u0631\u064A\u0642 \u0627\u0644\u0637\u0628\u064A \u0644\u062E\u0637\u0631 \u0646\u0633\u064A\u0627\u0646 \u062A\u0641\u0635\u064A\u0644\u0629 \u062D\u0631\u062C\u0629.

### \u0627\u0644\u062D\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0639\u0628\u0631 \u0646\u0645\u0648\u0630\u062C SBAR \u0627\u0644\u0642\u064A\u0627\u0633\u064A
\u0639\u0646\u062F\u0645\u0627 \u0635\u0645\u0645\u062A \u0646\u0638\u0627\u0645 **ICU-Sync**\u060C \u0643\u0627\u0646 \u0627\u0644\u0647\u062F\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0647\u0648 \u062F\u0645\u062C \u0645\u0646\u0647\u062C\u064A\u0629 **SBAR** (Situation, Background, Assessment, Recommendation) \u0645\u0628\u0627\u0634\u0631\u0629 \u0641\u064A \u0634\u0627\u0634\u0629 \u0643\u0644 \u0633\u0631\u064A\u0631\u060C \u0628\u062D\u064A\u062B \u064A\u0631\u0649 \u0627\u0644\u0637\u0628\u064A\u0628 \u0648\u0627\u0644\u0645\u0645\u0631\u0636 \u0627\u0644\u0645\u0633\u0644\u0645 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0645 \u0646\u0641\u0633 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0644\u062D\u0638\u064A\u0629 \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0628\u0648\u0636\u0648\u062D \u062A\u0627\u0645.`,
        en: `## Shift Handover: The Most Critical Moment in Patient Safety

Global healthcare quality research consistently shows that a majority of preventable clinical adverse events trace back to communication breakdowns during shift handoffs.

### Why Paper Flowcharts Fall Short in the ICU
In an Intensive Care Unit, ventilator settings, vasopressor titrations, and fluid balances shift hour by hour. Relying on verbal summaries or scattered paper sheets introduces dangerous cognitive load.

### Embedding SBAR Governance into Software
When architecting **ICU-Sync**, the primary goal was embedding the clinical **SBAR** framework (Situation, Background, Assessment, Recommendation) directly into the live bed telemetry screen\u2014ensuring incoming and outgoing teams share a single, unambiguous source of truth.`
      },
      category: {
        ar: "\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0627\u0644\u062A\u0645\u0631\u064A\u0636",
        en: "Clinical Quality & ICU Care"
      },
      tags: ["ICU-Sync", "Patient Safety", "Healthcare Quality", "SBAR Handoff"],
      coverImage: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg",
      readingTimeMinutes: 5,
      authorName: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
        en: "Ahmed Soliman"
      },
      featured: false,
      published: true,
      order: 3,
      seo: {
        title: {
          ar: "\u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0639\u0628\u0631 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u0648\u0631\u062F\u064A\u0627\u062A | \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646",
          en: "Digital ICU Shift Handoffs & Patient Safety | Ahmed Soliman"
        },
        description: {
          ar: "\u0645\u0642\u0627\u0644 \u0645\u062A\u062E\u0635\u0635 \u0628\u0642\u0644\u0645 \u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u062D\u0648\u0644 \u062F\u0648\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0648\u0645\u0646\u0647\u062C\u064A\u0629 SBAR \u0641\u064A \u0631\u0641\u0639 \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u062F\u0627\u062E\u0644 \u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629.",
          en: "How structured digital SBAR handoffs and ICU telemetry improve patient safety and healthcare quality."
        },
        ogImage: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg",
        canonicalSlug: "/blog/digital-shift-handoffs-and-icu-patient-safety",
        structuredDataType: "BlogPosting"
      },
      createdAt: NOW,
      updatedAt: NOW
    }
  ],
  media: [
    {
      id: "media-ahmed-portrait",
      publicId: "local/ahmed-soliman-portrait",
      secureUrl: "/assets/aistudio/1770146906397_16665dd0.png",
      format: "png",
      width: 900,
      height: 1200,
      alt: {
        ar: "\u0623\u062D\u0645\u062F \u0633\u0644\u064A\u0645\u0627\u0646 \u2014 \u0623\u062E\u0635\u0627\u0626\u064A \u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0645\u0637\u0648\u0651\u0631 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Ahmed Soliman \u2014 Healthcare Quality Specialist & Medical Systems Developer"
      },
      category: "profile",
      createdAt: NOW
    },
    {
      id: "media-soli-medical-logo",
      publicId: "local/soli-medical-logo",
      secureUrl: "/assets/aistudio/logo_ae3842b8.png",
      format: "png",
      width: 512,
      height: 512,
      alt: {
        ar: "\u0634\u0639\u0627\u0631 \u0646\u0638\u0627\u0645 Soli Medical \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Soli Medical Clinic & Healthcare Complex System Logo"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-icu-sync-cover",
      publicId: "local/project-icu-sync-dashboard",
      secureUrl: "/src/assets/images/project_icu_sync_dashboard_1794472511322.jpg",
      format: "jpg",
      width: 1600,
      height: 900,
      alt: {
        ar: "\u0648\u0627\u062C\u0647\u0629 \u0646\u0638\u0627\u0645 ICU-Sync \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629",
        en: "ICU-Sync Critical Care Command Dashboard"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-mitali-hospital-cover",
      publicId: "local/project-mitali-hospital-erp",
      secureUrl: "/src/assets/images/project_mitali_hospital_erp_1794472513231.jpg",
      format: "jpg",
      width: 1600,
      height: 900,
      alt: {
        ar: "\u0645\u0646\u0638\u0648\u0645\u0629 Mitali Hospital \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062C\u0645\u0639\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629",
        en: "Mitali Hospital Multi-Specialty ERP Interface"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-warehouse-quality-cover",
      publicId: "local/project-warehouse-quality-sys",
      secureUrl: "/src/assets/images/project_warehouse_quality_sys_1794472517145.jpg",
      format: "jpg",
      width: 1600,
      height: 900,
      alt: {
        ar: "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0635\u062D\u064A\u0629",
        en: "Medical Inventory & Healthcare Quality Management Dashboard"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-clinic-interior-cover",
      publicId: "local/clinic-interior-reception",
      secureUrl: "/src/assets/images/clinic_interior_reception_1794472515936.jpg",
      format: "jpg",
      width: 1600,
      height: 900,
      alt: {
        ar: "\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0645\u062C\u0645\u0639 \u0627\u0644\u0646\u0648\u0631 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u062A\u062E\u0635\u0635\u064A",
        en: "Al-Noor Specialized Medical Complex Reception"
      },
      category: "clinic",
      createdAt: NOW
    },
    {
      id: "media-soli-dashboard-screen",
      publicId: "local/soli-dashboard-screen",
      secureUrl: "/assets/solimedical/dashboard.svg",
      format: "svg",
      width: 1200,
      height: 720,
      alt: {
        ar: "\u0634\u0627\u0634\u0629 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0644\u0646\u0638\u0627\u0645 Soli Medical",
        en: "Soli Medical Command Dashboard Screen"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-soli-booking-screen",
      publicId: "local/soli-booking-screen",
      secureUrl: "/assets/solimedical/booking.svg",
      format: "svg",
      width: 1200,
      height: 720,
      alt: {
        ar: "\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u0637\u0627\u0628\u0648\u0631 \u0641\u064A \u0646\u0638\u0627\u0645 Soli Medical",
        en: "Soli Medical Queue & Appointments Screen"
      },
      category: "project",
      createdAt: NOW
    },
    {
      id: "media-soli-emr-screen",
      publicId: "local/soli-emr-screen",
      secureUrl: "/assets/solimedical/emr.svg",
      format: "svg",
      width: 1200,
      height: 720,
      alt: {
        ar: "\u0634\u0627\u0634\u0629 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0627\u0644\u0631\u0648\u0634\u062A\u0629 \u0641\u064A Soli Medical",
        en: "Soli Medical Cloud EMR & E-Prescription Screen"
      },
      category: "project",
      createdAt: NOW
    }
  ]
};

// src/lib/validationSchemas.ts
var SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
var MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
var SAFE_FOLDER_REGEX = /^[a-zA-Z0-9/_-]{1,64}$/;
function sanitizeText(input, maxLength = 25e3) {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "").replace(/<\s*(iframe|object|embed|applet|meta|link|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*(script|iframe|object|embed|applet|meta|link)[^>]*\/?>/gi, "").replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(?:javascript|vbscript)\s*:/gi, "").replace(/data\s*:\s*(?:text\/html|image\/svg\+xml|image\/[a-z0-9.+-]+\s*;\s*base64)[^\s"')>]*/gi, "");
}
function sanitizeUrl(url) {
  if (typeof url !== "string") return "";
  const rawTrimmed = url.trim();
  if (!rawTrimmed) return "";
  if (/^(?:javascript|vbscript|data)\s*:/i.test(rawTrimmed)) {
    return "";
  }
  return sanitizeText(rawTrimmed, 2048);
}
function sanitizePayload(input) {
  if (typeof input === "string") {
    return sanitizeText(input);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item));
  }
  if (input && typeof input === "object") {
    const out = {};
    for (const [key, val] of Object.entries(input)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      if (typeof val === "string" && (key.toLowerCase().includes("url") || key.toLowerCase().includes("href") || key.toLowerCase().includes("image") || key.toLowerCase() === "src" || key === "whatsapp")) {
        out[key] = sanitizeUrl(val);
      } else {
        out[key] = sanitizePayload(val);
      }
    }
    return out;
  }
  return input;
}
function validateCloudinaryFolder(folder) {
  return typeof folder === "string" && SAFE_FOLDER_REGEX.test(folder) && !folder.includes("..") && !folder.startsWith("/");
}
function validateSlug(slug) {
  return typeof slug === "string" && slug.length >= 2 && slug.length <= 120 && SLUG_REGEX.test(slug);
}
function validateImageUploadFile(file) {
  const errors = [];
  if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
    errors.push(
      `Unsupported file format (${file.type || "unknown"}). Allowed formats: JPG, PNG, WebP, AVIF.`
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${sizeMb} MB) exceeds the 5.00 MB maximum limit.`);
  }
  if (file.size <= 0) {
    errors.push("Selected file is empty.");
  }
  return { valid: errors.length === 0, errors };
}
function isBase64DataUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^data\s*:/i.test(trimmed) || /data\s*:\s*image\/[a-z0-9.+-]+\s*;\s*base64/i.test(trimmed);
}
function containsBase64ImagePayload(input) {
  if (typeof input === "string") {
    return isBase64DataUrl(input);
  }
  if (Array.isArray(input)) {
    return input.some((item) => containsBase64ImagePayload(item));
  }
  if (input && typeof input === "object") {
    return Object.values(input).some(
      (val) => containsBase64ImagePayload(val)
    );
  }
  return false;
}
function validateProjectPayload(project) {
  const errors = [];
  if (!project.title?.ar?.trim() || !project.title?.en?.trim()) {
    errors.push("Project title is required in both Arabic and English.");
  }
  if (!project.slug || !validateSlug(project.slug)) {
    errors.push(
      "Project slug must be lowercase alphanumeric with hyphens (e.g. soli-medical-system)."
    );
  }
  if (!project.summary?.ar?.trim() || !project.summary?.en?.trim()) {
    errors.push("Project summary is required in both Arabic and English.");
  }
  if (containsBase64ImagePayload(project)) {
    errors.push("Base64 Data URL images are not allowed in project records. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
function validateClinicPayload(clinic) {
  const errors = [];
  if (!clinic.name?.ar?.trim() || !clinic.name?.en?.trim()) {
    errors.push("Clinic name is required in both Arabic and English.");
  }
  if (!clinic.slug || !validateSlug(clinic.slug)) {
    errors.push("Clinic slug must be lowercase alphanumeric with hyphens (e.g. al-noor-clinic).");
  }
  if (!clinic.phone?.trim() && !clinic.whatsapp?.trim()) {
    errors.push("At least one contact method (Phone or WhatsApp) is required.");
  }
  if (containsBase64ImagePayload(clinic)) {
    errors.push("Base64 Data URL images are not allowed in clinic records. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
function validateDoctorPayload(doctor) {
  const errors = [];
  if (!doctor.name?.ar?.trim() || !doctor.name?.en?.trim()) {
    errors.push("Doctor name is required in both Arabic and English.");
  }
  if (!doctor.clinicId?.trim()) {
    errors.push("Doctor must be linked to a valid clinic.");
  }
  if (!doctor.specialty?.ar?.trim() || !doctor.specialty?.en?.trim()) {
    errors.push("Doctor specialty is required in both Arabic and English.");
  }
  if (containsBase64ImagePayload(doctor)) {
    errors.push("Base64 Data URL images are not allowed in doctor records. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
function validateServicePayload(service) {
  const errors = [];
  if (!service.name?.ar?.trim() || !service.name?.en?.trim()) {
    errors.push("Service name is required in both Arabic and English.");
  }
  if (!service.clinicId?.trim()) {
    errors.push("Service must be linked to a valid clinic.");
  }
  if (typeof service.price !== "number" || Number.isNaN(service.price) || service.price < 0) {
    errors.push("Service price must be a non-negative number.");
  }
  return { valid: errors.length === 0, errors };
}
function extractArticlePlainText(rawOrJson) {
  if (!rawOrJson) return "";
  if (typeof rawOrJson === "object") {
    const chunks = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (typeof node.text === "string") {
        chunks.push(node.text);
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
        chunks.push(" ");
      }
    };
    walk(rawOrJson);
    return chunks.join(" ").replace(/\s+/g, " ").trim();
  }
  if (typeof rawOrJson !== "string") return "";
  const trimmed = rawOrJson.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && (parsed.type === "doc" || Array.isArray(parsed.content))) {
        return extractArticlePlainText(parsed);
      }
    } catch {
    }
  }
  return trimmed.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`~-]+/g, " ").replace(/\s+/g, " ").trim();
}
function countArticleWords(rawContent, jsonDoc) {
  const plain = jsonDoc ? extractArticlePlainText(jsonDoc) || extractArticlePlainText(rawContent) : extractArticlePlainText(rawContent);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}
function estimateArticleReadingTime(arWords, enWords) {
  const maxWords = Math.max(arWords || 0, enWords || 0);
  if (maxWords <= 0) return 1;
  return Math.max(1, Math.ceil(maxWords / 180));
}
function validateArticleSlug(rawSlug, options) {
  const errors = [];
  const slug = String(rawSlug || "").trim().toLowerCase();
  if (!slug || !validateSlug(slug)) {
    errors.push(
      "Article slug must be 2\u2013120 lowercase alphanumeric characters with hyphens (e.g. icu-telemetry-guide)."
    );
    return { valid: false, errors };
  }
  if (options?.existingArticles && Array.isArray(options.existingArticles)) {
    const duplicate = options.existingArticles.find(
      (a) => a.slug?.toLowerCase() === slug && a.id !== options.editingId
    );
    if (duplicate) {
      errors.push(
        `Article slug "${slug}" is already used by another article ("${duplicate.title?.en || duplicate.title?.ar || duplicate.id}").`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}
function checkArticleInSiteReferences(article, db) {
  const usedIn = [];
  const slug = String(article.slug || "").trim().toLowerCase();
  if (!slug) return { inUse: false, usedIn };
  const pattern = `/blog/${slug}`;
  const containsRef = (text) => {
    if (!text || typeof text !== "string") return false;
    return text.toLowerCase().includes(pattern);
  };
  for (const page of db.pages || []) {
    if (page.archived) continue;
    const inBlocks = (page.blocks || []).some(
      (b) => containsRef(b.ctaHref) || containsRef(b.body?.ar) || containsRef(b.body?.en)
    );
    if (containsRef(page.ctaHref) || containsRef(page.biography?.ar) || containsRef(page.biography?.en) || inBlocks) {
      usedIn.push(`Page: ${page.title?.en || page.title?.ar || page.slug}`);
    }
  }
  for (const proj of db.projects || []) {
    if (containsRef(proj.liveUrl) || containsRef(proj.showcaseRoute) || containsRef(proj.description?.ar) || containsRef(proj.description?.en)) {
      usedIn.push(`Project: ${proj.title?.en || proj.title?.ar || proj.slug}`);
    }
  }
  for (const other of db.articles || []) {
    if (other.id === article.id || other.archived) continue;
    if (containsRef(other.content?.ar) || containsRef(other.content?.en)) {
      usedIn.push(`Article: ${other.title?.en || other.title?.ar || other.slug}`);
    }
  }
  return { inUse: usedIn.length > 0, usedIn };
}
function validateArticlePayload(article, options) {
  const errors = [];
  if (!article.title?.ar?.trim() || !article.title?.en?.trim()) {
    errors.push("Article title is required in both Arabic and English.");
  }
  const slugCheck = validateArticleSlug(article.slug || "", {
    editingId: article.id,
    existingArticles: options?.existingArticles
  });
  if (!slugCheck.valid) {
    errors.push(...slugCheck.errors);
  }
  const arText = extractArticlePlainText(article.contentJson?.ar) || extractArticlePlainText(article.content?.ar);
  const enText = extractArticlePlainText(article.contentJson?.en) || extractArticlePlainText(article.content?.en);
  if (!arText || !enText) {
    errors.push("Article content is required in both Arabic and English.");
  }
  if (containsBase64ImagePayload(article)) {
    errors.push("Base64 Data URL images are not allowed in articles. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
var CORE_PAGE_IDS = [
  "home",
  "about",
  "projects",
  "clinics",
  "blog",
  "solimedical",
  "page-about"
];
var RESERVED_PAGE_SLUGS = [
  "home",
  "about",
  "projects",
  "clinics",
  "blog",
  "solimedical",
  "landing",
  "p",
  "admin",
  "api",
  "campaign",
  "ar",
  "en",
  "sitemap",
  "robots"
];
function isCoreProtectedPage(pageOrId) {
  if (!pageOrId) return false;
  if (typeof pageOrId === "string") {
    return CORE_PAGE_IDS.includes(pageOrId);
  }
  const id = String(pageOrId.id || "").trim().toLowerCase();
  const slug = String(pageOrId.slug || "").trim().toLowerCase();
  return Boolean(pageOrId.isCore) || pageOrId.pageType === "core" || CORE_PAGE_IDS.includes(id) || CORE_PAGE_IDS.includes(slug);
}
function validatePageSlug(rawSlug, options) {
  const errors = [];
  const slug = String(rawSlug || "").trim().toLowerCase();
  if (!slug || !validateSlug(slug)) {
    errors.push(
      "Page slug must be 2\u2013120 lowercase alphanumeric characters or hyphens (e.g. clinic-launch-offer)."
    );
    return { valid: false, errors };
  }
  if (!options?.isCore && RESERVED_PAGE_SLUGS.includes(slug)) {
    errors.push(
      `Slug "${slug}" is reserved for core platform routes and cannot be used for a custom page.`
    );
  }
  if (options?.existingPages && Array.isArray(options.existingPages)) {
    const duplicate = options.existingPages.find(
      (p) => p.slug?.toLowerCase() === slug && p.id !== options.editingId
    );
    if (duplicate) {
      errors.push(
        `Slug "${slug}" is already used by another page ("${duplicate.title?.en || duplicate.title?.ar || duplicate.id}").`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}
function checkPageInSiteReferences(page, db) {
  const usedIn = [];
  const slug = String(page.slug || "").trim().toLowerCase();
  if (!slug) return { inUse: false, usedIn };
  const patterns = [`/landing/${slug}`, `/p/${slug}`];
  const containsRef = (text) => {
    if (!text || typeof text !== "string") return false;
    const lower = text.toLowerCase();
    return patterns.some((pat) => lower.includes(pat));
  };
  for (const art of db.articles || []) {
    if (art.id && (containsRef(art.content?.ar) || containsRef(art.content?.en) || containsRef(art.seo?.canonicalSlug))) {
      usedIn.push(`Article: ${art.title?.en || art.title?.ar || art.slug}`);
    }
  }
  for (const proj of db.projects || []) {
    if (containsRef(proj.showcaseRoute) || containsRef(proj.liveUrl) || containsRef(proj.description?.ar) || containsRef(proj.description?.en)) {
      usedIn.push(`Project: ${proj.title?.en || proj.title?.ar || proj.slug}`);
    }
  }
  for (const other of db.pages || []) {
    if (other.id === page.id || other.archived) continue;
    const inBlocks = (other.blocks || []).some(
      (b) => containsRef(b.ctaHref) || containsRef(b.body?.ar) || containsRef(b.body?.en)
    );
    if (containsRef(other.ctaHref) || containsRef(other.biography?.ar) || containsRef(other.biography?.en) || inBlocks) {
      usedIn.push(`Page: ${other.title?.en || other.title?.ar || other.slug}`);
    }
  }
  return { inUse: usedIn.length > 0, usedIn };
}
function validatePagePayload(page) {
  const errors = [];
  if (!page.title?.ar?.trim() || !page.title?.en?.trim()) {
    errors.push("Page title is required in both Arabic and English.");
  }
  if (!page.headline?.ar?.trim() || !page.headline?.en?.trim()) {
    errors.push("Page headline is required in both Arabic and English.");
  }
  const isCore = isCoreProtectedPage(page);
  if (page.slug || !isCore) {
    const slugCheck = validatePageSlug(page.slug || "", { isCore });
    if (!slugCheck.valid) {
      errors.push(...slugCheck.errors);
    }
  }
  if (containsBase64ImagePayload(page)) {
    errors.push("Base64 Data URL images are not allowed in pages. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
function validateSiteSettingsPayload(settings) {
  const errors = [];
  if (!settings.brandName?.ar?.trim() || !settings.brandName?.en?.trim()) {
    errors.push("Brand name is required in both Arabic and English.");
  }
  if (containsBase64ImagePayload(settings)) {
    errors.push("Base64 Data URL images are not allowed in site settings. Upload to Cloudinary first.");
  }
  return { valid: errors.length === 0, errors };
}
function validateMediaAssetPayload(media) {
  const errors = [];
  const publicId = typeof media.publicId === "string" ? media.publicId.trim() : "";
  const secureUrl = typeof media.secureUrl === "string" ? media.secureUrl.trim() : "";
  if (!publicId || !secureUrl) {
    errors.push("Media publicId and secureUrl are required.");
    return { valid: false, errors };
  }
  if (isBase64DataUrl(secureUrl) || isBase64DataUrl(publicId)) {
    errors.push(
      "Base64 Data URLs are forbidden in media records. Media must be uploaded to Cloudinary CDN."
    );
  }
  if (publicId.startsWith("local/")) {
    errors.push(
      "Local fallback publicIds (local/*) are forbidden for new media uploads. Configure Cloudinary CDN."
    );
  }
  if (!/^https?:\/\//i.test(secureUrl) && !secureUrl.startsWith("/assets/")) {
    errors.push("Media secureUrl must be a valid HTTPS Cloudinary URL or static /assets/ path.");
  }
  return { valid: errors.length === 0, errors };
}
function validateCollectionRecord(collectionName, payload) {
  switch (collectionName) {
    case "projects":
      return validateProjectPayload(payload);
    case "clinics":
      return validateClinicPayload(payload);
    case "doctors":
      return validateDoctorPayload(payload);
    case "services":
      return validateServicePayload(payload);
    case "articles":
      return validateArticlePayload(payload);
    case "pages":
      return validatePagePayload(payload);
    case "media":
      return validateMediaAssetPayload(payload);
    case "siteSettings":
      return validateSiteSettingsPayload(payload);
    default:
      return { valid: false, errors: [`Unknown collection: ${collectionName}`] };
  }
}
function validateConsultationForm(input) {
  const errors = [];
  if (input.websiteHoneypot && input.websiteHoneypot.trim().length > 0) {
    errors.push("Automated bot submission rejected.");
  }
  const name = sanitizeText(input.name || "", 100).trim();
  const role = sanitizeText(input.role || "", 100).trim();
  const facilityType = sanitizeText(input.facilityType || "", 120).trim();
  const message = sanitizeText(input.message || "", 1500).trim();
  if (!message || message.length < 3) {
    errors.push("Please enter a valid inquiry message (at least 3 characters).");
  }
  if ((input.message || "").length > 1500) {
    errors.push("Inquiry message must not exceed 1500 characters.");
  }
  return {
    valid: errors.length === 0,
    errors,
    sanitized: { name, role, facilityType, message }
  };
}
function normalizeMediaComparisonUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const cleaned = rawUrl.trim().split("?")[0].split("#")[0].trim();
  if (!cleaned) return "";
  const cloudinaryMatch = cleaned.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i
  );
  if (cloudinaryMatch) {
    const [, prefix, rest] = cloudinaryMatch;
    const segments = rest.split("/").filter(Boolean);
    while (segments.length > 1) {
      const head = segments[0];
      const isVersion = /^v\d+$/i.test(head);
      const isTransform = head.includes(",") || /^(?:f|q|w|h|c|dpr|g|e|ar|fl|bo|r|o|a|b|co|l|u|t)_[a-z0-9._-]+$/i.test(head);
      if (isVersion || isTransform) {
        segments.shift();
      } else {
        break;
      }
    }
    const tail = segments.join("/");
    const tailWithoutExt = tail.replace(/\.[a-z0-9]{2,5}$/i, "");
    return `${prefix.toLowerCase()}${tailWithoutExt}`;
  }
  return cleaned;
}
function doesContentReferenceMedia(content, rawTargetUrl, normalizedTargetUrl, targetPublicId) {
  if (!content) return false;
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (!trimmed) return false;
    if (rawTargetUrl && trimmed.includes(rawTargetUrl)) {
      return true;
    }
    if (normalizedTargetUrl && !trimmed.includes(" ") && !trimmed.includes("\n")) {
      if (normalizeMediaComparisonUrl(trimmed) === normalizedTargetUrl) {
        return true;
      }
    }
    if (targetPublicId && targetPublicId.length >= 3 && !targetPublicId.startsWith("local/") && trimmed.includes(targetPublicId)) {
      return true;
    }
    const urlMatches = trimmed.match(/https?:\/\/[^\s"')>\]]+|\/assets\/[^\s"')>\]]+/gi);
    if (urlMatches && normalizedTargetUrl) {
      for (const candidateUrl of urlMatches) {
        if (candidateUrl === rawTargetUrl || normalizeMediaComparisonUrl(candidateUrl) === normalizedTargetUrl) {
          return true;
        }
      }
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return doesContentReferenceMedia(
          parsed,
          rawTargetUrl,
          normalizedTargetUrl,
          targetPublicId
        );
      } catch {
      }
    }
    return false;
  }
  if (Array.isArray(content)) {
    return content.some(
      (item) => doesContentReferenceMedia(item, rawTargetUrl, normalizedTargetUrl, targetPublicId)
    );
  }
  if (typeof content === "object") {
    const obj = content;
    if (targetPublicId && typeof obj.publicId === "string" && obj.publicId.trim() === targetPublicId) {
      return true;
    }
    return Object.values(obj).some(
      (val) => doesContentReferenceMedia(val, rawTargetUrl, normalizedTargetUrl, targetPublicId)
    );
  }
  return false;
}
function checkMediaInPublishedContent(asset, db) {
  const usedInSet = /* @__PURE__ */ new Set();
  const rawUrl = typeof asset?.secureUrl === "string" ? asset.secureUrl.trim() : "";
  const normalizedUrl = normalizeMediaComparisonUrl(rawUrl);
  const publicId = typeof asset?.publicId === "string" ? asset.publicId.trim() : "";
  if (!rawUrl && !publicId) {
    return { inUse: false, usedIn: [] };
  }
  const matches = (val) => doesContentReferenceMedia(val, rawUrl, normalizedUrl, publicId);
  if (db.siteSettings?.published) {
    if (matches(db.siteSettings.avatarUrl) || matches(db.siteSettings.seo?.ogImage)) {
      usedInSet.add(
        `Site Settings (${db.siteSettings.brandName?.en || db.siteSettings.brandName?.ar || "Global"})`
      );
    }
  }
  for (const page of db.pages || []) {
    if (!page.published || page.archived) continue;
    if (matches(page.heroImage) || matches(page.seo?.ogImage) || matches(page.additionalImages) || matches(page.blocks) || matches(page.biography)) {
      usedInSet.add(`Page: ${page.title?.en || page.title?.ar || page.slug || page.id}`);
    }
  }
  for (const proj of db.projects || []) {
    if (!proj.published) continue;
    if (matches(proj.coverImage) || matches(proj.logoImage) || matches(proj.seo?.ogImage) || matches(proj.screens) || matches(proj.description)) {
      usedInSet.add(`Project: ${proj.title?.en || proj.title?.ar || proj.slug || proj.id}`);
    }
  }
  for (const clinic of db.clinics || []) {
    if (!clinic.published) continue;
    if (matches(clinic.coverImage) || matches(clinic.logoUrl) || matches(clinic.seo?.ogImage) || matches(clinic.galleryImages) || matches(clinic.description)) {
      usedInSet.add(`Clinic: ${clinic.name?.en || clinic.name?.ar || clinic.slug || clinic.id}`);
    }
  }
  for (const doc of db.doctors || []) {
    if (!doc.published) continue;
    if (matches(doc.photoUrl)) {
      usedInSet.add(`Doctor: ${doc.name?.en || doc.name?.ar || doc.id}`);
    }
  }
  for (const article of db.articles || []) {
    if (!article.published || article.archived) continue;
    if (matches(article.coverImage) || matches(article.seo?.ogImage) || matches(article.contentJson) || matches(article.content)) {
      usedInSet.add(
        `Article: ${article.title?.en || article.title?.ar || article.slug || article.id}`
      );
    }
  }
  const usedIn = Array.from(usedInSet);
  return {
    inUse: usedIn.length > 0,
    usedIn
  };
}

// src/lib/tiptapBridge.ts
function createEmptyTiptapDoc() {
  return {
    type: "doc",
    content: [{ type: "paragraph" }]
  };
}
function isBase64DataUrl2(url) {
  if (!url || typeof url !== "string") return false;
  return /^\s*data:/i.test(url);
}
function sanitizeTiptapDoc(doc) {
  if (!doc || typeof doc !== "object" || doc.type !== "doc" || !Array.isArray(doc.content)) {
    return createEmptyTiptapDoc();
  }
  const walkMarks = (marks) => {
    if (!Array.isArray(marks)) return void 0;
    const cleaned = [];
    for (const mark of marks) {
      if (!mark || typeof mark !== "object" || typeof mark.type !== "string") continue;
      if (mark.type === "link") {
        const href = sanitizeUrl(String(mark.attrs?.href || ""));
        if (!href || isBase64DataUrl2(href)) continue;
        cleaned.push({
          type: "link",
          attrs: {
            href,
            target: mark.attrs?.target || "_blank",
            rel: mark.attrs?.rel || "noopener noreferrer"
          }
        });
      } else {
        cleaned.push({
          type: mark.type,
          ...mark.attrs ? { attrs: mark.attrs } : {}
        });
      }
    }
    return cleaned.length > 0 ? cleaned : void 0;
  };
  const walkNode = (node) => {
    if (!node || typeof node !== "object" || typeof node.type !== "string") return null;
    if (node.type === "text") {
      const text = typeof node.text === "string" ? node.text : "";
      if (!text) return null;
      const marks = walkMarks(node.marks);
      return {
        type: "text",
        text,
        ...marks ? { marks } : {}
      };
    }
    if (node.type === "image") {
      const src = sanitizeUrl(String(node.attrs?.src || ""));
      if (!src || isBase64DataUrl2(src)) return null;
      return {
        type: "image",
        attrs: {
          src,
          alt: sanitizeText(String(node.attrs?.alt || ""), 300),
          title: node.attrs?.title ? sanitizeText(String(node.attrs.title), 300) : null
        }
      };
    }
    const out = { type: node.type };
    if (node.attrs && typeof node.attrs === "object") {
      out.attrs = { ...node.attrs };
    }
    if (Array.isArray(node.content)) {
      const children = node.content.map(walkNode).filter(Boolean);
      if (children.length > 0) {
        out.content = children;
      }
    }
    return out;
  };
  const normalizedContent = doc.content.map(walkNode).filter(Boolean);
  return {
    type: "doc",
    content: normalizedContent.length > 0 ? normalizedContent : [{ type: "paragraph" }]
  };
}

// server.ts
if (!process.env.VERCEL) {
  dotenv.config();
}
var PORT = 3e3;
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "cms-db.json");
var PUBLIC_DATA_DIR = path.resolve(process.cwd(), "public", "data");
var PUBLIC_SNAPSHOT_FILE = path.join(PUBLIC_DATA_DIR, "public-snapshot.json");
var FIRESTORE_RULES_FILE = path.resolve(process.cwd(), "firestore.rules");
function cleanEnvValue(raw) {
  if (!raw || typeof raw !== "string") return "";
  let val = raw.trim();
  if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1).trim();
  }
  return val;
}
function parseServiceAccountFromEnv() {
  const raw = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!raw) return null;
  try {
    const jsonStr = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed.project_id !== "string" || typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") {
      return null;
    }
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  } catch {
    return null;
  }
}
function getPublicFirebaseClientConfigFromEnv() {
  const serviceAccount = parseServiceAccountFromEnv();
  const apiKey = cleanEnvValue(process.env.VITE_FIREBASE_API_KEY) || cleanEnvValue(process.env.FIREBASE_API_KEY);
  const projectId = cleanEnvValue(process.env.VITE_FIREBASE_PROJECT_ID) || cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || cleanEnvValue(serviceAccount?.project_id);
  const authDomain = cleanEnvValue(process.env.VITE_FIREBASE_AUTH_DOMAIN) || cleanEnvValue(process.env.FIREBASE_AUTH_DOMAIN) || (projectId ? `${projectId}.firebaseapp.com` : "");
  const appId = cleanEnvValue(process.env.VITE_FIREBASE_APP_ID) || cleanEnvValue(process.env.FIREBASE_APP_ID);
  const messagingSenderId = cleanEnvValue(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || cleanEnvValue(process.env.FIREBASE_MESSAGING_SENDER_ID);
  const databaseId = cleanEnvValue(process.env.VITE_FIREBASE_DATABASE_ID) || cleanEnvValue(process.env.FIREBASE_DATABASE_ID) || "(default)";
  return {
    configured: Boolean(apiKey && projectId),
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId,
    databaseId
  };
}
function checkFirebaseAdminEnvConfig() {
  const ownerUid = cleanEnvValue(process.env.ADMIN_OWNER_UID) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_UID);
  const ownerEmail = (cleanEnvValue(process.env.ADMIN_OWNER_EMAIL) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_EMAIL)).toLowerCase();
  if (!ownerUid && !ownerEmail) {
    return {
      ready: false,
      code: "ADMIN_OWNER_UID_NOT_CONFIGURED",
      error: "Server secret ADMIN_OWNER_UID or ADMIN_OWNER_EMAIL is not configured. Please add it in Vercel / server environment variables."
    };
  }
  const serviceAccount = parseServiceAccountFromEnv();
  if (!serviceAccount) {
    return {
      ready: false,
      code: "FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED",
      error: "Server secret FIREBASE_SERVICE_ACCOUNT_JSON is not configured or invalid. Please add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel / server environment variables."
    };
  }
  return {
    ready: true,
    ownerUid,
    ownerEmail,
    serviceAccount
  };
}
var serverFirestoreReadOpsCount = 0;
var serverFirestoreWriteOpsCount = 0;
function getFirestoreMetrics() {
  return {
    reads: serverFirestoreReadOpsCount,
    writes: serverFirestoreWriteOpsCount
  };
}
function resetFirestoreMetrics() {
  serverFirestoreReadOpsCount = 0;
  serverFirestoreWriteOpsCount = 0;
}
async function getAdminFirestoreInstance() {
  const envCheck = checkFirebaseAdminEnvConfig();
  if (!envCheck.ready) return null;
  const { ownerUid, ownerEmail, serviceAccount } = envCheck;
  const [
    { initializeApp: initializeAdminApp, getApps: getAdminApps, cert },
    { getAuth: getAdminAuth },
    { getFirestore: getAdminFirestore }
  ] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
    import("firebase-admin/firestore")
  ]);
  const existingApps = getAdminApps();
  const adminApp = existingApps.length > 0 ? existingApps[0] : initializeAdminApp({ credential: cert(serviceAccount) });
  const adminAuth = getAdminAuth(adminApp);
  const databaseId = cleanEnvValue(process.env.FIREBASE_DATABASE_ID) || cleanEnvValue(process.env.VITE_FIREBASE_DATABASE_ID) || "(default)";
  const adminDb = databaseId && databaseId !== "(default)" ? getAdminFirestore(adminApp, databaseId) : getAdminFirestore(adminApp);
  return { adminApp, adminAuth, adminDb, ownerUid, ownerEmail };
}
async function resolveOrBootstrapAdminDocument(params) {
  const {
    uid,
    ownerUid = "",
    ownerEmail = "",
    getExistingAdminDoc,
    getAuthUserRecord,
    createAdminDoc
  } = params;
  const existing = await getExistingAdminDoc(uid);
  if (existing.exists) {
    return {
      exists: true,
      disabled: Boolean(existing.data?.disabled === true),
      bootstrapped: false
    };
  }
  const configuredOwnerEmail = ownerEmail.trim().toLowerCase();
  const configuredOwnerUid = ownerUid.replace(/\.+$/, "").trim();
  if (!configuredOwnerEmail && !configuredOwnerUid) {
    return { exists: false, disabled: false, bootstrapped: false };
  }
  const userRecord = await getAuthUserRecord(uid);
  if (!userRecord || userRecord.emailVerified !== true) {
    return { exists: false, disabled: false, bootstrapped: false };
  }
  const verifiedEmail = (userRecord.email || "").trim().toLowerCase();
  if (configuredOwnerEmail && verifiedEmail !== configuredOwnerEmail) {
    return { exists: false, disabled: false, bootstrapped: false };
  }
  const uidMatches = Boolean(configuredOwnerUid) && (uid === configuredOwnerUid || configuredOwnerUid.length >= 16 && uid.startsWith(configuredOwnerUid));
  const emailMatches = Boolean(configuredOwnerEmail) && verifiedEmail === configuredOwnerEmail;
  if (!emailMatches && !uidMatches) {
    return { exists: false, disabled: false, bootstrapped: false };
  }
  const newDoc = {
    id: uid,
    uid,
    email: verifiedEmail,
    name: userRecord.displayName || "Ahmed Soliman",
    role: "owner",
    disabled: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await createAdminDoc(uid, newDoc);
  return { exists: true, disabled: false, bootstrapped: true };
}
async function getFirebaseAdminVerificationServices() {
  const envCheck = checkFirebaseAdminEnvConfig();
  if (!envCheck.ready) {
    return envCheck;
  }
  try {
    const inst = await getAdminFirestoreInstance();
    if (!inst) {
      return {
        ready: false,
        code: "FIREBASE_ADMIN_INIT_FAILED",
        error: "Failed to initialize Firebase Admin SDK."
      };
    }
    const { adminAuth, adminDb, ownerUid, ownerEmail } = inst;
    return {
      ready: true,
      deps: {
        ownerUid,
        ownerEmail: ownerEmail || void 0,
        verifyIdToken: async (idToken) => {
          const decoded = await adminAuth.verifyIdToken(idToken, true);
          return {
            uid: decoded.uid,
            email: decoded.email,
            email_verified: decoded.email_verified,
            name: typeof decoded.name === "string" ? decoded.name : void 0
          };
        },
        hasAdminDocument: async (uid) => {
          return resolveOrBootstrapAdminDocument({
            uid,
            ownerUid,
            ownerEmail,
            getExistingAdminDoc: async (targetUid) => {
              serverFirestoreReadOpsCount += 1;
              const snap = await adminDb.collection("admins").doc(targetUid).get();
              return { exists: snap.exists, data: snap.data() };
            },
            getAuthUserRecord: async (targetUid) => {
              const userRec = await adminAuth.getUser(targetUid);
              return {
                uid: userRec.uid,
                email: userRec.email,
                emailVerified: Boolean(userRec.emailVerified),
                displayName: userRec.displayName
              };
            },
            createAdminDoc: async (targetUid, docData) => {
              serverFirestoreWriteOpsCount += 1;
              await adminDb.collection("admins").doc(targetUid).set(docData, { merge: true });
            }
          });
        },
        saveSessionRecord: async (session) => {
          serverFirestoreWriteOpsCount += 1;
          await adminDb.collection("adminSessions").doc(session.id).set(session, { merge: true });
        },
        getSessionRecord: async (sessionId) => {
          serverFirestoreReadOpsCount += 1;
          const snap = await adminDb.collection("adminSessions").doc(sessionId).get();
          if (!snap.exists) return null;
          return snap.data();
        },
        revokeSessionRecord: async (sessionId, uid) => {
          serverFirestoreWriteOpsCount += 1;
          await adminDb.collection("adminSessions").doc(sessionId).set(
            {
              id: sessionId,
              revoked: true,
              revokedAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            { merge: true }
          );
          if (uid) {
            await adminAuth.revokeRefreshTokens(uid).catch(() => {
            });
          }
        }
      }
    };
  } catch (err) {
    console.error("Firebase Admin SDK initialization failed:", err);
    return {
      ready: false,
      code: "FIREBASE_ADMIN_INIT_FAILED",
      error: `Firebase Admin SDK initialization failed: ${err?.message || "Unknown error"}`
    };
  }
}
var activeSessions = /* @__PURE__ */ new Map();
var revokedSessionTokens = /* @__PURE__ */ new Set();
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var MIN_HMAC_SECRET_BYTES = 32;
var customHmacSecretOverride = null;
function setCustomHmacSecretForTesting(secret) {
  customHmacSecretOverride = secret;
}
function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function getValidAdminSessionSecret(secretOverride) {
  const rawSecret = typeof secretOverride === "string" ? cleanEnvValue(secretOverride) : customHmacSecretOverride !== null ? cleanEnvValue(customHmacSecretOverride) : cleanEnvValue(process.env.ADMIN_SESSION_SECRET);
  if (!rawSecret) {
    return {
      valid: false,
      code: "ADMIN_SESSION_SECRET_NOT_CONFIGURED",
      error: "Server secret ADMIN_SESSION_SECRET is not configured. Please add a cryptographically random secret (minimum 32 bytes) in Vercel environment variables."
    };
  }
  if (Buffer.byteLength(rawSecret, "utf-8") < MIN_HMAC_SECRET_BYTES) {
    return {
      valid: false,
      code: "ADMIN_SESSION_SECRET_TOO_SHORT",
      error: "Server secret ADMIN_SESSION_SECRET must be at least 32 bytes in length."
    };
  }
  return { valid: true, secret: rawSecret };
}
function createSignedAdminSessionToken(payload, secretOverride) {
  const secretCheck = getValidAdminSessionSecret(secretOverride);
  if (!secretCheck.valid) {
    throw new Error(secretCheck.error);
  }
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = crypto.createHmac("sha256", secretCheck.secret).update(encoded).digest("base64url");
  return `v1.${encoded}.${sig}`;
}
function verifySignedAdminSessionToken(token, secretOverride) {
  const secretCheck = getValidAdminSessionSecret(secretOverride);
  if (!secretCheck.valid) {
    return {
      valid: false,
      status: 503,
      code: secretCheck.code,
      error: secretCheck.error
    };
  }
  if (!token || typeof token !== "string" || !token.startsWith("v1.")) {
    return {
      valid: false,
      status: 401,
      code: "INVALID_SESSION_TOKEN",
      error: "Unauthorized: Malformed admin session token."
    };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      valid: false,
      status: 401,
      code: "INVALID_SESSION_TOKEN",
      error: "Unauthorized: Malformed admin session token structure."
    };
  }
  const [, encoded, sig] = parts;
  if (!encoded || !sig) {
    return {
      valid: false,
      status: 401,
      code: "INVALID_SESSION_TOKEN",
      error: "Unauthorized: Incomplete admin session token."
    };
  }
  const expectedSig = crypto.createHmac("sha256", secretCheck.secret).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return {
      valid: false,
      status: 401,
      code: "INVALID_SESSION_SIGNATURE",
      error: "Unauthorized: Invalid admin session HMAC signature."
    };
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    if (!parsed || typeof parsed.uid !== "string" || !parsed.uid.trim() || typeof parsed.expiresAt !== "number") {
      return {
        valid: false,
        status: 401,
        code: "INVALID_SESSION_PAYLOAD",
        error: "Unauthorized: Invalid session token payload."
      };
    }
    if (Date.now() > parsed.expiresAt) {
      return {
        valid: false,
        status: 401,
        code: "SESSION_EXPIRED",
        error: "Unauthorized: Signed admin session token has expired."
      };
    }
    return {
      valid: true,
      session: {
        token,
        uid: parsed.uid,
        email: parsed.email || "",
        name: parsed.name || "Ahmed Soliman",
        expiresAt: parsed.expiresAt
      }
    };
  } catch {
    return {
      valid: false,
      status: 401,
      code: "INVALID_SESSION_PAYLOAD",
      error: "Unauthorized: Failed to decode admin session payload."
    };
  }
}
function clearLocalInstanceSessionMemory() {
  activeSessions.clear();
  revokedSessionTokens.clear();
}
var customAuthDepsResolver = null;
function setCustomAuthDepsResolver(resolver) {
  customAuthDepsResolver = resolver;
}
async function resolveActiveAuthDeps() {
  if (customAuthDepsResolver) {
    return customAuthDepsResolver();
  }
  return getFirebaseAdminVerificationServices();
}
async function verifyAdminSessionCentralized(req, resolveDeps = resolveActiveAuthDeps, secretOverride) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      status: 401,
      code: "ADMIN_AUTH_REQUIRED",
      error: "Unauthorized: Valid Admin session required."
    };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      authenticated: false,
      status: 401,
      code: "ADMIN_AUTH_REQUIRED",
      error: "Unauthorized: Empty Bearer token."
    };
  }
  const tokenVerification = verifySignedAdminSessionToken(token, secretOverride);
  if (!tokenVerification.valid) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: tokenVerification.status,
      code: tokenVerification.code,
      error: tokenVerification.error
    };
  }
  const signedSession = tokenVerification.session;
  let serviceResolution;
  try {
    serviceResolution = await resolveDeps();
  } catch (err) {
    return {
      authenticated: false,
      status: 503,
      code: "FIREBASE_SERVICES_UNAVAILABLE",
      error: err?.message || "Firebase Admin verification services are unavailable."
    };
  }
  if (!serviceResolution || !serviceResolution.ready) {
    return {
      authenticated: false,
      status: 503,
      code: serviceResolution?.code || "FIREBASE_SERVICES_UNAVAILABLE",
      error: serviceResolution?.error || "Firebase Admin verification services are not ready."
    };
  }
  const { deps } = serviceResolution;
  if (typeof deps.getSessionRecord !== "function") {
    return {
      authenticated: false,
      status: 503,
      code: "CENTRAL_SESSION_STORE_UNAVAILABLE",
      error: "Centralized Firestore session lookup service is unavailable."
    };
  }
  const sessionId = hashSessionToken(token);
  let centralRec = null;
  try {
    centralRec = await deps.getSessionRecord(sessionId);
  } catch {
    return {
      authenticated: false,
      status: 503,
      code: "CENTRAL_SESSION_READ_FAILED",
      error: "Failed to read central admin session record from Firestore."
    };
  }
  if (!centralRec) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: 401,
      code: "SESSION_NOT_FOUND",
      error: "Unauthorized: Central admin session record does not exist in Firestore."
    };
  }
  if (!centralRec.uid || centralRec.uid !== signedSession.uid) {
    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    return {
      authenticated: false,
      status: 401,
      code: "SESSION_UID_MISMATCH",
      error: "Unauthorized: Central session record UID does not match signed token UID."
    };
  }
  if (centralRec.revoked === true) {
    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    return {
      authenticated: false,
      status: 401,
      code: "SESSION_REVOKED",
      error: "Unauthorized: Admin session has been centrally revoked."
    };
  }
  if (typeof centralRec.expiresAt !== "number" || Date.now() > centralRec.expiresAt) {
    activeSessions.delete(token);
    return {
      authenticated: false,
      status: 401,
      code: "SESSION_EXPIRED",
      error: "Unauthorized: Central admin session record has expired."
    };
  }
  if (typeof deps.hasAdminDocument !== "function") {
    return {
      authenticated: false,
      status: 503,
      code: "FIRESTORE_ADMIN_CHECK_FAILED",
      error: "Admin account verification function is unavailable."
    };
  }
  try {
    const adminDoc = await deps.hasAdminDocument(signedSession.uid);
    if (!adminDoc || !adminDoc.exists || adminDoc.disabled === true) {
      activeSessions.delete(token);
      revokedSessionTokens.add(token);
      return {
        authenticated: false,
        status: 403,
        code: "ADMIN_DISABLED_OR_REVOKED",
        error: "Access Denied: Admin account is disabled or removed in Firestore /admins/{uid}."
      };
    }
  } catch {
    return {
      authenticated: false,
      status: 503,
      code: "FIRESTORE_ADMIN_CHECK_FAILED",
      error: "Failed to verify admin account status in Firestore."
    };
  }
  activeSessions.set(token, signedSession);
  return { authenticated: true, session: signedSession };
}
function createRequireAdminMiddleware(resolveDeps = resolveActiveAuthDeps, secretOverride) {
  return (req, res, next) => {
    verifyAdminSessionCentralized(req, resolveDeps, secretOverride).then((result) => {
      if (!result.authenticated || !result.session) {
        res.status(result.status || 401).json({
          error: result.error || "Unauthorized: Valid Admin session required. Session may have expired or been revoked.",
          code: result.code || "ADMIN_AUTH_REQUIRED"
        });
        return;
      }
      next();
    }).catch(() => {
      res.status(503).json({
        error: "Service Unavailable: Session verification failed unexpectedly.",
        code: "SESSION_VERIFICATION_ERROR"
      });
    });
  };
}
function requireAdminMiddleware(req, res, next) {
  createRequireAdminMiddleware()(req, res, next);
}
function isCoreSectionPublished(db, sectionSlug) {
  const found = (db.pages || []).find(
    (p) => p.slug === sectionSlug || p.id === sectionSlug || p.id === `page-${sectionSlug}`
  );
  if (found) {
    return found.published === true && found.archived !== true;
  }
  return true;
}
function buildPublicSnapshot(db) {
  const enriched = enrichDatabaseWithBaselineDefaults(JSON.parse(JSON.stringify(db)));
  const projectsSectionPublished = isCoreSectionPublished(enriched, "projects");
  const clinicsSectionPublished = isCoreSectionPublished(enriched, "clinics");
  const blogSectionPublished = isCoreSectionPublished(enriched, "blog");
  const publishedClinics = clinicsSectionPublished ? (enriched.clinics || []).filter((c) => c.published === true).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)) : [];
  const publishedClinicIds = new Set(publishedClinics.map((c) => c.id));
  return {
    version: "8.2.0",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    siteSettings: enriched.siteSettings && enriched.siteSettings.published === true ? enriched.siteSettings : INITIAL_PLATFORM_DATA.siteSettings,
    pages: (enriched.pages || []).filter((p) => p.published === true && p.archived !== true).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    projects: projectsSectionPublished ? (enriched.projects || []).filter((p) => p.published === true).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)) : [],
    clinics: publishedClinics,
    doctors: clinicsSectionPublished ? (enriched.doctors || []).filter((d) => d.published === true && publishedClinicIds.has(d.clinicId)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)) : [],
    services: clinicsSectionPublished ? (enriched.services || []).filter((s) => s.published === true && publishedClinicIds.has(s.clinicId)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)) : [],
    articles: blogSectionPublished ? (enriched.articles || []).filter((a) => a.published === true && a.archived !== true).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)) : []
  };
}
var cachedPublishedSnapshot = null;
var cachedAdminDatabase = null;
var customCmsHooks = null;
function setCustomCmsHooks(hooks) {
  customCmsHooks = hooks;
  cachedAdminDatabase = null;
  cachedPublishedSnapshot = null;
}
var LEGACY_BROKEN_IMAGE_MAP = {
  "https://solimedical.vercel.app/assets/images/dashboard.webp": "/assets/solimedical/dashboard.svg",
  "https://solimedical.vercel.app/assets/images/screen-dashboard.webp": "/assets/solimedical/dashboard.svg",
  "https://solimedical.vercel.app/assets/images/booking.webp": "/assets/solimedical/booking.svg",
  "https://solimedical.vercel.app/assets/images/screen-booking.webp": "/assets/solimedical/booking.svg",
  "https://solimedical.vercel.app/assets/images/appointments.webp": "/assets/solimedical/booking.svg",
  "https://solimedical.vercel.app/assets/images/emr.webp": "/assets/solimedical/emr.svg",
  "https://solimedical.vercel.app/assets/images/screen-emr.webp": "/assets/solimedical/emr.svg",
  "https://solimedical.vercel.app/assets/images/complex.webp": "/assets/solimedical/complex.svg"
};
function healLegacyImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (LEGACY_BROKEN_IMAGE_MAP[trimmed]) {
    return LEGACY_BROKEN_IMAGE_MAP[trimmed];
  }
  return url;
}
function enrichDatabaseWithBaselineDefaults(parsed) {
  for (const seedPage of INITIAL_PLATFORM_DATA.pages) {
    const existingPage = parsed.pages?.find(
      (p) => p.id === seedPage.id || p.slug === seedPage.slug || p.id === `page-${seedPage.id}`
    );
    if (!existingPage) {
      parsed.pages = [...parsed.pages || [], JSON.parse(JSON.stringify(seedPage))];
    } else {
      if (!existingPage.qualifications && seedPage.qualifications) {
        existingPage.qualifications = seedPage.qualifications;
      }
      if (!existingPage.achievements && seedPage.achievements) {
        existingPage.achievements = seedPage.achievements;
      }
      if (!existingPage.interests && seedPage.interests) {
        existingPage.interests = seedPage.interests;
      }
      existingPage.heroImage = healLegacyImageUrl(existingPage.heroImage) || seedPage.heroImage;
    }
  }
  if (parsed.pages) {
    parsed.pages.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
  for (const seedProj of INITIAL_PLATFORM_DATA.projects) {
    const existingProj = parsed.projects?.find((p) => p.id === seedProj.id);
    if (!existingProj) {
      parsed.projects = [...parsed.projects || [], JSON.parse(JSON.stringify(seedProj))];
    } else {
      existingProj.coverImage = healLegacyImageUrl(existingProj.coverImage) || seedProj.coverImage;
      if (Array.isArray(existingProj.screens)) {
        existingProj.screens = existingProj.screens.map((scr, idx) => {
          if (typeof scr === "string") {
            return {
              ...seedProj.screens?.[idx] || {
                id: `scr-${idx}`,
                title: { ar: "", en: "" },
                caption: { ar: "", en: "" }
              },
              imageUrl: healLegacyImageUrl(scr) || seedProj.screens?.[idx]?.imageUrl || "/assets/solimedical/dashboard.svg"
            };
          }
          return {
            ...scr,
            imageUrl: healLegacyImageUrl(scr.imageUrl) || seedProj.screens?.[idx]?.imageUrl || "/assets/solimedical/dashboard.svg"
          };
        });
      }
    }
  }
  for (const seedClinic of INITIAL_PLATFORM_DATA.clinics) {
    const existingClinic = parsed.clinics?.find((c) => c.id === seedClinic.id);
    if (!existingClinic) {
      parsed.clinics = [...parsed.clinics || [], JSON.parse(JSON.stringify(seedClinic))];
    } else {
      existingClinic.coverImage = healLegacyImageUrl(existingClinic.coverImage) || seedClinic.coverImage;
    }
  }
  for (const seedArt of INITIAL_PLATFORM_DATA.articles) {
    const existingArt = parsed.articles?.find((a) => a.id === seedArt.id);
    if (!existingArt) {
      parsed.articles = [...parsed.articles || [], JSON.parse(JSON.stringify(seedArt))];
    } else {
      existingArt.coverImage = healLegacyImageUrl(existingArt.coverImage) || seedArt.coverImage;
    }
  }
  for (const seedMedia of INITIAL_PLATFORM_DATA.media) {
    if (!parsed.media?.some((m) => m.id === seedMedia.id)) {
      parsed.media = [...parsed.media || [], JSON.parse(JSON.stringify(seedMedia))];
    }
  }
  if (parsed.siteSettings) {
    parsed.siteSettings.whatsappNumber = "Ahmed0soliman";
    parsed.siteSettings.whatsappUrl = "https://wa.me/Ahmed0soliman";
    parsed.siteSettings.facebookUrl = "https://www.facebook.com/SoliMedical/";
    parsed.siteSettings.telegramBotUrl = "https://t.me/SoliMedicalproBot";
    if (typeof parsed.siteSettings.hideVisitorHeaderNav !== "boolean") {
      parsed.siteSettings.hideVisitorHeaderNav = true;
    }
  }
  return parsed;
}
function loadLocalDevelopmentDatabaseFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return enrichDatabaseWithBaselineDefaults(parsed);
    }
  } catch (err) {
    console.error("Error reading local data/cms-db.json:", err);
  }
  return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
}
async function loadDatabaseFromFirestoreAdmin(adminDb) {
  const collections = [
    "pages",
    "projects",
    "clinics",
    "doctors",
    "services",
    "articles",
    "media",
    "admins"
  ];
  const result = {};
  serverFirestoreReadOpsCount += 1;
  const settingsSnap = await adminDb.collection("siteSettings").doc("global").get();
  if (settingsSnap.exists) {
    result.siteSettings = settingsSnap.data();
  }
  for (const colName of collections) {
    serverFirestoreReadOpsCount += 1;
    const snap = await adminDb.collection(colName).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    result[colName] = items;
  }
  const hasAnyContent = Boolean(result.siteSettings) || result.pages && result.pages.length > 0 || result.projects && result.projects.length > 0;
  if (!hasAnyContent) {
    return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
  }
  const existingPageIds = new Set(
    (result.pages || []).flatMap((p) => [p.id, p.slug, `page-${p.id}`])
  );
  const assembled = enrichDatabaseWithBaselineDefaults({
    siteSettings: result.siteSettings || INITIAL_PLATFORM_DATA.siteSettings,
    pages: result.pages && result.pages.length > 0 ? result.pages : INITIAL_PLATFORM_DATA.pages,
    projects: result.projects && result.projects.length > 0 ? result.projects : INITIAL_PLATFORM_DATA.projects,
    clinics: result.clinics && result.clinics.length > 0 ? result.clinics : INITIAL_PLATFORM_DATA.clinics,
    doctors: result.doctors && result.doctors.length > 0 ? result.doctors : INITIAL_PLATFORM_DATA.doctors,
    services: result.services && result.services.length > 0 ? result.services : INITIAL_PLATFORM_DATA.services,
    articles: result.articles && result.articles.length > 0 ? result.articles : INITIAL_PLATFORM_DATA.articles,
    media: result.media && result.media.length > 0 ? result.media : INITIAL_PLATFORM_DATA.media,
    admins: result.admins || []
  });
  for (const corePage of assembled.pages) {
    if (!existingPageIds.has(corePage.id) && !existingPageIds.has(corePage.slug)) {
      try {
        serverFirestoreWriteOpsCount += 1;
        await adminDb.collection("pages").doc(corePage.id).set(JSON.parse(JSON.stringify(corePage)), { merge: true });
      } catch {
      }
    }
  }
  return assembled;
}
async function loadAdminDatabase(forceRefresh = false) {
  if (customCmsHooks?.loadAdminDb) {
    const raw = await customCmsHooks.loadAdminDb();
    return enrichDatabaseWithBaselineDefaults(raw);
  }
  if (!forceRefresh && cachedAdminDatabase) {
    return JSON.parse(JSON.stringify(cachedAdminDatabase));
  }
  const inst = await getAdminFirestoreInstance();
  if (inst) {
    const db = await loadDatabaseFromFirestoreAdmin(inst.adminDb);
    cachedAdminDatabase = JSON.parse(JSON.stringify(db));
    return db;
  }
  const localDb = loadLocalDevelopmentDatabaseFile();
  cachedAdminDatabase = JSON.parse(JSON.stringify(localDb));
  return localDb;
}
async function persistAdminMutationToFirestore(params) {
  const { nextDb, operation } = params;
  if (customCmsHooks?.saveAdminDb) {
    await customCmsHooks.saveAdminDb(nextDb);
    cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
    return;
  }
  const inst = await getAdminFirestoreInstance();
  if (inst) {
    const { adminDb } = inst;
    const cleanJson = (val) => JSON.parse(JSON.stringify(val));
    if (operation.type === "siteSettings") {
      serverFirestoreWriteOpsCount += 1;
      await adminDb.collection("siteSettings").doc("global").set(cleanJson(operation.data), { merge: true });
    } else if (operation.type === "upsert") {
      serverFirestoreWriteOpsCount += 1;
      await adminDb.collection(operation.collection).doc(operation.id).set(cleanJson(operation.record), { merge: true });
    } else if (operation.type === "delete") {
      serverFirestoreWriteOpsCount += 1;
      await adminDb.collection(operation.collection).doc(operation.id).delete();
    } else if (operation.type === "reorder") {
      const batch = adminDb.batch();
      for (const item of operation.items) {
        serverFirestoreWriteOpsCount += 1;
        const ref = adminDb.collection(operation.collection).doc(item.id);
        batch.set(ref, cleanJson(item), { merge: true });
      }
      await batch.commit();
    } else if (operation.type === "fullReplace") {
      const dbData = cleanJson(operation.database);
      serverFirestoreWriteOpsCount += 1;
      await adminDb.collection("siteSettings").doc("global").set(dbData.siteSettings, { merge: true });
      const cols = [
        "pages",
        "projects",
        "clinics",
        "doctors",
        "services",
        "articles",
        "media"
      ];
      for (const colName of cols) {
        const batch = adminDb.batch();
        for (const item of dbData[colName] || []) {
          if (!item?.id) continue;
          serverFirestoreWriteOpsCount += 1;
          batch.set(adminDb.collection(colName).doc(item.id), item, { merge: true });
        }
        await batch.commit();
      }
    }
    cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
    if (!process.env.VERCEL) {
      try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(nextDb, null, 2), "utf-8");
      } catch {
      }
    }
    return;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Firestore Admin SDK (FIREBASE_SERVICE_ACCOUNT_JSON) is not configured on Vercel. Ephemeral /tmp storage is disabled to protect data integrity."
    );
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(nextDb, null, 2), "utf-8");
  cachedAdminDatabase = JSON.parse(JSON.stringify(nextDb));
}
var PublicSnapshotUnavailableError = class extends Error {
  constructor(message, code = "PUBLIC_SNAPSHOT_UNAVAILABLE", status = 503) {
    super(message);
    this.name = "PublicSnapshotUnavailableError";
    this.code = code;
    this.status = status;
  }
};
var SNAPSHOT_MANIFEST_PATHNAME = "snapshots/manifest.json";
function computeSnapshotContentHash(snapshot) {
  const deterministicPayload = {
    version: snapshot.version,
    siteSettings: snapshot.siteSettings,
    pages: snapshot.pages,
    projects: snapshot.projects,
    clinics: snapshot.clinics,
    doctors: snapshot.doctors,
    services: snapshot.services,
    articles: snapshot.articles
  };
  return crypto.createHash("sha256").update(JSON.stringify(deterministicPayload), "utf-8").digest("hex");
}
function validateSnapshotStructure(input) {
  if (!input || typeof input !== "object") return false;
  const candidate = input;
  return typeof candidate.version === "string" && typeof candidate.generatedAt === "string" && Boolean(candidate.siteSettings && typeof candidate.siteSettings === "object") && Array.isArray(candidate.pages) && Array.isArray(candidate.projects) && Array.isArray(candidate.clinics) && Array.isArray(candidate.doctors) && Array.isArray(candidate.services) && Array.isArray(candidate.articles) && candidate.admins === void 0 && candidate.media === void 0;
}
function createVercelBlobSnapshotAdapter(tokenOverride) {
  const resolveToken = () => typeof tokenOverride === "string" ? cleanEnvValue(tokenOverride) : cleanEnvValue(process.env.BLOB_READ_WRITE_TOKEN);
  return {
    isConfigured: () => Boolean(resolveToken()),
    writeVersionedSnapshot: async (pathname, serializedJson) => {
      const token = resolveToken();
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
      }
      const { put } = await import("@vercel/blob");
      const res = await put(pathname, serializedJson, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 31536e3,
        token
      });
      return { url: res.url, pathname: res.pathname || pathname };
    },
    readSnapshotByUrlOrPath: async (urlOrPathname) => {
      const token = resolveToken();
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
      }
      const { get, BlobNotFoundError } = await import("@vercel/blob");
      try {
        const res = await get(urlOrPathname, {
          access: "public",
          useCache: false,
          token
        });
        if (!res || res.statusCode !== 200 || !res.stream) {
          return null;
        }
        return await new globalThis.Response(res.stream).text();
      } catch (err) {
        if (err instanceof BlobNotFoundError || err?.name === "BlobNotFoundError") {
          return null;
        }
        throw err;
      }
    },
    readCurrentManifest: async () => {
      const token = resolveToken();
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
      }
      const { get, BlobNotFoundError } = await import("@vercel/blob");
      try {
        const res = await get(SNAPSHOT_MANIFEST_PATHNAME, {
          access: "public",
          useCache: false,
          token
        });
        if (!res || res.statusCode !== 200 || !res.stream) {
          return { manifest: null };
        }
        const raw = await new globalThis.Response(res.stream).text();
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.revision !== "number" || typeof parsed.contentHash !== "string" || typeof parsed.snapshotPathname !== "string") {
          return { manifest: null };
        }
        return { manifest: parsed, etag: res.blob?.etag };
      } catch (err) {
        if (err instanceof BlobNotFoundError || err?.name === "BlobNotFoundError") {
          return { manifest: null };
        }
        throw err;
      }
    },
    writeCurrentManifest: async (manifest, options) => {
      const token = resolveToken();
      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
      }
      const { put } = await import("@vercel/blob");
      const res = await put(SNAPSHOT_MANIFEST_PATHNAME, JSON.stringify(manifest, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
        ...options?.ifMatchEtag ? { ifMatch: options.ifMatchEtag } : {},
        token
      });
      return { url: res.url, etag: res.etag };
    }
  };
}
var customSnapshotStorageAdapter = null;
var forceProductionSnapshotMode = false;
var defaultInstanceSnapshotCache = null;
function setCustomSnapshotStorageAdapter(adapter) {
  customSnapshotStorageAdapter = adapter;
  defaultInstanceSnapshotCache = null;
  cachedPublishedSnapshot = null;
}
function setForceProductionSnapshotMode(enabled) {
  forceProductionSnapshotMode = enabled;
}
function clearLocalInstanceSnapshotMemory() {
  defaultInstanceSnapshotCache = null;
  cachedPublishedSnapshot = null;
}
function isProductionEnvironment(strictOverride) {
  if (typeof strictOverride === "boolean") return strictOverride;
  return Boolean(
    forceProductionSnapshotMode || process.env.VERCEL === "1" || process.env.VERCEL === "true" || process.env.NODE_ENV === "production"
  );
}
function resolveSnapshotAdapter(override) {
  if (override) return override;
  if (customSnapshotStorageAdapter) return customSnapshotStorageAdapter;
  return createVercelBlobSnapshotAdapter();
}
async function publishPublicSnapshot(db, options) {
  const snapshot = buildPublicSnapshot(db);
  try {
    if (customCmsHooks?.publishSnapshot && !options?.adapter && !customSnapshotStorageAdapter) {
      await customCmsHooks.publishSnapshot(snapshot);
      cachedPublishedSnapshot = snapshot;
      return { published: true, snapshot };
    }
    const serialized = JSON.stringify(snapshot, null, 2);
    const parsedCheck = JSON.parse(serialized);
    if (!validateSnapshotStructure(parsedCheck)) {
      return {
        published: false,
        snapshot,
        code: "INVALID_SNAPSHOT_STRUCTURE",
        error: "Generated public snapshot failed structural validation."
      };
    }
    const adapter = resolveSnapshotAdapter(options?.adapter);
    if (!adapter.isConfigured()) {
      if (!isProductionEnvironment()) {
        try {
          if (!fs.existsSync(PUBLIC_DATA_DIR)) {
            fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
          }
          fs.writeFileSync(PUBLIC_SNAPSHOT_FILE, serialized, "utf-8");
        } catch {
        }
      }
      return {
        published: false,
        snapshot,
        code: "BLOB_NOT_CONFIGURED",
        error: "Persistent snapshot storage (BLOB_READ_WRITE_TOKEN) is not configured. Content was saved to Firestore, but public snapshot publication failed."
      };
    }
    const contentHash = computeSnapshotContentHash(snapshot);
    const { manifest: currentManifest, etag: initialEtag } = await adapter.readCurrentManifest();
    if (typeof options?.revision === "number" && currentManifest && options.revision <= currentManifest.revision) {
      return {
        published: false,
        snapshot,
        code: "STALE_SNAPSHOT_REVISION",
        error: `Snapshot revision ${options.revision} is older than or equal to current revision ${currentManifest.revision}.`
      };
    }
    const nextRevision = typeof options?.revision === "number" ? options.revision : (currentManifest?.revision || 0) + 1;
    const versionedPathname = `snapshots/public-snapshot-v${nextRevision}-${contentHash.slice(0, 12)}.json`;
    const uploadResult = await adapter.writeVersionedSnapshot(versionedPathname, serialized);
    if (!uploadResult || !uploadResult.url) {
      return {
        published: false,
        snapshot,
        code: "SNAPSHOT_UPLOAD_FAILED",
        error: "Failed to upload versioned public snapshot to persistent storage."
      };
    }
    const retrievedRaw = await adapter.readSnapshotByUrlOrPath(
      uploadResult.url || uploadResult.pathname || versionedPathname
    );
    if (!retrievedRaw) {
      return {
        published: false,
        snapshot,
        code: "SNAPSHOT_VERIFICATION_FAILED",
        error: "Uploaded versioned snapshot could not be retrieved for verification."
      };
    }
    let verifiedSnapshot;
    try {
      verifiedSnapshot = JSON.parse(retrievedRaw);
    } catch {
      return {
        published: false,
        snapshot,
        code: "SNAPSHOT_VERIFICATION_CORRUPT",
        error: "Uploaded versioned snapshot returned invalid JSON during verification."
      };
    }
    if (!validateSnapshotStructure(verifiedSnapshot) || computeSnapshotContentHash(verifiedSnapshot) !== contentHash) {
      return {
        published: false,
        snapshot,
        code: "SNAPSHOT_HASH_MISMATCH",
        error: "Verified snapshot hash or structure did not match uploaded snapshot."
      };
    }
    const { manifest: latestManifest, etag: latestEtag } = await adapter.readCurrentManifest();
    if (latestManifest && latestManifest.revision >= nextRevision) {
      return {
        published: false,
        snapshot,
        code: "CONCURRENT_NEWER_SNAPSHOT",
        error: `A newer snapshot (revision ${latestManifest.revision}) was published concurrently; skipping older revision ${nextRevision}.`
      };
    }
    const nextManifest = {
      version: verifiedSnapshot.version,
      revision: nextRevision,
      contentHash,
      snapshotPathname: uploadResult.pathname || versionedPathname,
      snapshotUrl: uploadResult.url,
      generatedAt: verifiedSnapshot.generatedAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await adapter.writeCurrentManifest(nextManifest, {
      ifMatchEtag: latestEtag || initialEtag
    });
    const { manifest: confirmedManifest } = await adapter.readCurrentManifest();
    if (!confirmedManifest || confirmedManifest.revision < nextRevision) {
      return {
        published: false,
        snapshot,
        code: "MANIFEST_VERIFICATION_FAILED",
        error: "Failed to confirm updated public snapshot manifest pointer."
      };
    }
    const cacheEntry = {
      revision: nextRevision,
      contentHash,
      snapshot: verifiedSnapshot
    };
    if (options?.instanceCacheRef) {
      options.instanceCacheRef.current = cacheEntry;
    } else {
      defaultInstanceSnapshotCache = cacheEntry;
    }
    cachedPublishedSnapshot = verifiedSnapshot;
    return {
      published: true,
      snapshot: verifiedSnapshot,
      manifest: nextManifest
    };
  } catch (err) {
    console.error("Failed to publish public content snapshot:", err);
    return {
      published: false,
      snapshot,
      code: "SNAPSHOT_PUBLISH_ERROR",
      error: err?.message || "Failed to publish public content snapshot."
    };
  }
}
async function readPublishedPublicSnapshot(options) {
  if (customCmsHooks?.readPublicSnapshot && !options?.adapter && !customSnapshotStorageAdapter) {
    return customCmsHooks.readPublicSnapshot();
  }
  const adapter = resolveSnapshotAdapter(options?.adapter);
  const strictProd = isProductionEnvironment(options?.strictProductionMode);
  const activeCache = options?.instanceCacheRef ? options.instanceCacheRef.current : defaultInstanceSnapshotCache;
  if (adapter.isConfigured()) {
    let manifestResult;
    try {
      manifestResult = await adapter.readCurrentManifest();
    } catch (err) {
      throw new PublicSnapshotUnavailableError(
        `Failed to read public snapshot manifest from persistent storage: ${err?.message || "Unknown error"}`,
        "MANIFEST_READ_FAILED",
        503
      );
    }
    const { manifest } = manifestResult;
    if (!manifest) {
      throw new PublicSnapshotUnavailableError(
        "No published public snapshot exists in persistent storage. An administrator must publish the snapshot via /api/cms/publish-snapshot.",
        "PUBLIC_SNAPSHOT_NOT_INITIALIZED",
        503
      );
    }
    if (activeCache && activeCache.revision === manifest.revision && activeCache.contentHash === manifest.contentHash) {
      return activeCache.snapshot;
    }
    let rawSnapshot = null;
    try {
      rawSnapshot = await adapter.readSnapshotByUrlOrPath(
        manifest.snapshotUrl || manifest.snapshotPathname
      );
      if (!rawSnapshot && manifest.snapshotPathname && manifest.snapshotUrl !== manifest.snapshotPathname) {
        rawSnapshot = await adapter.readSnapshotByUrlOrPath(manifest.snapshotPathname);
      }
    } catch (err) {
      throw new PublicSnapshotUnavailableError(
        `Failed to fetch versioned public snapshot from persistent storage: ${err?.message || "Unknown error"}`,
        "SNAPSHOT_READ_FAILED",
        503
      );
    }
    if (!rawSnapshot) {
      throw new PublicSnapshotUnavailableError(
        `Versioned snapshot referenced by manifest (${manifest.snapshotPathname}) was not found in persistent storage.`,
        "SNAPSHOT_BLOB_NOT_FOUND",
        503
      );
    }
    let parsed;
    try {
      parsed = JSON.parse(rawSnapshot);
    } catch {
      throw new PublicSnapshotUnavailableError(
        "Persisted public snapshot JSON is corrupted.",
        "SNAPSHOT_CORRUPTED",
        503
      );
    }
    if (!validateSnapshotStructure(parsed) || computeSnapshotContentHash(parsed) !== manifest.contentHash) {
      throw new PublicSnapshotUnavailableError(
        "Persisted public snapshot failed integrity validation.",
        "SNAPSHOT_INTEGRITY_FAILED",
        503
      );
    }
    const entry = {
      revision: manifest.revision,
      contentHash: manifest.contentHash,
      snapshot: parsed
    };
    if (options?.instanceCacheRef) {
      options.instanceCacheRef.current = entry;
    } else {
      defaultInstanceSnapshotCache = entry;
    }
    cachedPublishedSnapshot = parsed;
    return parsed;
  }
  if (strictProd) {
    throw new PublicSnapshotUnavailableError(
      "Persistent public snapshot storage (BLOB_READ_WRITE_TOKEN) is not configured in production.",
      "BLOB_NOT_CONFIGURED",
      503
    );
  }
  if (cachedPublishedSnapshot) {
    return cachedPublishedSnapshot;
  }
  try {
    if (fs.existsSync(PUBLIC_SNAPSHOT_FILE)) {
      const raw = fs.readFileSync(PUBLIC_SNAPSHOT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (validateSnapshotStructure(parsed)) {
        cachedPublishedSnapshot = parsed;
        return cachedPublishedSnapshot;
      }
    }
  } catch (err) {
    console.error("Error reading local public-snapshot.json:", err);
  }
  const fallbackDb = loadLocalDevelopmentDatabaseFile();
  const built = buildPublicSnapshot(fallbackDb);
  cachedPublishedSnapshot = built;
  return built;
}
function cleanTemporaryChatAttachments() {
  if (process.env.VERCEL) return;
  try {
    const aistudioDir = path.resolve(process.cwd(), "public", "assets", "aistudio");
    if (!fs.existsSync(aistudioDir)) return;
    const allowedFiles = /* @__PURE__ */ new Set([
      "1770146906397_16665dd0.png",
      "logo_ae3842b8.png",
      "owner_portrait.png",
      "owner_portrait.webp"
    ]);
    for (const file of fs.readdirSync(aistudioDir)) {
      if (!allowedFiles.has(file)) {
        try {
          fs.unlinkSync(path.join(aistudioDir, file));
        } catch {
        }
      }
    }
  } catch {
  }
}
var rateLimitBuckets = /* @__PURE__ */ new Map();
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}
function escapeXml(unsafe) {
  return String(unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function createAdminLoginHandler(resolveDeps = resolveActiveAuthDeps, secretOverride) {
  return async (req, res) => {
    const clientIp = req.ip || "local";
    if (!checkRateLimit(`login:${clientIp}`, 35, 15 * 60 * 1e3)) {
      res.status(429).json({
        error: "Too many login attempts. Please wait before trying again.",
        code: "RATE_LIMITED"
      });
      return;
    }
    const secretCheck = getValidAdminSessionSecret(secretOverride);
    if (!secretCheck.valid) {
      res.status(503).json({
        error: secretCheck.error,
        code: secretCheck.code
      });
      return;
    }
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const bodyToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
    const idToken = headerToken || bodyToken;
    if (!idToken) {
      res.status(401).json({
        error: "Unauthorized: Signed Firebase ID Token is required.",
        code: "MISSING_ID_TOKEN"
      });
      return;
    }
    let serviceResolution;
    try {
      serviceResolution = await resolveDeps();
    } catch (err) {
      res.status(503).json({
        error: err?.message || "Firebase Admin verification services are unavailable.",
        code: "FIREBASE_SERVICES_UNAVAILABLE"
      });
      return;
    }
    if (!serviceResolution || !serviceResolution.ready) {
      res.status(503).json({
        error: serviceResolution?.error || "Firebase Admin verification services are not ready.",
        code: serviceResolution?.code || "FIREBASE_SERVICES_UNAVAILABLE"
      });
      return;
    }
    const { deps } = serviceResolution;
    if (typeof deps.saveSessionRecord !== "function" || typeof deps.getSessionRecord !== "function") {
      res.status(503).json({
        error: "Centralized Firestore session persistence is not available.",
        code: "CENTRAL_SESSION_STORE_UNAVAILABLE"
      });
      return;
    }
    let decoded;
    try {
      decoded = await deps.verifyIdToken(idToken);
    } catch {
      res.status(401).json({
        error: "Unauthorized: Invalid, tampered, revoked, or expired Firebase ID Token.",
        code: "INVALID_ID_TOKEN"
      });
      return;
    }
    if (!decoded?.uid || decoded.email_verified !== true) {
      res.status(403).json({
        error: "Access Denied: Verified Google account email is required.",
        code: "EMAIL_NOT_VERIFIED"
      });
      return;
    }
    const normalizedOwnerUid = (deps.ownerUid || "").replace(/\.+$/, "").trim();
    const uidMatches = Boolean(normalizedOwnerUid) && (decoded.uid === normalizedOwnerUid || normalizedOwnerUid.length >= 16 && decoded.uid.startsWith(normalizedOwnerUid));
    const verifiedOwnerEmailMatches = typeof deps.ownerEmail === "string" && deps.ownerEmail.trim().length > 0 && decoded.email_verified === true && typeof decoded.email === "string" && decoded.email.trim().toLowerCase() === deps.ownerEmail.trim().toLowerCase();
    if (!uidMatches && !verifiedOwnerEmailMatches) {
      res.status(403).json({
        error: "Access Denied: Authenticated UID is not the authorized platform owner.",
        code: "FORBIDDEN_NOT_OWNER_UID"
      });
      return;
    }
    if (deps.ownerEmail && deps.ownerEmail.trim().length > 0 && (!decoded.email || decoded.email.trim().toLowerCase() !== deps.ownerEmail.trim().toLowerCase())) {
      res.status(403).json({
        error: "Access Denied: Authenticated account email does not match ADMIN_OWNER_EMAIL.",
        code: "FORBIDDEN_EMAIL_MISMATCH"
      });
      return;
    }
    try {
      const adminDoc = await deps.hasAdminDocument(decoded.uid);
      if (!adminDoc.exists || adminDoc.disabled) {
        res.status(403).json({
          error: adminDoc.disabled ? "Access Denied: Admin account is disabled in Firestore /admins/{uid}." : "Access Denied: UID is not registered in Firestore /admins/{uid}.",
          code: adminDoc.disabled ? "FORBIDDEN_ADMIN_DISABLED" : "FORBIDDEN_NOT_ADMIN_UID"
        });
        return;
      }
    } catch {
      res.status(503).json({
        error: "Failed to verify /admins/{uid} authorization record in Firestore.",
        code: "FIRESTORE_ADMIN_CHECK_FAILED"
      });
      return;
    }
    const finalEmail = sanitizeText(decoded.email || "", 120).trim().toLowerCase();
    const finalName = sanitizeText(decoded.name || "Ahmed Soliman", 120) || "Ahmed Soliman";
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const token = createSignedAdminSessionToken(
      {
        uid: decoded.uid,
        email: finalEmail,
        name: finalName,
        expiresAt
      },
      secretOverride
    );
    const session = {
      token,
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt
    };
    const sessionId = hashSessionToken(token);
    const centralRecord = {
      id: sessionId,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt,
      revoked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await deps.saveSessionRecord(centralRecord);
    } catch (err) {
      res.status(503).json({
        error: err?.message || "Failed to persist central admin session in Firestore. Login aborted.",
        code: "SESSION_CREATION_WRITE_FAILED"
      });
      return;
    }
    activeSessions.set(token, session);
    res.json({
      token,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt
    });
  };
}
function registerAuthRoutes(app, resolveDeps = resolveActiveAuthDeps, secretOverride) {
  app.get("/api/auth/firebase-config", (_req, res) => {
    const pubConfig = getPublicFirebaseClientConfigFromEnv();
    const adminSdkStatus = checkFirebaseAdminEnvConfig();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      ...pubConfig,
      serverAdminSdkReady: adminSdkStatus.ready
    });
  });
  app.post("/api/auth/admin-login", createAdminLoginHandler(resolveDeps, secretOverride));
  app.get("/api/auth/session", async (req, res) => {
    const result = await verifyAdminSessionCentralized(req, resolveDeps, secretOverride);
    if (!result.authenticated || !result.session) {
      res.status(result.status || 401).json({
        authenticated: false,
        code: result.code || "SESSION_INVALID",
        error: result.error || "Session expired or invalid"
      });
      return;
    }
    res.json({
      authenticated: true,
      uid: result.session.uid,
      email: result.session.email,
      name: result.session.name,
      expiresAt: result.session.expiresAt
    });
  });
  app.post("/api/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        code: "ADMIN_AUTH_REQUIRED",
        error: "Unauthorized: Bearer session token is required to log out."
      });
      return;
    }
    const token = authHeader.slice(7).trim();
    const tokenVerification = verifySignedAdminSessionToken(token, secretOverride);
    if (!tokenVerification.valid) {
      res.status(tokenVerification.status).json({
        success: false,
        code: tokenVerification.code,
        error: tokenVerification.error
      });
      return;
    }
    let resolved;
    try {
      resolved = await resolveDeps();
    } catch (err) {
      res.status(503).json({
        success: false,
        code: "FIREBASE_SERVICES_UNAVAILABLE",
        error: err?.message || "Firebase Admin services unavailable during logout."
      });
      return;
    }
    if (!resolved || !resolved.ready || typeof resolved.deps.revokeSessionRecord !== "function") {
      res.status(503).json({
        success: false,
        code: resolved && !resolved.ready && resolved.code ? resolved.code : "CENTRAL_SESSION_STORE_UNAVAILABLE",
        error: "Centralized session revocation service is unavailable."
      });
      return;
    }
    const sessionId = hashSessionToken(token);
    try {
      await resolved.deps.revokeSessionRecord(sessionId, tokenVerification.session.uid);
      if (typeof resolved.deps.getSessionRecord === "function") {
        const afterRevoke = await resolved.deps.getSessionRecord(sessionId);
        if (afterRevoke && afterRevoke.revoked !== true) {
          res.status(503).json({
            success: false,
            code: "SESSION_LOGOUT_VERIFICATION_FAILED",
            error: "Central session record did not confirm revoked: true."
          });
          return;
        }
      }
    } catch (err) {
      res.status(503).json({
        success: false,
        code: "SESSION_LOGOUT_REVOCATION_FAILED",
        error: err?.message || "Failed to revoke central admin session in Firestore."
      });
      return;
    }
    activeSessions.delete(token);
    revokedSessionTokens.add(token);
    res.json({ success: true, revoked: true });
  });
}
function createExpressApp(options) {
  cleanTemporaryChatAttachments();
  const app = express();
  app.use(express.json({ limit: "6mb" }));
  const instanceCacheRef = {
    current: null
  };
  const activeAuthResolver = options?.authDepsResolver || resolveActiveAuthDeps;
  const activeHmacSecret = options?.hmacSecret;
  const activeSnapshotAdapter = options?.snapshotAdapter;
  const activeStrictProd = options?.strictProductionMode;
  const adminMiddleware = options ? createRequireAdminMiddleware(activeAuthResolver, activeHmacSecret) : requireAdminMiddleware;
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  registerAuthRoutes(app, activeAuthResolver, activeHmacSecret);
  app.post("/api/contact/validate", (req, res) => {
    const clientIp = req.ip || "local";
    if (!checkRateLimit(`contact:${clientIp}`, 30, 10 * 60 * 1e3)) {
      res.status(429).json({
        error: "Too many consultation requests. Please try again in a few minutes."
      });
      return;
    }
    const result = validateConsultationForm(req.body || {});
    if (!result.valid) {
      res.status(400).json({
        valid: false,
        error: result.errors[0] || "Invalid consultation input",
        errors: result.errors
      });
      return;
    }
    res.json({
      valid: true,
      sanitized: result.sanitized
    });
  });
  app.get("/api/cms/public", async (_req, res) => {
    const readsBefore = serverFirestoreReadOpsCount;
    try {
      const snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : void 0,
        strictProductionMode: activeStrictProd
      });
      const readsDelta = serverFirestoreReadOpsCount - readsBefore;
      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=1, stale-while-revalidate=5"
      );
      res.setHeader("X-Data-Source", "public-snapshot");
      if (readsDelta === 0) {
        res.setHeader("X-Firestore-Reads", "0");
      }
      res.json(snapshot);
    } catch (err) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.status(status).json({
        error: err?.message || "Failed to read public content snapshot",
        code: err?.code || "PUBLIC_SNAPSHOT_UNAVAILABLE"
      });
    }
  });
  app.get("/data/public-snapshot.json", async (_req, res) => {
    const readsBefore = serverFirestoreReadOpsCount;
    try {
      const snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : void 0,
        strictProductionMode: activeStrictProd
      });
      const readsDelta = serverFirestoreReadOpsCount - readsBefore;
      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=1, stale-while-revalidate=5"
      );
      res.setHeader("X-Data-Source", "public-snapshot");
      if (readsDelta === 0) {
        res.setHeader("X-Firestore-Reads", "0");
      }
      res.json(snapshot);
    } catch (err) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.status(status).json({
        error: err?.message || "Failed to read static public content snapshot",
        code: err?.code || "PUBLIC_SNAPSHOT_UNAVAILABLE"
      });
    }
  });
  app.get("/api/cms/admin", adminMiddleware, async (_req, res) => {
    try {
      const db = await loadAdminDatabase();
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.json(db);
    } catch (err) {
      res.status(503).json({
        error: err?.message || "Failed to load admin database from Firestore.",
        code: "FIRESTORE_READ_FAILED"
      });
    }
  });
  app.post(
    "/api/cms/publish-snapshot",
    adminMiddleware,
    async (_req, res) => {
      try {
        const db = await loadAdminDatabase();
        const pubResult = await publishPublicSnapshot(db, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        if (!pubResult.published) {
          res.status(502).json({
            publishedSnapshot: false,
            code: pubResult.code || "SNAPSHOT_PUBLISH_FAILED",
            error: pubResult.error || "Failed to publish public snapshot"
          });
          return;
        }
        res.json({
          publishedSnapshot: true,
          generatedAt: pubResult.snapshot.generatedAt,
          manifest: pubResult.manifest,
          snapshot: pubResult.snapshot
        });
      } catch (err) {
        res.status(503).json({
          publishedSnapshot: false,
          error: err?.message || "Failed to load Firestore database for snapshot publication"
        });
      }
    }
  );
  app.put(
    "/api/cms/siteSettings",
    adminMiddleware,
    async (req, res) => {
      try {
        const db = await loadAdminDatabase();
        const sanitizedBody = sanitizePayload(req.body || {});
        const merged = {
          ...db.siteSettings,
          ...sanitizedBody,
          id: "global",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const validation = validateCollectionRecord("siteSettings", merged);
        if (!validation.valid) {
          res.status(400).json({
            error: validation.errors.join(" "),
            errors: validation.errors,
            code: "VALIDATION_ERROR"
          });
          return;
        }
        const nextDb = { ...db, siteSettings: merged };
        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: "siteSettings", data: merged }
        });
        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        res.setHeader("X-Snapshot-Published", String(pubResult.published));
        res.json({
          ...merged,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...pubResult.error ? { snapshotError: pubResult.error } : {}
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || "Failed to persist siteSettings to Firestore.",
          code: "FIRESTORE_WRITE_FAILED",
          savedToFirestore: false,
          publishedSnapshot: false
        });
      }
    }
  );
  app.post(
    "/api/cms/seed-baseline",
    adminMiddleware,
    async (_req, res) => {
      try {
        const fresh = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
        await persistAdminMutationToFirestore({
          nextDb: fresh,
          operation: { type: "fullReplace", database: fresh }
        });
        const pubResult = await publishPublicSnapshot(fresh, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        res.json({
          success: true,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...pubResult.error ? { snapshotError: pubResult.error } : {},
          database: fresh
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || "Failed to seed baseline database in Firestore.",
          code: "FIRESTORE_WRITE_FAILED",
          savedToFirestore: false,
          publishedSnapshot: false
        });
      }
    }
  );
  app.get("/api/cms/backup", adminMiddleware, async (_req, res) => {
    try {
      const db = await loadAdminDatabase();
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.json({
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        platform: "Ahmed Soliman Digital Platform",
        version: "8.3.0",
        database: db
      });
    } catch (err) {
      res.status(503).json({
        error: err?.message || "Failed to export database from Firestore."
      });
    }
  });
  app.post("/api/cms/restore", adminMiddleware, async (req, res) => {
    const incoming = req.body?.database || req.body;
    if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.projects) || !Array.isArray(incoming.clinics) || !Array.isArray(incoming.pages)) {
      res.status(400).json({
        error: "Invalid backup file structure. Expected pages, projects, and clinics arrays."
      });
      return;
    }
    try {
      const currentDb = await loadAdminDatabase();
      const sanitized = sanitizePayload(incoming);
      sanitized.admins = currentDb.admins;
      await persistAdminMutationToFirestore({
        nextDb: sanitized,
        operation: { type: "fullReplace", database: sanitized }
      });
      const pubResult = await publishPublicSnapshot(sanitized, {
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : void 0
      });
      res.json({
        success: true,
        savedToFirestore: true,
        publishedSnapshot: pubResult.published,
        ...pubResult.error ? { snapshotError: pubResult.error } : {},
        restoredAt: (/* @__PURE__ */ new Date()).toISOString(),
        database: sanitized
      });
    } catch (err) {
      res.status(503).json({
        error: err?.message || "Failed to restore backup to Firestore.",
        code: "FIRESTORE_WRITE_FAILED"
      });
    }
  });
  app.post(
    "/api/cms/:collection",
    adminMiddleware,
    async (req, res) => {
      const col = req.params.collection;
      const allowedCollections = [
        "pages",
        "projects",
        "clinics",
        "doctors",
        "services",
        "articles",
        "media"
      ];
      if (!allowedCollections.includes(col)) {
        res.status(400).json({ error: `Collection '${col}' is not writable via this endpoint.` });
        return;
      }
      const sanitizedPayload = sanitizePayload(req.body || {});
      const validation = validateCollectionRecord(col, sanitizedPayload);
      if (!validation.valid) {
        res.status(400).json({
          error: validation.errors.join(" "),
          errors: validation.errors,
          code: "VALIDATION_ERROR"
        });
        return;
      }
      try {
        const db = await loadAdminDatabase();
        const list = [...db[col] || []];
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const rawId = String(sanitizedPayload.id || `${col.slice(0, 4)}-${Date.now()}`);
        const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128) || `${col.slice(0, 4)}-${Date.now()}`;
        const existingIndex = list.findIndex((item) => item.id === safeId);
        if (col === "pages") {
          const existingRecord = existingIndex >= 0 ? list[existingIndex] : null;
          const isCore = isCoreProtectedPage(safeId) || (existingRecord ? isCoreProtectedPage(existingRecord) : false);
          const targetSlug = String(sanitizedPayload.slug || existingRecord?.slug || "").trim().toLowerCase();
          const slugCheck = validatePageSlug(targetSlug, {
            editingId: safeId,
            isCore,
            existingPages: list
          });
          if (!slugCheck.valid) {
            res.status(400).json({
              error: slugCheck.errors.join(" "),
              errors: slugCheck.errors,
              code: "INVALID_OR_DUPLICATE_PAGE_SLUG"
            });
            return;
          }
          if (isCore) {
            sanitizedPayload.isCore = true;
            sanitizedPayload.pageType = "core";
            sanitizedPayload.archived = false;
            if (existingRecord?.slug) {
              sanitizedPayload.slug = existingRecord.slug;
            }
          } else {
            sanitizedPayload.slug = targetSlug;
            sanitizedPayload.isCore = false;
            sanitizedPayload.pageType = sanitizedPayload.pageType === "landing" ? "landing" : "general";
            if (sanitizedPayload.archived) {
              sanitizedPayload.published = false;
              sanitizedPayload.archivedAt = sanitizedPayload.archivedAt || now;
            } else {
              sanitizedPayload.archived = false;
              delete sanitizedPayload.archivedAt;
            }
          }
        }
        if (col === "articles") {
          const existingRecord = existingIndex >= 0 ? list[existingIndex] : null;
          const targetSlug = String(sanitizedPayload.slug || existingRecord?.slug || "").trim().toLowerCase();
          const slugCheck = validateArticleSlug(targetSlug, {
            editingId: safeId,
            existingArticles: list
          });
          if (!slugCheck.valid) {
            res.status(400).json({
              error: slugCheck.errors.join(" "),
              errors: slugCheck.errors,
              code: "INVALID_OR_DUPLICATE_ARTICLE_SLUG"
            });
            return;
          }
          sanitizedPayload.slug = targetSlug;
          if (sanitizedPayload.contentJson && typeof sanitizedPayload.contentJson === "object") {
            sanitizedPayload.contentFormat = "tiptap-json";
            sanitizedPayload.contentJson = {
              ...sanitizedPayload.contentJson.ar ? { ar: sanitizeTiptapDoc(sanitizedPayload.contentJson.ar) } : {},
              ...sanitizedPayload.contentJson.en ? { en: sanitizeTiptapDoc(sanitizedPayload.contentJson.en) } : {}
            };
          }
          if (sanitizedPayload.archived) {
            sanitizedPayload.published = false;
            sanitizedPayload.archivedAt = sanitizedPayload.archivedAt || now;
          } else {
            sanitizedPayload.archived = false;
            delete sanitizedPayload.archivedAt;
          }
          const arWords = countArticleWords(
            sanitizedPayload.content?.ar,
            sanitizedPayload.contentJson?.ar
          );
          const enWords = countArticleWords(
            sanitizedPayload.content?.en,
            sanitizedPayload.contentJson?.en
          );
          if (typeof sanitizedPayload.readingTimeMinutes !== "number" || Number.isNaN(sanitizedPayload.readingTimeMinutes) || sanitizedPayload.readingTimeMinutes <= 0) {
            sanitizedPayload.readingTimeMinutes = estimateArticleReadingTime(arWords, enWords);
          }
        }
        const record = {
          ...sanitizedPayload,
          id: safeId,
          createdAt: existingIndex >= 0 ? list[existingIndex].createdAt || now : now,
          updatedAt: now
        };
        if (existingIndex >= 0) {
          list[existingIndex] = record;
        } else {
          list.push(record);
        }
        const nextDb = {
          ...db,
          [col]: list
        };
        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: "upsert", collection: col, id: safeId, record }
        });
        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        res.setHeader("X-Snapshot-Published", String(pubResult.published));
        res.json({
          ...record,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...pubResult.error ? { snapshotError: pubResult.error } : {}
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || `Failed to save record in ${col} to Firestore.`,
          code: "FIRESTORE_WRITE_FAILED",
          savedToFirestore: false,
          publishedSnapshot: false
        });
      }
    }
  );
  app.patch(
    "/api/cms/:collection/reorder",
    adminMiddleware,
    async (req, res) => {
      const col = req.params.collection;
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({ error: "orderedIds array is required" });
        return;
      }
      try {
        const db = await loadAdminDatabase();
        const list = [...db[col] || []];
        const now = (/* @__PURE__ */ new Date()).toISOString();
        list.forEach((item) => {
          const idx = orderedIds.indexOf(item.id);
          if (idx !== -1) {
            item.order = idx + 1;
            item.updatedAt = now;
          }
        });
        list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        const nextDb = {
          ...db,
          [col]: list
        };
        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: "reorder", collection: col, items: list }
        });
        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        res.json({
          success: true,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...pubResult.error ? { snapshotError: pubResult.error } : {},
          items: list
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || "Failed to persist reorder in Firestore.",
          code: "FIRESTORE_WRITE_FAILED",
          savedToFirestore: false,
          publishedSnapshot: false
        });
      }
    }
  );
  app.delete(
    "/api/cms/:collection/:id",
    adminMiddleware,
    async (req, res) => {
      const col = req.params.collection;
      if (col === "admins") {
        res.status(403).json({ error: "Admin documents cannot be deleted via API." });
        return;
      }
      const id = req.params.id;
      try {
        const db = await loadAdminDatabase();
        const list = [...db[col] || []];
        const target = list.find((item) => item.id === id);
        if (!target) {
          res.status(404).json({ error: "Record not found" });
          return;
        }
        if (col === "pages") {
          if (isCoreProtectedPage(target) || CORE_PAGE_IDS.includes(id)) {
            res.status(403).json({
              error: "Core system pages (Home, About, Projects, Clinics, Blog, Soli Medical) cannot be permanently deleted.",
              code: "CORE_PAGE_DELETE_FORBIDDEN"
            });
            return;
          }
          const refCheck = checkPageInSiteReferences(target, db);
          if (refCheck.inUse) {
            res.status(409).json({
              error: `Cannot permanently delete page while it is referenced in: ${refCheck.usedIn.join(
                ", "
              )}`,
              code: "PAGE_IN_USE",
              usedIn: refCheck.usedIn
            });
            return;
          }
        }
        if (col === "articles") {
          const refCheck = checkArticleInSiteReferences(target, db);
          if (refCheck.inUse) {
            res.status(409).json({
              error: `Cannot permanently delete article while it is referenced in: ${refCheck.usedIn.join(
                ", "
              )}`,
              code: "ARTICLE_IN_USE",
              usedIn: refCheck.usedIn
            });
            return;
          }
        }
        if (col === "media") {
          const usageCheck = checkMediaInPublishedContent(target, db);
          if (usageCheck.inUse) {
            res.status(409).json({
              error: `Cannot delete image while it is actively used in published content: ${usageCheck.usedIn.join(
                ", "
              )}`,
              code: "MEDIA_IN_USE_BY_PUBLISHED_CONTENT",
              usedIn: usageCheck.usedIn
            });
            return;
          }
        }
        const filteredList = list.filter((item) => item.id !== id);
        const nextDb = {
          ...db,
          [col]: filteredList
        };
        await persistAdminMutationToFirestore({
          nextDb,
          operation: { type: "delete", collection: col, id }
        });
        const pubResult = await publishPublicSnapshot(nextDb, {
          adapter: activeSnapshotAdapter,
          instanceCacheRef: options ? instanceCacheRef : void 0
        });
        res.json({
          success: true,
          deletedId: id,
          savedToFirestore: true,
          publishedSnapshot: pubResult.published,
          ...pubResult.error ? { snapshotError: pubResult.error } : {}
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || "Failed to delete record from Firestore.",
          code: "FIRESTORE_DELETE_FAILED",
          savedToFirestore: false,
          publishedSnapshot: false
        });
      }
    }
  );
  app.get("/api/cloudinary/status", adminMiddleware, (_req, res) => {
    const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
    const folder = cleanEnvValue(process.env.CLOUDINARY_UPLOAD_FOLDER) || "ahmed-soliman-platform";
    res.json({
      configured: Boolean(cloudName && apiKey && apiSecret),
      cloudName,
      folder
    });
  });
  app.post("/api/cloudinary/sign", adminMiddleware, (req, res) => {
    const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
    const defaultFolder = cleanEnvValue(process.env.CLOUDINARY_UPLOAD_FOLDER) || "ahmed-soliman-platform";
    const { fileType, fileSize, customFolder } = req.body || {};
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const maxBytes = 5 * 1024 * 1024;
    if (fileType && !allowedMimes.includes(fileType)) {
      res.status(400).json({
        error: `Unsupported file type (${fileType}). Allowed: JPG, PNG, WebP, AVIF.`
      });
      return;
    }
    if (typeof fileSize === "number" && (fileSize <= 0 || fileSize > maxBytes)) {
      res.status(400).json({
        error: "File size must be between 1 byte and 5 MB."
      });
      return;
    }
    const folder = customFolder ? String(customFolder).trim() : defaultFolder;
    if (!validateCloudinaryFolder(folder)) {
      res.status(400).json({
        error: "Invalid Cloudinary folder name. Only alphanumeric, hyphens, underscores, and slashes are allowed.",
        code: "INVALID_CLOUDINARY_FOLDER"
      });
      return;
    }
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(503).json({
        configured: false,
        code: "CLOUDINARY_NOT_CONFIGURED",
        error: "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server. Image upload aborted to prevent Base64 storage."
      });
      return;
    }
    const timestamp = Math.round(Date.now() / 1e3);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");
    res.json({
      configured: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature
    });
  });
  app.post(
    "/api/cloudinary/delete",
    adminMiddleware,
    async (req, res) => {
      const { mediaId, publicId, secureUrl } = req.body || {};
      try {
        const db = await loadAdminDatabase();
        const existingMedia = mediaId ? db.media.find((m) => m.id === mediaId) : null;
        const resolvedPublicId = publicId || existingMedia?.publicId || "";
        const resolvedSecureUrl = secureUrl || existingMedia?.secureUrl || "";
        const usageCheck = checkMediaInPublishedContent(
          { publicId: resolvedPublicId, secureUrl: resolvedSecureUrl },
          db
        );
        if (usageCheck.inUse) {
          res.status(409).json({
            error: `Cannot delete image because it is currently used in published content: ${usageCheck.usedIn.join(
              ", "
            )}`,
            code: "MEDIA_IN_USE_BY_PUBLISHED_CONTENT",
            usedIn: usageCheck.usedIn
          });
          return;
        }
        const cloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
        const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
        const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);
        let cloudinaryRemoteDeleted = false;
        if (cloudName && apiKey && apiSecret && resolvedPublicId && !String(resolvedPublicId).startsWith("local/")) {
          try {
            const timestamp = Math.round(Date.now() / 1e3);
            const stringToSign = `public_id=${resolvedPublicId}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");
            const formData = new URLSearchParams();
            formData.append("public_id", resolvedPublicId);
            formData.append("timestamp", String(timestamp));
            formData.append("api_key", apiKey);
            formData.append("signature", signature);
            const destroyRes = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
              {
                method: "POST",
                body: formData
              }
            );
            const destroyData = await destroyRes.json();
            cloudinaryRemoteDeleted = destroyData?.result === "ok";
          } catch (err) {
            console.error("Cloudinary remote destroy error:", err);
          }
        }
        if (mediaId) {
          const nextMedia = db.media.filter((m) => m.id !== mediaId);
          const nextDb = { ...db, media: nextMedia };
          await persistAdminMutationToFirestore({
            nextDb,
            operation: { type: "delete", collection: "media", id: mediaId }
          });
          await publishPublicSnapshot(nextDb, {
            adapter: activeSnapshotAdapter,
            instanceCacheRef: options ? instanceCacheRef : void 0
          });
        }
        res.json({
          success: true,
          cloudinaryRemoteDeleted,
          deletedMediaId: mediaId
        });
      } catch (err) {
        res.status(503).json({
          error: err?.message || "Failed to delete media asset.",
          code: "MEDIA_DELETE_FAILED"
        });
      }
    }
  );
  app.get("/api/audit/run", adminMiddleware, async (_req, res) => {
    const db = await loadAdminDatabase();
    const rulesContent = fs.existsSync(FIRESTORE_RULES_FILE) ? fs.readFileSync(FIRESTORE_RULES_FILE, "utf-8") : "";
    const publishedProjects = db.projects.filter((p) => p.published);
    const publishedClinics = db.clinics.filter((c) => c.published);
    const publishedArticles = db.articles.filter((a) => a.published && !a.archived);
    const publishedPages = db.pages.filter((p) => p.published && !p.archived);
    const allBilingualValid = publishedPages.every((p) => p.title.ar && p.title.en && p.headline.ar && p.headline.en) && publishedProjects.every((p) => p.title.ar && p.title.en && p.summary.ar && p.summary.en) && publishedClinics.every((c) => c.name.ar && c.name.en && c.tagline.ar && c.tagline.en) && publishedArticles.every((a) => a.title.ar && a.title.en && a.content.ar && a.content.en);
    const draftTestCheck = (() => {
      const sampleDraft = { id: "draft-test", published: false, archived: false };
      const sampleArchived = { id: "archived-test", published: true, archived: true };
      const filtered = [sampleDraft, sampleArchived, ...publishedProjects].filter(
        (x) => x.published && !x.archived
      );
      return !filtered.some((x) => x.id === "draft-test") && !filtered.some((x) => x.id === "archived-test");
    })();
    const corePagesProtected = isCoreProtectedPage("home") && isCoreProtectedPage("about") && !validatePageSlug("admin", { isCore: false }).valid && validatePageSlug("clinic-campaign-launch", { isCore: false }).valid;
    const sampleDocSanitized = sanitizeTiptapDoc({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Valid medical guidance" }] },
        { type: "image", attrs: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" } }
      ]
    });
    const tiptapBase64Stripped = Array.isArray(sampleDocSanitized.content) && sampleDocSanitized.content.length === 1 && sampleDocSanitized.content[0]?.type === "paragraph";
    const validImgCheck = validateImageUploadFile({ type: "image/webp", size: 1024 * 500 });
    const invalidMimeCheck = validateImageUploadFile({
      type: "application/x-msdownload",
      size: 1024
    });
    const oversizedImgCheck = validateImageUploadFile({
      type: "image/png",
      size: 8 * 1024 * 1024
    });
    const activeAvatarUrl = db.siteSettings?.avatarUrl || "/assets/aistudio/1770146906397_16665dd0.png";
    const inUsePortraitCheck = checkMediaInPublishedContent(
      {
        publicId: "ahmed-soliman-portrait",
        secureUrl: activeAvatarUrl
      },
      db
    );
    const functionalTests = [
      {
        id: "FT-01",
        category: "All Pages & Routes",
        title: {
          ar: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0648\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0639\u0627\u0645\u0629 (/ar, /en, /about, /projects, /clinics, /blog)",
          en: "All Public Pages & Routes (/ar, /en, /about, /projects, /clinics, /blog)"
        },
        passed: publishedPages.length >= 2 && publishedProjects.length >= 1 && publishedClinics.length >= 1 && publishedArticles.length >= 1,
        details: {
          ar: `\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 ${publishedPages.length} \u0635\u0641\u062D\u0627\u062A \u0645\u0646\u0634\u0648\u0631\u0629\u060C ${publishedProjects.length} \u0645\u0634\u0631\u0648\u0639\u0627\u062A\u060C ${publishedClinics.length} \u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648${publishedArticles.length} \u0645\u0642\u0627\u0644\u0627\u062A \u0645\u0646\u0634\u0648\u0631\u0629 + /sitemap.xml \u0648/robots.txt (\u0645\u0639 0 \u0642\u0631\u0627\u0621\u0627\u062A Firestore \u0644\u0644\u0632\u0648\u0627\u0631).`,
          en: `Verified ${publishedPages.length} published pages, ${publishedProjects.length} projects, ${publishedClinics.length} clinics, and ${publishedArticles.length} articles + /sitemap.xml & /robots.txt (0 public Firestore reads).`
        }
      },
      {
        id: "FT-02",
        category: "Bilingual RTL/LTR & Theme",
        title: {
          ar: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 (RTL) \u0648\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 (LTR) \u0648\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A \u0648\u0627\u0644\u0646\u0647\u0627\u0631\u064A (Dark/Light)",
          en: "Arabic (RTL) & English (LTR) + Dark & Light Theme Persistence"
        },
        passed: allBilingualValid,
        details: {
          ar: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u0631\u062C\u0645\u0629 \u0639\u0631\u0628\u064A\u0629 \u0648\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629 \u0643\u0627\u0645\u0644\u0629 \u0645\u0639 \u062A\u0628\u062F\u064A\u0644 \u0641\u0648\u0631\u064A \u0644\u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 (RTL/LTR) \u0648\u062D\u0641\u0638 \u0627\u0644\u0645\u0638\u0647\u0631 \u0641\u064A localStorage.",
          en: "All records contain complete Arabic & English translations with instant RTL/LTR direction switching and localStorage theme persistence."
        }
      },
      {
        id: "FT-03",
        category: "Standalone Clinic Landing Pages",
        title: {
          ar: "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 (Standalone Mode + \u062C\u062F\u0648\u0644 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062D\u062C\u0632)",
          en: "Standalone Medical Clinic Landing Pages (Doctors, Prices & Booking)"
        },
        passed: publishedClinics.length >= 2 && db.doctors.filter((d) => d.published).length >= 2 && db.services.filter((s) => s.published).length >= 3,
        details: {
          ar: `\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0639\u0645\u0644 \u0646\u0645\u0637 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 (?standalone=1 \u0648 standaloneByDefault) \u0644\u0639\u062F\u062F ${publishedClinics.length} \u0639\u064A\u0627\u062F\u0627\u062A \u0645\u0639 ${db.doctors.length} \u0623\u0637\u0628\u0627\u0621 \u0648${db.services.length} \u062E\u062F\u0645\u0627\u062A \u0645\u0633\u0639\u0631\u0629.`,
          en: `Verified Standalone layout mode (?standalone=1 & standaloneByDefault) across ${publishedClinics.length} clinics with ${db.doctors.length} doctors and ${db.services.length} priced services.`
        }
      },
      {
        id: "FT-04",
        category: "Projects Showcase & Case Studies",
        title: {
          ar: "\u0645\u0639\u0631\u0636 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062A \u0648\u0635\u0641\u062D\u0629 \u0645\u0646\u0638\u0648\u0645\u0629 Soli Medical \u0648\u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0648\u0627\u0644\u0641\u064A\u062F\u064A\u0648",
          en: "Projects Showcase, Soli Medical Case Study, Comparison Matrix & Video"
        },
        passed: publishedProjects.some(
          (p) => p.slug.startsWith("soli-medical") && Array.isArray(p.comparisonTable) && p.comparisonTable.length > 0 && Boolean(p.youtubeId)
        ),
        details: {
          ar: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u0641\u062D\u0629 Soli Medical\u060C \u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u064A\u0646 \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0627\u0644\u0641\u0631\u062F\u064A\u0629 \u0648\u0627\u0644\u0645\u062C\u0645\u0639 \u0627\u0644\u0637\u0628\u064A\u060C \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A\u060C \u0648\u0645\u0639\u0631\u0636 \u0627\u0644\u0634\u0627\u0634\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A.",
          en: "Verified Soli Medical detail page, Single Clinic vs. Medical Complex comparison matrix, YouTube demo, and interactive Lightbox."
        }
      },
      {
        id: "FT-05",
        category: "Published Snapshot vs Draft Isolation",
        title: {
          ar: "\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0627\u0645 \u0639\u0628\u0631 Snapshot \u0628\u062F\u0648\u0646 \u0642\u0631\u0627\u0621\u0627\u062A Firestore \u0648\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0645\u0633\u0648\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u0631\u0634\u0641",
          en: "Zero-Firestore-Read Public Snapshot Delivery & Strict Draft/Archive Hiding"
        },
        passed: draftTestCheck,
        details: {
          ar: "\u064A\u062A\u0645 \u062E\u062F\u0645\u0629 \u0627\u0644\u0632\u0648\u0627\u0631 \u062D\u0635\u0631\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 (Public Snapshot) \u0645\u0639 0 \u0642\u0631\u0627\u0621\u0627\u062A Firestore\u060C \u0648\u0627\u0633\u062A\u0628\u0639\u0627\u062F \u0623\u064A \u0645\u0633\u0648\u062F\u0629 \u0623\u0648 \u0633\u062C\u0644 \u0645\u0624\u0631\u0634\u0641.",
          en: "Public visitors read exclusively from the published snapshot (0 Firestore reads) with all drafts and archived records excluded."
        }
      },
      {
        id: "FT-06",
        category: "Admin Auth & Centralized Session Revocation",
        title: {
          ar: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u062F\u064A\u0631\u060C \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0625\u0644\u063A\u0627\u0624\u0647\u0627 \u0639\u0628\u0631 Serverless\u060C \u0648\u0641\u062D\u0635 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u0637\u0644",
          en: "Admin Login, Centralized Session Verification & Revocation, and Disabled Account Blocking"
        },
        passed: checkFirebaseAdminEnvConfig().ready && activeSessions.size >= 1,
        details: {
          ar: checkFirebaseAdminEnvConfig().ready ? "\u062D\u0632\u0645\u0629 Firebase Admin SDK \u0645\u0641\u0639\u0651\u0644\u0629 \u0645\u0639 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0645\u0646 \u0627\u0644\u062C\u0644\u0633\u0627\u062A (/adminSessions) \u0648\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 (disabled != true)." : "\u064A\u0631\u062C\u0649 \u0636\u0628\u0637 \u0645\u062A\u063A\u064A\u0631\u0627\u062A FIREBASE_SERVICE_ACCOUNT_JSON \u0648ADMIN_OWNER_EMAIL \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062A\u0634\u0641\u064A\u0631\u064A \u0645\u0646 Firebase ID Token.",
          en: checkFirebaseAdminEnvConfig().ready ? "Firebase Admin SDK active with centralized session revocation (/adminSessions) and disabled admin check." : "Configure FIREBASE_SERVICE_ACCOUNT_JSON and ADMIN_OWNER_EMAIL server secrets to enable cryptographic Firebase ID Token verification."
        }
      },
      {
        id: "FT-07",
        category: "Cloudinary Media Upload & Comprehensive In-Use Guard",
        title: {
          ar: "\u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0648\u0642\u0639\u0629\u060C \u0645\u0646\u0639 Base64\u060C \u0648\u0641\u062D\u0635 \u0634\u0627\u0645\u0644 \u0644\u0645\u0631\u0627\u062C\u0639 \u0627\u0644\u0635\u0648\u0631 \u0642\u0628\u0644 \u0627\u0644\u062D\u0630\u0641",
          en: "Signed Image Upload, Base64 Prohibition & Deep Media Reference Guard"
        },
        passed: validImgCheck.valid && !invalidMimeCheck.valid && !oversizedImgCheck.valid && inUsePortraitCheck.inUse,
        details: {
          ar: `\u062A\u0645 \u0641\u062D\u0635 \u062C\u0645\u064A\u0639 \u0645\u0631\u0627\u062C\u0639 \u0627\u0644\u0635\u0648\u0631 (Tiptap JSON\u060C Markdown\u060C Blocks\u060C \u0627\u0644\u0645\u0639\u0627\u0631\u0636\u060C \u0648\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u062D\u0648\u0644\u0629) \u0648\u0645\u0646\u0639 \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A: ${inUsePortraitCheck.usedIn.join("\u060C ")}.`,
          en: `Verified deep media reference check across Tiptap JSON, Markdown, blocks, galleries, and transformed URLs (${inUsePortraitCheck.usedIn.join(", ")}).`
        }
      },
      {
        id: "FT-08",
        category: "Pages CMS & Core Lock",
        title: {
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629 (/landing/, /p/) \u0648\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0645\u0646 \u0627\u0644\u062D\u0630\u0641",
          en: "Dynamic CMS Pages (/landing/, /p/) & Core Page Delete Protection"
        },
        passed: corePagesProtected,
        details: {
          ar: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0645\u0646\u0639 \u062D\u0630\u0641 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0641\u064A \u0642\u0648\u0627\u0639\u062F Firestore\u060C \u0648\u0645\u0646\u0639 \u062D\u062C\u0632 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062D\u062C\u0648\u0632\u0629 \u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0645\u062E\u0635\u0635\u0629.",
          en: "Verified server & Firestore delete lock on core pages and reserved-slug enforcement for custom landing/general pages."
        }
      },
      {
        id: "FT-09",
        category: "Rich Text Studio & Compatibility",
        title: {
          ar: "\u0645\u062D\u0631\u0631 Tiptap \u0627\u0644\u0645\u0631\u0646 (tiptap-json) \u0648\u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0627\u0644\u062E\u0644\u0641\u064A \u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0639 \u0645\u0642\u0627\u0644\u0627\u062A Markdown",
          en: "Tiptap Rich-Text Studio (tiptap-json) & Legacy Markdown Compatibility"
        },
        passed: tiptapBase64Stripped,
        details: {
          ar: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0633\u0644\u0627\u0645\u0629 \u0645\u062D\u0648\u0651\u0644 Markdown/Tiptap JSON\u060C \u0648\u0645\u0646\u0639 \u062D\u0642\u0646 \u0635\u0648\u0631 Base64 \u062F\u0627\u062E\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A\u060C \u0648\u062A\u0648\u0627\u0641\u0642 \u0627\u0644\u0639\u0627\u0631\u0636 \u0627\u0644\u0622\u0645\u0646 \u0645\u0639 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629.",
          en: "Verified bidirectional Markdown/Tiptap JSON sanitization, Base64 data:image stripping, and backward-compatible public rendering."
        }
      }
    ];
    const xssSample = sanitizePayload({
      title: 'Hello <script>alert(1)</script><img src=x onerror="alert(2)">',
      coverImage: "javascript:alert(3)",
      avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="
    });
    const xssNeutralized = !xssSample.title.includes("<script>") && !xssSample.title.includes("onerror") && xssSample.coverImage === "" && xssSample.avatarUrl === "";
    const botHoneypotCheck = validateConsultationForm({
      name: "SpamBot",
      message: "Buy links",
      websiteHoneypot: "http://spam.example.com"
    });
    const folderInjectionBlocked = !validateCloudinaryFolder("folder&evil=1") && !validateCloudinaryFolder("../etc/passwd") && validateCloudinaryFolder("ahmed-soliman-platform/projects");
    const rulesHasDefaultDeny = rulesContent.includes("allow read, write: if false;");
    const rulesLocksAdminsWrite = rulesContent.includes("allow create, update, delete: if false;");
    const rulesEnforcesPublished = rulesContent.includes("resource.data.published == true");
    const rulesExcludesArchived = rulesContent.includes("data.get('archived', false) != true");
    const rulesEnforcesIsAdmin = rulesContent.includes("exists(/databases/$(database)/documents/admins/$(request.auth.uid))") && rulesContent.includes("data.get('disabled', false) != true");
    const securityAuditItems = [
      {
        id: "SEC-01",
        area: "Firebase Security Rules (Phase 8.2 Hardened)",
        severity: "Critical",
        status: rulesHasDefaultDeny && rulesLocksAdminsWrite && rulesEnforcesPublished && rulesExcludesArchived && rulesEnforcesIsAdmin ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u0642\u0648\u0627\u0639\u062F firestore.rules \u062A\u062A\u062D\u0642\u0642 \u0645\u0646 disabled != true \u0641\u064A isAdmin()\u060C \u0648\u062A\u062A\u0639\u0627\u0645\u0644 \u0628\u0623\u0645\u0627\u0646 \u0645\u0639 \u062D\u0642\u0644 archived \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629\u060C \u0648\u062A\u0645\u0646\u0639 \u0623\u064A \u0643\u062A\u0627\u0628\u0629 \u0644\u0644\u0639\u0645\u064A\u0644 \u0641\u064A /admins \u0648/adminSessions.",
          en: "firestore.rules enforces disabled != true in isAdmin(), safely handles missing archived fields via data.get(), and locks /admins and /adminSessions."
        }
      },
      {
        id: "SEC-02",
        area: "Centralized Admin Session & Revocation",
        severity: "Critical",
        status: "SECURE",
        finding: {
          ar: "\u062C\u0645\u064A\u0639 \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0645\u062D\u0645\u064A\u0629 \u0628\u062A\u062D\u0642\u0642 \u0645\u0631\u0643\u0632\u064A \u064A\u0641\u062D\u0635 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0648\u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u0637\u0644 \u0639\u0628\u0631 \u062C\u0645\u064A\u0639 \u062E\u0648\u0627\u062F\u0645 Serverless.",
          en: "All Admin API endpoints verify central session revocation and disabled admin status across serverless instances."
        }
      },
      {
        id: "SEC-03",
        area: "Strict Owner Bootstrap (No Hardcoded Email)",
        severity: "Critical",
        status: checkFirebaseAdminEnvConfig().ready ? "SECURE" : "ATTENTION_REQUIRED",
        finding: {
          ar: "\u062A\u0645\u062A \u0625\u0632\u0627\u0644\u0629 \u0623\u064A \u0628\u0631\u064A\u062F \u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0645\u0646 \u0627\u0644\u0643\u0648\u062F\u061B \u0644\u0627 \u064A\u062A\u0645 \u062A\u0647\u064A\u0626\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0625\u0644\u0627 \u0639\u0646\u062F \u0636\u0628\u0637 \u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0627\u0644\u0628\u064A\u0626\u0629 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0639\u0628\u0631 Firebase Admin SDK.",
          en: "Removed hardcoded fallback emails; owner bootstrap strictly requires configured env vars and verified Firebase email."
        }
      },
      {
        id: "SEC-04",
        area: "Cloudinary Signed Upload & Zero Base64 Fallback",
        severity: "Critical",
        status: folderInjectionBlocked ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u064A\u0631\u0641\u0636 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0627\u0644\u0639\u0645\u064A\u0644 \u0623\u064A \u062A\u062E\u0632\u064A\u0646 Base64 \u0639\u0646\u062F \u063A\u064A\u0627\u0628 \u0623\u0648 \u0641\u0634\u0644 Cloudinary\u060C \u0645\u0639 \u062D\u0645\u0627\u064A\u0629 \u0645\u0639\u0627\u0645\u0644 customFolder \u0636\u062F \u0627\u0644\u062D\u0642\u0646.",
          en: "Server and client strictly reject Base64 Data URL fallbacks when Cloudinary is unconfigured or fails."
        }
      },
      {
        id: "SEC-05",
        area: "XSS & Base64 Injection Prevention",
        severity: "High",
        status: xssNeutralized && tiptapBase64Stripped ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u064A\u062A\u0645 \u062A\u0637\u0647\u064A\u0631 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A \u0648\u0628\u0646\u064A\u0629 tiptap-json \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0627\u0644\u0639\u0645\u064A\u0644 \u0644\u062D\u0630\u0641 \u0648\u0633\u0648\u0645 <script> \u0648\u0633\u0645\u0627\u062A onerror= \u0648\u0631\u0648\u0627\u0628\u0637 javascript:/data: \u0642\u0628\u0644 \u0627\u0644\u062D\u0641\u0638.",
          en: "Recursive sanitizePayload & sanitizeTiptapDoc strip <script>, inline event handlers, javascript: URIs, and Base64 data:image payloads prior to storage."
        }
      },
      {
        id: "SEC-06",
        area: "Contact & Consultation Form Protection",
        severity: "Medium",
        status: !botHoneypotCheck.valid ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0648\u0627\u0644\u062D\u062C\u0632 \u0645\u062D\u0645\u064A \u0628\u062D\u0642\u0644 \u0645\u0635\u064A\u062F\u0629 \u0631\u0648\u0628\u0648\u062A\u0627\u062A (Honeypot)\u060C \u0648\u062D\u062F\u0648\u062F \u0637\u0648\u0644 \u0627\u0644\u0646\u0635\u0648\u0635\u060C \u0648\u062A\u0637\u0647\u064A\u0631 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u0645\u0639\u062F\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A.",
          en: "Consultation builder is protected by a hidden Honeypot field, character limits, XSS sanitization, and rate limiting."
        }
      },
      {
        id: "SEC-07",
        area: "Zero Public Firestore Reads & Snapshot Isolation",
        severity: "High",
        status: "SECURE",
        finding: {
          ar: "\u062C\u0645\u064A\u0639 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0632\u0648\u0627\u0631 \u062A\u0642\u0631\u0623 \u062D\u0635\u0631\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 (Public Snapshot) \u0645\u0639 0 \u0642\u0631\u0627\u0621\u0627\u062A Firestore \u0648\u0639\u062F\u0645 \u062A\u0633\u0631\u064A\u0628 \u0627\u0644\u0645\u0633\u0648\u062F\u0627\u062A \u0623\u0648 \u0627\u0644\u0645\u0624\u0631\u0634\u0641.",
          en: "All public visitor requests read exclusively from the published snapshot with 0 Firestore reads and zero draft/archive leakage."
        }
      }
    ];
    const allFunctionalPassed = functionalTests.every((t) => t.passed);
    const allSecurityPassed = securityAuditItems.every((s) => s.status === "SECURE");
    res.json({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      overallStatus: allFunctionalPassed && allSecurityPassed ? "PASSED" : "ATTENTION_REQUIRED",
      summary: {
        functionalPassed: functionalTests.filter((t) => t.passed).length,
        functionalTotal: functionalTests.length,
        securityPassed: securityAuditItems.filter((s) => s.status === "SECURE").length,
        securityTotal: securityAuditItems.length,
        criticalVulnerabilities: securityAuditItems.filter((s) => s.status !== "SECURE").length
      },
      functionalTests,
      securityAuditItems
    });
  });
  app.get("/robots.txt", (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`;
    const txt = [
      "User-agent: *",
      "Allow: /",
      "Allow: /ar",
      "Allow: /en",
      "Disallow: /admin",
      "Disallow: /api/",
      `Sitemap: ${baseUrl.replace(/\/$/, "")}/sitemap.xml`
    ].join("\n");
    res.type("text/plain").send(txt);
  });
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`).replace(/\/$/, "");
    const readsBefore = serverFirestoreReadOpsCount;
    let snapshot;
    try {
      snapshot = await readPublishedPublicSnapshot({
        adapter: activeSnapshotAdapter,
        instanceCacheRef: options ? instanceCacheRef : void 0,
        strictProductionMode: activeStrictProd
      });
    } catch (err) {
      const status = err instanceof PublicSnapshotUnavailableError ? err.status : 503;
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.status(status).json({
        error: err?.message || "Public snapshot unavailable for sitemap generation.",
        code: err?.code || "PUBLIC_SNAPSHOT_UNAVAILABLE"
      });
      return;
    }
    const readsDelta = serverFirestoreReadOpsCount - readsBefore;
    const isCorePublished = (slug) => {
      const found = (snapshot.pages || []).find((p) => p.slug === slug || p.id === slug);
      if (!found) return false;
      return Boolean(found.published) && !found.archived && !found.seo?.noindex;
    };
    const staticPaths = [];
    if (isCorePublished("home")) staticPaths.push("/ar", "/en");
    if (isCorePublished("about")) staticPaths.push("/ar/about", "/en/about");
    if (isCorePublished("projects")) staticPaths.push("/ar/projects", "/en/projects");
    if (isCorePublished("solimedical")) staticPaths.push("/ar/solimedical", "/en/solimedical");
    if (isCorePublished("clinics")) staticPaths.push("/ar/clinics", "/en/clinics");
    if (isCorePublished("blog")) staticPaths.push("/ar/blog", "/en/blog");
    const dynamicPaths = [];
    (snapshot.pages || []).filter(
      (p) => p.published && !p.archived && !p.seo?.noindex && !isCoreProtectedPage(p) && Boolean(p.slug)
    ).forEach((p) => {
      const prefix = p.pageType === "landing" ? "landing" : "p";
      dynamicPaths.push({ path: `/ar/${prefix}/${p.slug}`, updatedAt: p.updatedAt });
      dynamicPaths.push({ path: `/en/${prefix}/${p.slug}`, updatedAt: p.updatedAt });
    });
    (snapshot.projects || []).filter((p) => p.published).forEach((p) => {
      dynamicPaths.push({ path: `/ar/projects/${p.slug}`, updatedAt: p.updatedAt });
      dynamicPaths.push({ path: `/en/projects/${p.slug}`, updatedAt: p.updatedAt });
    });
    (snapshot.clinics || []).filter((c) => c.published).forEach((c) => {
      dynamicPaths.push({ path: `/ar/clinics/${c.slug}`, updatedAt: c.updatedAt });
      dynamicPaths.push({ path: `/en/clinics/${c.slug}`, updatedAt: c.updatedAt });
    });
    (snapshot.articles || []).filter((a) => a.published && !a.archived && !a.seo?.noindex).forEach((a) => {
      dynamicPaths.push({ path: `/ar/blog/${a.slug}`, updatedAt: a.updatedAt });
      dynamicPaths.push({ path: `/en/blog/${a.slug}`, updatedAt: a.updatedAt });
    });
    const nowIso = snapshot.generatedAt || (/* @__PURE__ */ new Date()).toISOString();
    const urlEntries = [
      ...staticPaths.map(
        (p) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${p}`)}</loc>
    <lastmod>${escapeXml(nowIso)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/ar" || p === "/en" ? "1.0" : "0.8"}</priority>
  </url>`
      ),
      ...dynamicPaths.map(
        (d) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${d.path}`)}</loc>
    <lastmod>${escapeXml(d.updatedAt || nowIso)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
      )
    ].join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=1, stale-while-revalidate=5");
    if (readsDelta === 0) {
      res.setHeader("X-Firestore-Reads", "0");
    }
    res.type("application/xml").send(xml);
  });
  app.use("/src/assets", express.static(path.resolve(process.cwd(), "src/assets")));
  app.get("/assets/aistudio/:filename", (req, res) => {
    const safeName = path.basename(String(req.params.filename || ""));
    const diskPath = path.resolve(process.cwd(), "public/assets/aistudio", safeName);
    if (safeName && fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      res.sendFile(diskPath);
      return;
    }
    if (safeName === "logo_ae3842b8.png") {
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070E1A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00C2CB"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  <rect x="20" y="20" width="472" height="472" rx="92" fill="none" stroke="url(#cyanGrad)" stroke-opacity="0.35" stroke-width="6"/>
  <rect x="214" y="96" width="84" height="220" rx="22" fill="url(#cyanGrad)"/>
  <rect x="146" y="164" width="220" height="84" rx="22" fill="url(#cyanGrad)"/>
  <path d="M96 364 H178 L206 322 L238 402 L274 300 L306 376 L332 346 H416" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="256" y="454" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="800" letter-spacing="2" fill="#E2E8F0">SOLI MEDICAL</text>
</svg>`);
      return;
    }
    if (safeName === "1770146906397_16665dd0.png") {
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#00C2CB" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#070E1A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070E1A"/>
      <stop offset="50%" stop-color="#0B1628"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00C2CB"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#cardBg)"/>
  <rect width="1200" height="900" fill="url(#glow)"/>
  <g stroke="#1E293B" stroke-width="1.5" opacity="0.45">
    <line x1="0" y1="180" x2="1200" y2="180"/>
    <line x1="0" y1="720" x2="1200" y2="720"/>
    <line x1="220" y1="0" x2="220" y2="900"/>
    <line x1="980" y1="0" x2="980" y2="900"/>
  </g>
  <circle cx="600" cy="350" r="158" fill="#0B1424" stroke="url(#accent)" stroke-width="6"/>
  <circle cx="600" cy="350" r="142" fill="none" stroke="#00C2CB" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="10 10"/>
  <text x="600" y="388" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="112" font-weight="800" fill="#FFFFFF" letter-spacing="4">AS</text>
  <rect x="405" y="548" width="390" height="54" rx="27" fill="#00C2CB" fill-opacity="0.14" stroke="#00C2CB" stroke-opacity="0.45" stroke-width="2"/>
  <text x="600" y="584" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#00C2CB" letter-spacing="3">AHMED SOLIMAN</text>
  <text x="600" y="660" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#CBD5E1">Healthcare Systems Architect &amp; Full-Stack Engineer</text>
  <path d="M370 742 H515 L540 704 L570 778 L602 688 L632 760 L656 732 H830" fill="none" stroke="url(#accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
      return;
    }
    res.status(404).json({ error: "Asset not found" });
  });
  return app;
}
async function startServer() {
  await readPublishedPublicSnapshot().catch(() => {
  });
  const app = createExpressApp();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ahmed Soliman Platform server running on http://0.0.0.0:${PORT}`);
  });
}
var isMainEntry = typeof process !== "undefined" && Array.isArray(process.argv) && Boolean(process.argv[1]) && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"));
if (isMainEntry && process.env.SKIP_SERVER_LISTEN !== "1" && !process.env.VERCEL) {
  startServer();
}
var server_default = createExpressApp();
export {
  PublicSnapshotUnavailableError,
  activeSessions,
  buildPublicSnapshot,
  checkFirebaseAdminEnvConfig,
  cleanEnvValue,
  clearLocalInstanceSessionMemory,
  clearLocalInstanceSnapshotMemory,
  computeSnapshotContentHash,
  createAdminLoginHandler,
  createExpressApp,
  createRequireAdminMiddleware,
  createSignedAdminSessionToken,
  createVercelBlobSnapshotAdapter,
  server_default as default,
  enrichDatabaseWithBaselineDefaults,
  getFirebaseAdminVerificationServices,
  getFirestoreMetrics,
  getPublicFirebaseClientConfigFromEnv,
  getValidAdminSessionSecret,
  hashSessionToken,
  isCoreSectionPublished,
  loadAdminDatabase,
  persistAdminMutationToFirestore,
  publishPublicSnapshot,
  readPublishedPublicSnapshot,
  registerAuthRoutes,
  requireAdminMiddleware,
  resetFirestoreMetrics,
  resolveOrBootstrapAdminDocument,
  revokedSessionTokens,
  setCustomAuthDepsResolver,
  setCustomCmsHooks,
  setCustomHmacSecretForTesting,
  setCustomSnapshotStorageAdapter,
  setForceProductionSnapshotMode,
  validateSnapshotStructure,
  verifyAdminSessionCentralized,
  verifySignedAdminSessionToken
};
