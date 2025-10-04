import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqData = [
    {
      category: "General Questions",
      questions: [
        {
          q: "What is StudyBuddy?",
          a: "StudyBuddy is an Apple-inspired tutoring marketplace exclusively for USC students. We connect students with qualified peer tutors who have excelled in the same courses, often with the same instructors."
        },
        {
          q: "Who can use StudyBuddy?",
          a: "StudyBuddy is exclusively for USC students. All users must verify their identity using their USC email address (@usc.edu), which is tied to their official student name."
        },
        {
          q: "How does verification work?",
          a: "We verify all users through their USC email accounts. This ensures that everyone on the platform is a legitimate USC student and maintains a safe, trusted community."
        }
      ]
    },
    {
      category: "For Students",
      questions: [
        {
          q: "How do I book a session?",
          a: "Browse tutors by course, select a tutor, and choose from their available time slots. Sessions can be in-person or virtual (via our integrated Zoom platform). You'll need to book at least 3 hours in advance."
        },
        {
          q: "What's the minimum booking notice?",
          a: "You must book sessions at least 3 hours in advance. This gives tutors adequate time to prepare and ensures quality tutoring sessions."
        },
        {
          q: "How does course matching work?",
          a: "When browsing tutors, you'll see a green checkmark for tutors who can teach courses you've added to your profile. If the tutor had the same instructor when they took the course, you'll also see a 'Matching Teacher' badge in green. You can also add courses you're not currently enrolled in if you need help with them."
        },
        {
          q: "What are the payment fees?",
          a: "Stripe charges 2.9% + $0.30 per transaction for U.S. payments. StudyBuddy adds a 1% platform fee to help cover operational costs. These fees are calculated before Stripe fees and displayed separately at checkout."
        },
        {
          q: "What's the cancellation and refund policy?",
          a: "• More than 24 hours before session: Full refund\n• Less than 24 hours before session: 50% refund\n• Less than 2 hours before session: No refund\n\nRefunds are processed automatically based on when you cancel."
        },
        {
          q: "What if my tutor doesn't show up?",
          a: "If your tutor doesn't show up, report it through the session review process. Your report will be sent to StudyBuddy admin (help@studybuddyusc.com) and will be reviewed and handled appropriately. You'll receive a full refund for no-show incidents."
        },
        {
          q: "Can I edit my review after submitting it?",
          a: "No, reviews cannot be edited once submitted. Please make sure your review is complete and accurate before submitting."
        },
        {
          q: "How long are sessions?",
          a: "Sessions can be a minimum of 30 minutes and a maximum of 2 hours, depending on the tutor's availability settings."
        }
      ]
    },
    {
      category: "For Tutors",
      questions: [
        {
          q: "How do I become a tutor?",
          a: "Apply through your profile settings. Our team reviews applications based on your past course performance, tutoring experience, and responses to application questions. The review process typically takes 4 business days."
        },
        {
          q: "How long does tutor approval take?",
          a: "Applications are reviewed within 4 business days. You'll be notified via email whether your application is accepted or not. The decision is based on academic performance, relevant experience, and application responses."
        },
        {
          q: "How do I get paid?",
          a: "Payments are processed through Stripe Connect. You must set up your Stripe Connect account in Settings before you can receive payments. After both you and the student confirm the session occurred, the transfer is initiated. Once the student's payment clears, you'll be paid the next day (typically within 30 days of the session, depending on payment clearing times)."
        },
        {
          q: "When do I receive my payment?",
          a: "Both you and the student must confirm the session occurred. Once confirmed and the student's payment has cleared, you'll receive payment the next day. The sooner you confirm, the sooner you get paid. If there's a disagreement about whether the session occurred, the tutor will not be paid until the issue is resolved - contact help@studybuddyusc.com for disputes."
        },
        {
          q: "What if I need to cancel a session?",
          a: "If you cancel a session, you will not receive any payment for that session, regardless of when you cancel. If you cancel less than 3 hours before the session, depending on the reason, action may be taken against your account. Repeat cancellations will result in account deactivation."
        },
        {
          q: "What if a student doesn't show up?",
          a: "Report the no-show through the session review process. Your report will be sent to help@studybuddyusc.com and reviewed by the admin team. You'll still receive payment for confirmed no-shows after review."
        },
        {
          q: "What are the tutor badge types?",
          a: "Tutors can earn several badges:\n• Rising Star: Excellence in early tutoring sessions\n• Stress Reducer: Consistently helps students reduce anxiety\n• Consistent Tutor: Maintains regular weekly sessions\n• Top Rated: High average ratings from students\n• Student Success Champion: Strong record of student improvement\n• Responsive Tutor: Quick response times to student inquiries\n\nBadges are automatically awarded based on your performance metrics."
        },
        {
          q: "Can tutors respond to student reviews?",
          a: "Yes, tutors can respond to student reviews, but these responses are not publicly visible. They are for internal record-keeping purposes."
        }
      ]
    },
    {
      category: "Technical & Safety",
      questions: [
        {
          q: "How do virtual sessions work?",
          a: "All virtual sessions use our integrated Zoom platform. When you book a virtual session, a Zoom meeting link is automatically generated and sent to both the student and tutor via email and displayed in your session details. You don't need your own Zoom account."
        },
        {
          q: "Is my information safe?",
          a: "Yes. We verify all users through USC email accounts, which are tied to official student names. All payment information is securely processed through Stripe. We never store your payment details on our servers."
        },
        {
          q: "What are the community guidelines?",
          a: "We're currently developing comprehensive Community Conduct & Safety Guidelines. In the meantime, we expect all users to:\n• Be respectful and professional\n• Maintain academic integrity\n• Honor scheduled sessions\n• Communicate honestly and clearly\n• Report any concerning behavior to help@studybuddyusc.com"
        },
        {
          q: "How do I report an issue?",
          a: "For any issues, disputes, or concerns, contact our support team at help@studybuddyusc.com. We review all reports and take appropriate action to maintain a safe, trustworthy platform."
        }
      ]
    },
    {
      category: "Account & Support",
      questions: [
        {
          q: "Can I be both a student and tutor?",
          a: "Yes! Once you've been approved as a tutor, you can easily switch between student and tutor views. This allows you to book sessions as a student and also offer tutoring services under your tutor profile."
        },
        {
          q: "How do I contact support?",
          a: "Email us at help@studybuddyusc.com for any questions, issues, or disputes. Our team reviews all inquiries and responds as quickly as possible."
        },
        {
          q: "What if there's a payment dispute?",
          a: "If there's a disagreement about whether a session occurred or payment issues, contact help@studybuddyusc.com immediately. Payment to the tutor will be held until the dispute is resolved. Provide as much detail as possible to help us resolve the issue quickly."
        },
        {
          q: "Are there recurring or subscription-based sessions?",
          a: "No, StudyBuddy currently only supports one-time session bookings. If you want regular sessions with the same tutor, you'll need to book each session individually."
        }
      ]
    }
  ];

  const filteredData = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about StudyBuddy
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Content */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No results found. Try a different search term.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredData.map((category, idx) => (
              <div key={idx} className="bg-card rounded-lg border p-6">
                <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support CTA */}
        <div className="mt-12 text-center bg-card rounded-lg border p-8">
          <h2 className="text-2xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Can't find the answer you're looking for? Reach out to our support team.
          </p>
          <a
            href="mailto:help@studybuddyusc.com"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 font-medium transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/settings" className="hover:underline">Settings</Link>
          {" • "}
          <Link to="/tutors" className="hover:underline">Find Tutors</Link>
          {" • "}
          <Link to="/schedule" className="hover:underline">My Schedule</Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
