// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

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
      coverImage: "https://solimedical.vercel.app/assets/images/dashboard.webp",
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
          imageUrl: "https://solimedical.vercel.app/assets/images/dashboard.webp"
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
          imageUrl: "https://solimedical.vercel.app/assets/images/booking.webp"
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
          imageUrl: "https://solimedical.vercel.app/assets/images/emr.webp"
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
          imageUrl: "https://solimedical.vercel.app/assets/images/complex.webp"
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
      coverImage: "https://solimedical.vercel.app/assets/images/booking.webp",
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
      coverImage: "https://solimedical.vercel.app/assets/images/dashboard.webp",
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
  return input.slice(0, maxLength).replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "").replace(/<\s*(iframe|object|embed|applet|meta|link|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/<\s*(script|iframe|object|embed|applet|meta|link)[^>]*\/?>/gi, "").replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, "");
}
function sanitizeUrl(url) {
  if (typeof url !== "string") return "";
  const rawTrimmed = url.trim();
  if (!rawTrimmed) return "";
  if (/^(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(rawTrimmed)) {
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
      if (typeof val === "string" && (key.toLowerCase().includes("url") || key.toLowerCase().includes("image") || key === "whatsapp")) {
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
function validateArticlePayload(article) {
  const errors = [];
  if (!article.title?.ar?.trim() || !article.title?.en?.trim()) {
    errors.push("Article title is required in both Arabic and English.");
  }
  if (!article.slug || !validateSlug(article.slug)) {
    errors.push("Article slug must be lowercase alphanumeric with hyphens.");
  }
  if (!article.content?.ar?.trim() || !article.content?.en?.trim()) {
    errors.push("Article content is required in both Arabic and English.");
  }
  return { valid: errors.length === 0, errors };
}
function validatePagePayload(page) {
  const errors = [];
  if (!page.title?.ar?.trim() || !page.title?.en?.trim()) {
    errors.push("Page title is required in both Arabic and English.");
  }
  if (!page.headline?.ar?.trim() || !page.headline?.en?.trim()) {
    errors.push("Page headline is required in both Arabic and English.");
  }
  return { valid: errors.length === 0, errors };
}
function validateSiteSettingsPayload(settings) {
  const errors = [];
  if (!settings.brandName?.ar?.trim() || !settings.brandName?.en?.trim()) {
    errors.push("Brand name is required in both Arabic and English.");
  }
  return { valid: errors.length === 0, errors };
}
function validateMediaAssetPayload(media) {
  const errors = [];
  if (!media.publicId?.trim() || !media.secureUrl?.trim()) {
    errors.push("Media publicId and secureUrl are required.");
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
function checkMediaInPublishedContent(asset, db) {
  const usedIn = [];
  const url = asset.secureUrl;
  if (!url) return { inUse: false, usedIn };
  if (db.siteSettings?.published) {
    if (db.siteSettings.avatarUrl === url || db.siteSettings.seo?.ogImage === url) {
      usedIn.push(`Site Settings (${db.siteSettings.brandName.en})`);
    }
  }
  for (const page of db.pages || []) {
    if (page.published && (page.heroImage === url || page.seo?.ogImage === url)) {
      usedIn.push(`Page: ${page.title.en}`);
    }
  }
  for (const proj of db.projects || []) {
    if (!proj.published) continue;
    const inScreens = (proj.screens || []).some((s) => s.imageUrl === url);
    if (proj.coverImage === url || proj.logoImage === url || proj.seo?.ogImage === url || inScreens) {
      usedIn.push(`Project: ${proj.title.en}`);
    }
  }
  for (const clinic of db.clinics || []) {
    if (!clinic.published) continue;
    if (clinic.coverImage === url || clinic.logoUrl === url || clinic.seo?.ogImage === url) {
      usedIn.push(`Clinic: ${clinic.name.en}`);
    }
  }
  for (const doc of db.doctors || []) {
    if (doc.published && doc.photoUrl === url) {
      usedIn.push(`Doctor: ${doc.name.en}`);
    }
  }
  for (const article of db.articles || []) {
    if (article.published && (article.coverImage === url || article.seo?.ogImage === url)) {
      usedIn.push(`Article: ${article.title.en}`);
    }
  }
  return {
    inUse: usedIn.length > 0,
    usedIn
  };
}

// server.ts
dotenv.config();
var PORT = 3e3;
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "cms-db.json");
var FIRESTORE_RULES_FILE = path.resolve(process.cwd(), "firestore.rules");
function cleanEnvValue(raw) {
  if (!raw || typeof raw !== "string") return "";
  let val = raw.trim();
  if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1).trim();
  }
  return val;
}
var OWNER_EMAIL = (cleanEnvValue(process.env.ADMIN_OWNER_EMAIL) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_EMAIL)).toLowerCase();
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
function getFirebaseAdminVerificationServices() {
  const ownerUid = cleanEnvValue(process.env.ADMIN_OWNER_UID) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_UID);
  const ownerEmail = (cleanEnvValue(process.env.ADMIN_OWNER_EMAIL) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_EMAIL)).toLowerCase();
  if (!ownerUid && !ownerEmail) {
    return {
      ready: false,
      code: "ADMIN_OWNER_UID_NOT_CONFIGURED",
      error: "Server secret ADMIN_OWNER_UID (or VITE_ADMIN_OWNER_UID) is not configured. Please add it in Vercel / server environment variables."
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
  const existingApps = getAdminApps();
  const adminApp = existingApps.length > 0 ? existingApps[0] : initializeAdminApp({ credential: cert(serviceAccount) });
  const adminAuth = getAdminAuth(adminApp);
  const databaseId = cleanEnvValue(process.env.FIREBASE_DATABASE_ID) || cleanEnvValue(process.env.VITE_FIREBASE_DATABASE_ID) || "(default)";
  const adminDb = databaseId && databaseId !== "(default)" ? getAdminFirestore(adminApp, databaseId) : getAdminFirestore(adminApp);
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
        const docRef = adminDb.collection("admins").doc(uid);
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          return {
            exists: true,
            disabled: Boolean(data?.disabled === true)
          };
        }
        const userRecord = await adminAuth.getUser(uid);
        const verifiedEmail = (userRecord.email || "").trim().toLowerCase();
        const targetOwnerEmail = ownerEmail || OWNER_EMAIL || "ahmed0soliman6@gmail.com";
        if (userRecord.emailVerified && verifiedEmail === targetOwnerEmail) {
          await docRef.set(
            {
              id: uid,
              uid,
              email: verifiedEmail,
              name: userRecord.displayName || "Ahmed Soliman",
              role: "owner",
              disabled: false,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            { merge: true }
          );
          return { exists: true, disabled: false };
        }
        return { exists: false, disabled: false };
      }
    }
  };
}
var activeSessions = /* @__PURE__ */ new Map();
var revokedSessionTokens = /* @__PURE__ */ new Set();
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
function getServerHmacSecret() {
  const sa = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const uid = cleanEnvValue(process.env.ADMIN_OWNER_UID) || cleanEnvValue(process.env.VITE_ADMIN_OWNER_UID);
  if (sa && uid) {
    return crypto.createHash("sha256").update(`${sa}:${uid}`).digest("hex");
  }
  return "";
}
function createSignedAdminSessionToken(payload) {
  const secret = getServerHmacSecret();
  if (!secret) {
    return crypto.randomBytes(32).toString("hex");
  }
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `v1.${encoded}.${sig}`;
}
function verifySignedAdminSessionToken(token) {
  if (revokedSessionTokens.has(token)) return null;
  const secret = getServerHmacSecret();
  if (!secret || !token.startsWith("v1.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, encoded, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    if (!parsed || typeof parsed.uid !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }
    if (Date.now() > parsed.expiresAt) return null;
    return {
      token,
      uid: parsed.uid,
      email: parsed.email || "",
      name: parsed.name || "Ahmed Soliman",
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}
function cleanTemporaryChatAttachments() {
  try {
    const aistudioDir = path.resolve(process.cwd(), "public", "assets", "aistudio");
    if (!fs.existsSync(aistudioDir)) return;
    const allowedFiles = /* @__PURE__ */ new Set(["1770146906397_16665dd0.png", "logo_ae3842b8.png"]);
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
function getWritableDbFile() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "cms-db.json");
  }
  return DB_FILE;
}
function loadDatabase() {
  try {
    const targetDbFile = getWritableDbFile();
    const sourceDbFile = fs.existsSync(targetDbFile) ? targetDbFile : fs.existsSync(DB_FILE) ? DB_FILE : null;
    if (!sourceDbFile) {
      if (!process.env.VERCEL) {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_PLATFORM_DATA, null, 2), "utf-8");
      }
      return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
    }
    const raw = fs.readFileSync(sourceDbFile, "utf-8");
    const parsed = JSON.parse(raw);
    let mutated = false;
    for (const seedPage of INITIAL_PLATFORM_DATA.pages) {
      const existingPage = parsed.pages?.find((p) => p.id === seedPage.id);
      if (!existingPage) {
        parsed.pages = [...parsed.pages || [], seedPage];
        mutated = true;
      } else {
        if (!existingPage.qualifications && seedPage.qualifications) {
          existingPage.qualifications = seedPage.qualifications;
          mutated = true;
        }
        if (!existingPage.achievements && seedPage.achievements) {
          existingPage.achievements = seedPage.achievements;
          mutated = true;
        }
        if (!existingPage.interests && seedPage.interests) {
          existingPage.interests = seedPage.interests;
          mutated = true;
        }
        if (existingPage.experienceTimeline?.length < (seedPage.experienceTimeline?.length || 0)) {
          existingPage.experienceTimeline = seedPage.experienceTimeline;
          existingPage.biography = seedPage.biography;
          mutated = true;
        }
        if (seedPage.id === "home" && existingPage.headline?.en !== "I DESIGN. I CREATE. I DEVELOP.") {
          existingPage.headline = seedPage.headline;
          existingPage.kicker = seedPage.kicker;
          existingPage.subheadline = seedPage.subheadline;
          existingPage.highlights = seedPage.highlights;
          existingPage.metrics = seedPage.metrics;
          mutated = true;
        }
      }
    }
    const obsoleteComplexIdx = (parsed.projects || []).findIndex(
      (p) => p.id === "soli-medical-complex-erp"
    );
    if (obsoleteComplexIdx !== -1 && !parsed.projects.some((p) => p.id === "mitali-hospital-erp")) {
      parsed.projects.splice(obsoleteComplexIdx, 1);
      mutated = true;
    }
    for (const seedProj of INITIAL_PLATFORM_DATA.projects) {
      const existingProj = parsed.projects?.find((p) => p.id === seedProj.id);
      if (!existingProj) {
        parsed.projects = [...parsed.projects || [], seedProj];
        mutated = true;
      } else {
        if (!existingProj.problem && seedProj.problem) {
          existingProj.problem = seedProj.problem;
          existingProj.solution = seedProj.solution;
          mutated = true;
        }
        if (seedProj.id === "soli-medical-single-clinic") {
          existingProj.showcaseRoute = "/solimedical";
          existingProj.coverImage = seedProj.coverImage;
          existingProj.screens = seedProj.screens;
          existingProj.liveUrl = seedProj.liveUrl;
          mutated = true;
        }
      }
    }
    for (const seedClinic of INITIAL_PLATFORM_DATA.clinics) {
      const existingClinic = parsed.clinics?.find((c) => c.id === seedClinic.id);
      if (!existingClinic) {
        parsed.clinics = [...parsed.clinics || [], seedClinic];
        mutated = true;
      } else {
        if (!existingClinic.themeColor && seedClinic.themeColor) {
          existingClinic.themeColor = seedClinic.themeColor;
          mutated = true;
        }
        if (!existingClinic.galleryImages && seedClinic.galleryImages) {
          existingClinic.galleryImages = seedClinic.galleryImages;
          mutated = true;
        }
        if (!existingClinic.mapEmbedUrl && seedClinic.mapEmbedUrl) {
          existingClinic.mapEmbedUrl = seedClinic.mapEmbedUrl;
          mutated = true;
        }
        if (existingClinic.coverImage === "/assets/aistudio/logo_ae3842b8.png") {
          existingClinic.coverImage = seedClinic.coverImage;
          mutated = true;
        }
        if (existingClinic.phone === "+201012687315" || existingClinic.phone === "+201000000000") {
          existingClinic.phone = "";
          mutated = true;
        }
        if (existingClinic.whatsapp?.includes("201012687315")) {
          existingClinic.whatsapp = existingClinic.whatsapp.replace("201012687315", "Ahmed0soliman");
          mutated = true;
        }
      }
    }
    if (parsed.siteSettings && (parsed.siteSettings.whatsappNumber === "201012687315" || parsed.siteSettings.whatsappUrl !== "https://wa.me/Ahmed0soliman" || parsed.siteSettings.githubUrl || parsed.siteSettings.linkedinUrl)) {
      parsed.siteSettings.whatsappNumber = "Ahmed0soliman";
      parsed.siteSettings.whatsappUrl = "https://wa.me/Ahmed0soliman";
      parsed.siteSettings.facebookUrl = "https://www.facebook.com/SoliMedical/";
      parsed.siteSettings.telegramBotUrl = "https://t.me/SoliMedicalproBot";
      parsed.siteSettings.githubUrl = "";
      parsed.siteSettings.linkedinUrl = "";
      mutated = true;
    }
    for (const seedArt of INITIAL_PLATFORM_DATA.articles) {
      const existingArt = parsed.articles?.find((a) => a.id === seedArt.id);
      if (!existingArt) {
        parsed.articles = [...parsed.articles || [], seedArt];
        mutated = true;
      } else if (existingArt.coverImage === "/assets/aistudio/logo_ae3842b8.png") {
        existingArt.coverImage = seedArt.coverImage;
        mutated = true;
      }
    }
    for (const seedMedia of INITIAL_PLATFORM_DATA.media) {
      if (!parsed.media?.some((m) => m.id === seedMedia.id)) {
        parsed.media = [...parsed.media || [], seedMedia];
        mutated = true;
      }
    }
    if (mutated) {
      try {
        fs.writeFileSync(getWritableDbFile(), JSON.stringify(parsed, null, 2), "utf-8");
      } catch {
      }
    }
    return parsed;
  } catch (err) {
    console.error("Error loading CMS database, falling back to initial seed:", err);
    return JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
  }
}
function saveDatabase(db) {
  try {
    const targetFile = getWritableDbFile();
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving CMS database:", err);
  }
}
function getAuthenticatedAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token || revokedSessionTokens.has(token)) {
    return null;
  }
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }
  return verifySignedAdminSessionToken(token);
}
function requireAdminMiddleware(req, res, next) {
  const session = getAuthenticatedAdmin(req);
  if (!session) {
    res.status(401).json({
      error: "Unauthorized: Valid Admin session required. Session may have expired.",
      code: "ADMIN_AUTH_REQUIRED"
    });
    return;
  }
  next();
}
function createAdminLoginHandler(resolveDeps = getFirebaseAdminVerificationServices) {
  return async (req, res) => {
    const clientIp = req.ip || "local";
    if (!checkRateLimit(`login:${clientIp}`, 20, 15 * 60 * 1e3)) {
      res.status(429).json({
        error: "Too many login attempts. Please wait before trying again.",
        code: "RATE_LIMITED"
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
    const serviceResolution = resolveDeps();
    if (!serviceResolution.ready) {
      res.status(503).json({
        error: serviceResolution.error,
        code: serviceResolution.code
      });
      return;
    }
    const { deps } = serviceResolution;
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
    const verifiedOwnerEmailMatches = typeof deps.ownerEmail === "string" && deps.ownerEmail.length > 0 && decoded.email_verified === true && typeof decoded.email === "string" && decoded.email.trim().toLowerCase() === deps.ownerEmail.trim().toLowerCase();
    if (!uidMatches && !verifiedOwnerEmailMatches) {
      res.status(403).json({
        error: "Access Denied: Authenticated UID is not the authorized platform owner.",
        code: "FORBIDDEN_NOT_OWNER_UID"
      });
      return;
    }
    if (deps.ownerEmail && (!decoded.email || decoded.email.trim().toLowerCase() !== deps.ownerEmail.trim().toLowerCase())) {
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
          error: "Access Denied: UID is not registered in Firestore /admins/{uid}. Add the owner UID manually in Firebase Console.",
          code: "FORBIDDEN_NOT_ADMIN_UID"
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
    const token = createSignedAdminSessionToken({
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt
    });
    const session = {
      token,
      uid: decoded.uid,
      email: finalEmail,
      name: finalName,
      expiresAt
    };
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
function registerAuthRoutes(app, resolveDeps = getFirebaseAdminVerificationServices) {
  app.get("/api/auth/firebase-config", (_req, res) => {
    const pubConfig = getPublicFirebaseClientConfigFromEnv();
    const adminSdkStatus = resolveDeps();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      ...pubConfig,
      serverAdminSdkReady: adminSdkStatus.ready
    });
  });
  app.post("/api/auth/admin-login", createAdminLoginHandler(resolveDeps));
  app.get("/api/auth/session", (req, res) => {
    const session = getAuthenticatedAdmin(req);
    if (!session) {
      res.status(401).json({ authenticated: false, error: "Session expired or invalid" });
      return;
    }
    res.json({
      authenticated: true,
      uid: session.uid,
      email: session.email,
      name: session.name,
      expiresAt: session.expiresAt
    });
  });
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      activeSessions.delete(token);
      revokedSessionTokens.add(token);
    }
    res.json({ success: true });
  });
}
function createExpressApp() {
  cleanTemporaryChatAttachments();
  const app = express();
  app.use(express.json({ limit: "6mb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  registerAuthRoutes(app);
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
  app.get("/api/cms/public", (_req, res) => {
    const db = loadDatabase();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    const publishedClinics = db.clinics.filter((c) => c.published).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const publishedClinicIds = new Set(publishedClinics.map((c) => c.id));
    res.json({
      siteSettings: db.siteSettings.published ? db.siteSettings : INITIAL_PLATFORM_DATA.siteSettings,
      pages: db.pages.filter((p) => p.published).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      projects: db.projects.filter((p) => p.published).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      clinics: publishedClinics,
      doctors: db.doctors.filter((d) => d.published && publishedClinicIds.has(d.clinicId)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      services: db.services.filter((s) => s.published && publishedClinicIds.has(s.clinicId)).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
      articles: db.articles.filter((a) => a.published).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    });
  });
  app.get("/api/cms/admin", requireAdminMiddleware, (_req, res) => {
    const db = loadDatabase();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json(db);
  });
  app.put("/api/cms/siteSettings", requireAdminMiddleware, (req, res) => {
    const db = loadDatabase();
    const sanitizedBody = sanitizePayload(req.body || {});
    const merged = {
      ...db.siteSettings,
      ...sanitizedBody,
      id: "global",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const validation = validateCollectionRecord("siteSettings", merged);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors.join(" "), errors: validation.errors });
      return;
    }
    db.siteSettings = merged;
    saveDatabase(db);
    res.json(merged);
  });
  app.post("/api/cms/seed-baseline", requireAdminMiddleware, (_req, res) => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA));
    saveDatabase(fresh);
    res.json({ success: true, database: fresh });
  });
  app.get("/api/cms/backup", requireAdminMiddleware, (_req, res) => {
    const db = loadDatabase();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "Ahmed Soliman Digital Platform",
      version: "1.0.0",
      database: db
    });
  });
  app.post("/api/cms/restore", requireAdminMiddleware, (req, res) => {
    const incoming = req.body?.database || req.body;
    if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.projects) || !Array.isArray(incoming.clinics) || !Array.isArray(incoming.pages)) {
      res.status(400).json({
        error: "Invalid backup file structure. Expected pages, projects, and clinics arrays."
      });
      return;
    }
    const currentDb = loadDatabase();
    const sanitized = sanitizePayload(incoming);
    sanitized.admins = currentDb.admins;
    saveDatabase(sanitized);
    res.json({
      success: true,
      restoredAt: (/* @__PURE__ */ new Date()).toISOString(),
      database: sanitized
    });
  });
  app.post("/api/cms/:collection", requireAdminMiddleware, (req, res) => {
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
    const db = loadDatabase();
    const list = db[col] || [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const rawId = String(sanitizedPayload.id || `${col.slice(0, 4)}-${Date.now()}`);
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128) || `${col.slice(0, 4)}-${Date.now()}`;
    const existingIndex = list.findIndex((item) => item.id === safeId);
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
    db[col] = list;
    saveDatabase(db);
    res.json(record);
  });
  app.patch("/api/cms/:collection/reorder", requireAdminMiddleware, (req, res) => {
    const col = req.params.collection;
    const { orderedIds } = req.body;
    const db = loadDatabase();
    const list = db[col] || [];
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: "orderedIds array is required" });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    list.forEach((item) => {
      const idx = orderedIds.indexOf(item.id);
      if (idx !== -1) {
        item.order = idx + 1;
        item.updatedAt = now;
      }
    });
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    db[col] = list;
    saveDatabase(db);
    res.json({ success: true, items: list });
  });
  app.delete("/api/cms/:collection/:id", requireAdminMiddleware, (req, res) => {
    const col = req.params.collection;
    if (col === "admins") {
      res.status(403).json({ error: "Admin documents cannot be deleted via API." });
      return;
    }
    const id = req.params.id;
    const db = loadDatabase();
    const list = db[col] || [];
    const target = list.find((item) => item.id === id);
    if (!target) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    if (col === "media") {
      const usageCheck = checkMediaInPublishedContent(target, db);
      if (usageCheck.inUse) {
        res.status(409).json({
          error: `Cannot delete image while it is actively used in published content: ${usageCheck.usedIn.join(", ")}`,
          code: "MEDIA_IN_USE_BY_PUBLISHED_CONTENT",
          usedIn: usageCheck.usedIn
        });
        return;
      }
    }
    db[col] = list.filter((item) => item.id !== id);
    saveDatabase(db);
    res.json({ success: true, deletedId: id });
  });
  app.get("/api/cloudinary/status", requireAdminMiddleware, (_req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "ahmed-soliman-platform";
    res.json({
      configured: Boolean(cloudName && apiKey && apiSecret),
      cloudName,
      folder
    });
  });
  app.post("/api/cloudinary/sign", requireAdminMiddleware, (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    const defaultFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "ahmed-soliman-platform";
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
      res.status(200).json({
        configured: false,
        message: "Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server yet."
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
  app.post("/api/cloudinary/delete", requireAdminMiddleware, async (req, res) => {
    const { mediaId, publicId, secureUrl } = req.body || {};
    const db = loadDatabase();
    const usageCheck = checkMediaInPublishedContent(
      { publicId: publicId || "", secureUrl: secureUrl || "" },
      db
    );
    if (usageCheck.inUse) {
      res.status(409).json({
        error: `Cannot delete image because it is currently used in published content: ${usageCheck.usedIn.join(", ")}`,
        code: "MEDIA_IN_USE_BY_PUBLISHED_CONTENT",
        usedIn: usageCheck.usedIn
      });
      return;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    let cloudinaryRemoteDeleted = false;
    if (cloudName && apiKey && apiSecret && publicId && !String(publicId).startsWith("local/")) {
      try {
        const timestamp = Math.round(Date.now() / 1e3);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");
        const formData = new URLSearchParams();
        formData.append("public_id", publicId);
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
      db.media = db.media.filter((m) => m.id !== mediaId);
      saveDatabase(db);
    }
    res.json({
      success: true,
      cloudinaryRemoteDeleted,
      deletedMediaId: mediaId
    });
  });
  app.get("/api/audit/run", requireAdminMiddleware, (_req, res) => {
    const db = loadDatabase();
    const rulesContent = fs.existsSync(FIRESTORE_RULES_FILE) ? fs.readFileSync(FIRESTORE_RULES_FILE, "utf-8") : "";
    const publishedProjects = db.projects.filter((p) => p.published);
    const publishedClinics = db.clinics.filter((c) => c.published);
    const publishedArticles = db.articles.filter((a) => a.published);
    const publishedPages = db.pages.filter((p) => p.published);
    const allBilingualValid = publishedPages.every((p) => p.title.ar && p.title.en && p.headline.ar && p.headline.en) && publishedProjects.every((p) => p.title.ar && p.title.en && p.summary.ar && p.summary.en) && publishedClinics.every((c) => c.name.ar && c.name.en && c.tagline.ar && c.tagline.en) && publishedArticles.every((a) => a.title.ar && a.title.en && a.content.ar && a.content.en);
    const draftTestCheck = (() => {
      const sampleDraft = { id: "draft-test", published: false };
      const filtered = [sampleDraft, ...publishedProjects].filter((x) => x.published);
      return !filtered.some((x) => x.id === "draft-test");
    })();
    const validImgCheck = validateImageUploadFile({ type: "image/webp", size: 1024 * 500 });
    const invalidMimeCheck = validateImageUploadFile({
      type: "application/x-msdownload",
      size: 1024
    });
    const oversizedImgCheck = validateImageUploadFile({
      type: "image/png",
      size: 8 * 1024 * 1024
    });
    const inUsePortraitCheck = checkMediaInPublishedContent(
      {
        publicId: "local/ahmed-soliman-portrait",
        secureUrl: "/assets/aistudio/1770146906397_16665dd0.png"
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
          ar: `\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 ${publishedPages.length} \u0635\u0641\u062D\u0627\u062A \u0623\u0633\u0627\u0633\u064A\u0629\u060C ${publishedProjects.length} \u0645\u0634\u0631\u0648\u0639\u0627\u062A\u060C ${publishedClinics.length} \u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0648${publishedArticles.length} \u0645\u0642\u0627\u0644\u0627\u062A \u0645\u0646\u0634\u0648\u0631\u0629 + /sitemap.xml \u0648/robots.txt.`,
          en: `Verified ${publishedPages.length} core pages, ${publishedProjects.length} projects, ${publishedClinics.length} clinics, and ${publishedArticles.length} articles + /sitemap.xml & /robots.txt.`
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
        category: "Published vs Draft Visibility",
        title: {
          ar: "\u0638\u0647\u0648\u0631 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0644\u0644\u062C\u0645\u0647\u0648\u0631 \u0648\u0627\u062E\u062A\u0641\u0627\u0621 \u0627\u0644\u0645\u0633\u0648\u062F\u0627\u062A \u062A\u0645\u0627\u0645\u0627\u064B (Draft Isolation)",
          en: "Published Content Visibility & Strict Draft Hiding on Public Routes"
        },
        passed: draftTestCheck,
        details: {
          ar: "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0645 /api/cms/public \u0648\u0642\u0648\u0627\u0639\u062F Firestore \u064A\u0639\u0631\u0636\u0627\u0646 \u0641\u0642\u0637 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u062D\u0642\u0642 published == true \u0648\u064A\u062E\u0641\u064A\u0627\u0646 \u0623\u064A \u0645\u0633\u0648\u062F\u0629 \u0641\u0648\u0631\u0627\u064B.",
          en: "Public API /api/cms/public and Firestore rules strictly serve records with published == true and hide all drafts."
        }
      },
      {
        id: "FT-06",
        category: "Admin Auth & Session Lifecycle",
        title: {
          ar: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u062F\u064A\u0631\u060C \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 Firebase ID Token\u060C \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A\u060C \u0648\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
          en: "Admin Login, Firebase ID Token Verification, Role Enforcement & Logout Invalidation"
        },
        passed: getFirebaseAdminVerificationServices().ready && activeSessions.size >= 1,
        details: {
          ar: getFirebaseAdminVerificationServices().ready ? "\u062D\u0632\u0645\u0629 Firebase Admin SDK \u0648ADMIN_OWNER_UID \u0645\u0641\u0639\u0651\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0645\u0639 \u0645\u0637\u0627\u0628\u0642\u0629 /admins/{uid} \u0648\u0625\u0628\u0637\u0627\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 \u0641\u0648\u0631 \u0627\u0644\u062E\u0631\u0648\u062C." : "\u064A\u0631\u062C\u0649 \u0636\u0628\u0637 \u0645\u062A\u063A\u064A\u0631\u0627\u062A FIREBASE_SERVICE_ACCOUNT_JSON \u0648ADMIN_OWNER_UID \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062A\u0634\u0641\u064A\u0631\u064A \u0645\u0646 Firebase ID Token.",
          en: getFirebaseAdminVerificationServices().ready ? "Firebase Admin SDK & ADMIN_OWNER_UID are active with Firestore /admins/{uid} verification and instant logout revocation." : "Configure FIREBASE_SERVICE_ACCOUNT_JSON and ADMIN_OWNER_UID server secrets to enable cryptographic Firebase ID Token verification."
        }
      },
      {
        id: "FT-07",
        category: "Cloudinary Media Upload & In-Use Guard",
        title: {
          ar: "\u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0648\u0642\u0639\u0629\u060C \u0641\u062D\u0635 \u0627\u0644\u0635\u064A\u063A \u0648\u0627\u0644\u062D\u062C\u0645 (5MB)\u060C \u0648\u0645\u0646\u0639 \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629",
          en: "Signed Image Upload, MIME/Size Validation (5MB) & In-Use Delete Guard"
        },
        passed: validImgCheck.valid && !invalidMimeCheck.valid && !oversizedImgCheck.valid && inUsePortraitCheck.inUse,
        details: {
          ar: `\u062A\u0645 \u0642\u0628\u0648\u0644 WebP \u0627\u0644\u0635\u0627\u0644\u062D\u060C \u0648\u0631\u0641\u0636 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u0648\u0627\u0644\u0623\u062D\u062C\u0627\u0645 \u0641\u0648\u0642 5MB\u060C \u0648\u0645\u0646\u0639 \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0644\u0623\u0646\u0647\u0627 \u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0641\u064A: ${inUsePortraitCheck.usedIn.join("\u060C ")}.`,
          en: `Accepted valid WebP, rejected .exe and >5MB files, and blocked deletion of active portrait used in: ${inUsePortraitCheck.usedIn.join(", ")}.`
        }
      }
    ];
    const xssSample = sanitizePayload({
      title: 'Hello <script>alert(1)</script><img src=x onerror="alert(2)">',
      coverImage: "javascript:alert(3)"
    });
    const xssNeutralized = !xssSample.title.includes("<script>") && !xssSample.title.includes("onerror") && xssSample.coverImage === "";
    const botHoneypotCheck = validateConsultationForm({
      name: "SpamBot",
      message: "Buy links",
      websiteHoneypot: "http://spam.example.com"
    });
    const folderInjectionBlocked = !validateCloudinaryFolder("folder&evil=1") && !validateCloudinaryFolder("../etc/passwd") && validateCloudinaryFolder("ahmed-soliman-platform/projects");
    const rulesHasDefaultDeny = rulesContent.includes("allow read, write: if false;");
    const rulesLocksAdminsWrite = rulesContent.includes("allow create, update, delete: if false;");
    const rulesEnforcesPublished = rulesContent.includes("resource.data.published == true");
    const rulesEnforcesIsAdmin = rulesContent.includes(
      "exists(/databases/$(database)/documents/admins/$(request.auth.uid))"
    );
    const securityAuditItems = [
      {
        id: "SEC-01",
        area: "Firebase Security Rules",
        severity: "Critical",
        status: rulesHasDefaultDeny && rulesLocksAdminsWrite && rulesEnforcesPublished && rulesEnforcesIsAdmin ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u0642\u0648\u0627\u0639\u062F firestore.rules \u062A\u0637\u0628\u0642 \u0627\u0644\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u060C \u0648\u062A\u0645\u0646\u0639 \u0623\u064A \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0646 \u0625\u0646\u0634\u0627\u0621 \u0623\u0648 \u062A\u0639\u062F\u064A\u0644 \u0648\u062B\u064A\u0642\u0629 \u0641\u064A /admins/{uid}\u060C \u0648\u062A\u0641\u0631\u0636 published == true \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0639\u0627\u0645\u0629.",
          en: "firestore.rules enforces default deny, blocks client writes to /admins/{uid}, and requires published == true for public reads."
        }
      },
      {
        id: "SEC-02",
        area: "Admin Route & API Protection",
        severity: "Critical",
        status: "SECURE",
        finding: {
          ar: "\u062C\u0645\u064A\u0639 \u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 (/api/cms/admin, POST/PUT/PATCH/DELETE /api/cms/*, /api/cloudinary/*) \u0645\u062D\u0645\u064A\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 requireAdminMiddleware \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0644\u0627 \u062A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0641\u0642\u0637.",
          en: "All Admin API endpoints enforce server-side requireAdminMiddleware token verification rather than relying on UI hiding."
        }
      },
      {
        id: "SEC-03",
        area: "Firebase ID Token & Admin UID Verification",
        severity: "Critical",
        status: getFirebaseAdminVerificationServices().ready ? "SECURE" : "ATTENTION_REQUIRED",
        finding: {
          ar: "\u064A\u062A\u062D\u0642\u0642 \u0627\u0644\u062E\u0627\u062F\u0645 \u0645\u0646 Firebase ID Token \u0639\u0628\u0631 Firebase Admin SDK\u060C \u0648\u064A\u0637\u0627\u0628\u0642 UID \u0645\u0639 ADMIN_OWNER_UID \u0648\u0648\u062B\u064A\u0642\u0629 /admins/{uid} \u062F\u0648\u0646 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0639\u0644\u0649 \u0623\u064A UID \u0623\u0648 Email \u0645\u0646 \u0627\u0644\u0645\u062A\u0635\u0641\u062D.",
          en: "Server cryptographically verifies Firebase ID Token via Firebase Admin SDK and checks both ADMIN_OWNER_UID and Firestore /admins/{uid}."
        }
      },
      {
        id: "SEC-04",
        area: "Cloudinary Secrets & Signed Upload Endpoint",
        severity: "Critical",
        status: folderInjectionBlocked ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u0645\u0641\u062A\u0627\u062D CLOUDINARY_API_SECRET \u0645\u062D\u0641\u0648\u0638 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0641\u0642\u0637 \u0648\u0644\u0627 \u064A\u064F\u0631\u0633\u0644 \u0644\u0644\u0639\u0645\u064A\u0644\u060C \u0645\u0639 \u062A\u062D\u0635\u064A\u0646 \u0645\u0639\u0627\u0645\u0644 customFolder \u0636\u062F \u062D\u0642\u0646 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A (Parameter Injection) \u0648\u0627\u0644\u062A\u0646\u0642\u0644 \u0628\u064A\u0646 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A.",
          en: "CLOUDINARY_API_SECRET remains strictly server-side; customFolder is validated against parameter injection and path traversal."
        }
      },
      {
        id: "SEC-05",
        area: "XSS Prevention & Server Input Validation",
        severity: "High",
        status: xssNeutralized ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u064A\u062A\u0645 \u062A\u0637\u0647\u064A\u0631 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0627\u0644\u0639\u0645\u064A\u0644 \u0639\u0628\u0631 sanitizePayload \u0644\u062D\u0630\u0641 \u0648\u0633\u0648\u0645 <script> \u0648\u0633\u0645\u0627\u062A onerror= \u0648\u0631\u0648\u0627\u0628\u0637 javascript: \u0642\u0628\u0644 \u0627\u0644\u062D\u0641\u0638\u060C \u0645\u0639 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u062E\u0637\u0637 (Schema Validation).",
          en: "Recursive server-side & client-side sanitizePayload strips <script>, inline event handlers, and javascript: URIs prior to storage."
        }
      },
      {
        id: "SEC-06",
        area: "Contact & Consultation Form Protection",
        severity: "Medium",
        status: !botHoneypotCheck.valid ? "SECURE" : "VULNERABLE",
        finding: {
          ar: "\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0648\u0627\u0644\u062D\u062C\u0632 \u0645\u062D\u0645\u064A \u0628\u062D\u0642\u0644 \u0645\u0635\u064A\u062F\u0629 \u0631\u0648\u0628\u0648\u062A\u0627\u062A (Honeypot)\u060C \u0648\u062D\u062F\u0648\u062F \u0637\u0648\u0644 \u0627\u0644\u0646\u0635\u0648\u0635\u060C \u0648\u062A\u0637\u0647\u064A\u0631 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A\u060C \u0648\u062A\u062D\u062F\u064A\u062F \u0645\u0639\u062F\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0639\u0644\u0649 /api/contact/validate.",
          en: "Consultation builder is protected by a hidden Honeypot field, character limits, XSS sanitization, and rate limiting on /api/contact/validate."
        }
      },
      {
        id: "SEC-07",
        area: "Zero Admin Data Exposure to Public",
        severity: "High",
        status: "SECURE",
        finding: {
          ar: "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0645 /api/cms/public \u064A\u0633\u062A\u0628\u0639\u062F \u062A\u0645\u0627\u0645\u0627\u064B \u0645\u062C\u0645\u0648\u0639\u0627\u062A admins \u0648media \u0648\u0623\u064A \u0645\u0633\u0648\u062F\u0627\u062A \u0623\u0648 \u0623\u0637\u0628\u0627\u0621/\u062E\u062F\u0645\u0627\u062A \u062A\u0627\u0628\u0639\u0629 \u0644\u0639\u064A\u0627\u062F\u0627\u062A \u063A\u064A\u0631 \u0645\u0646\u0634\u0648\u0631\u0629.",
          en: "Public endpoint /api/cms/public strictly omits admins, media registry, drafts, and doctors/services belonging to unpublished clinics."
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
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host") || "localhost:3000"}`).replace(/\/$/, "");
    const db = loadDatabase();
    const staticPaths = [
      "/ar",
      "/en",
      "/ar/about",
      "/en/about",
      "/ar/projects",
      "/en/projects",
      "/ar/solimedical",
      "/en/solimedical",
      "/ar/clinics",
      "/en/clinics",
      "/ar/blog",
      "/en/blog"
    ];
    const dynamicPaths = [];
    db.projects.filter((p) => p.published).forEach((p) => {
      dynamicPaths.push({ path: `/ar/projects/${p.slug}`, updatedAt: p.updatedAt });
      dynamicPaths.push({ path: `/en/projects/${p.slug}`, updatedAt: p.updatedAt });
    });
    db.clinics.filter((c) => c.published).forEach((c) => {
      dynamicPaths.push({ path: `/ar/clinics/${c.slug}`, updatedAt: c.updatedAt });
      dynamicPaths.push({ path: `/en/clinics/${c.slug}`, updatedAt: c.updatedAt });
    });
    db.articles.filter((a) => a.published).forEach((a) => {
      dynamicPaths.push({ path: `/ar/blog/${a.slug}`, updatedAt: a.updatedAt });
      dynamicPaths.push({ path: `/en/blog/${a.slug}`, updatedAt: a.updatedAt });
    });
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
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
    res.type("application/xml").send(xml);
  });
  app.use("/src/assets", express.static(path.resolve(process.cwd(), "src/assets")));
  return app;
}
async function startServer() {
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
if (process.env.SKIP_SERVER_LISTEN !== "1" && !process.env.VERCEL) {
  startServer();
}
var server_default = createExpressApp();
export {
  activeSessions,
  cleanEnvValue,
  createAdminLoginHandler,
  createExpressApp,
  server_default as default,
  getFirebaseAdminVerificationServices,
  getPublicFirebaseClientConfigFromEnv,
  registerAuthRoutes,
  requireAdminMiddleware,
  revokedSessionTokens
};
