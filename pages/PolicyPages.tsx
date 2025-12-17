import React from 'react';
import { Logo } from '../components/Logo';
import { ArrowLeft } from 'lucide-react';

interface PolicyPageProps {
  type: 'refund' | 'contact' | 'privacy' | 'terms' | 'shipping';
  onBack: () => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type, onBack }) => {
  const content = {
    refund: {
      title: 'Cancellation & Refund Policy',
      sections: [
        {
          heading: 'Subscription Cancellation',
          text: 'You can cancel your subscription at any time from your account settings. Cancellation will take effect at the end of your current billing period.'
        },
        {
          heading: 'Refund Policy',
          text: 'We offer a 7-day money-back guarantee for new subscribers. If you are not satisfied with our service, contact us within 7 days of your initial purchase for a full refund.'
        },
        {
          heading: 'Pro-rated Refunds',
          text: 'For cancellations after the 7-day period, we do not offer pro-rated refunds. Your subscription will remain active until the end of the current billing cycle.'
        },
        {
          heading: 'Processing Time',
          text: 'Approved refunds are processed within 5-7 business days and will be credited to your original payment method.'
        }
      ]
    },
    contact: {
      title: 'Contact Us',
      sections: [
        {
          heading: 'Get in Touch',
          text: 'We\'re here to help! Reach out to us through any of the following channels:'
        },
        {
          heading: 'Email Support',
          text: 'For general inquiries: jainn.ai.contact@gmail.com\nFor technical support: support@jainn.ai\nFor billing questions: billing@jainn.ai'
        },
        {
          heading: 'Response Time',
          text: 'We aim to respond to all inquiries within 24 hours during business days (Monday-Friday, 9 AM - 6 PM IST).'
        },
        {
          heading: 'Business Address',
          text: 'Jainn AI\nVirar, Maharashtra, India'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      sections: [
        {
          heading: 'Information We Collect',
          text: 'We collect information you provide directly (email, name), usage data (chat history, preferences), and technical data (IP address, device info) to provide and improve our services.'
        },
        {
          heading: 'How We Use Your Data',
          text: 'Your data is used to: provide AI services, improve model performance, personalize your experience, process payments, and send service updates. We never sell your personal data.'
        },
        {
          heading: 'Data Storage & Security',
          text: 'All data is encrypted in transit and at rest. We use industry-standard security measures and store data on secure servers (Supabase). Chat history is only accessible by you.'
        },
        {
          heading: 'Your Rights',
          text: 'You have the right to access, correct, or delete your personal data. You can export or delete your chat history at any time from your account settings.'
        },
        {
          heading: 'Third-Party Services',
          text: 'We use: Google (Gemini API), OpenRouter (LLaMA/Mistral), Supabase (data storage), and Razorpay (payments). Each has their own privacy policy.'
        },
        {
          heading: 'Cookies',
          text: 'We use essential cookies for authentication and preferences. No tracking or advertising cookies are used.'
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      sections: [
        {
          heading: 'Acceptance of Terms',
          text: 'By using Jainn AI, you agree to these Terms of Service. If you do not agree, please do not use our service.'
        },
        {
          heading: 'Service Description',
          text: 'Jainn AI provides multi-agent AI chat services powered by Gemini, LLaMA, and Mistral models. We offer free and paid tiers with varying features and limitations.'
        },
        {
          heading: 'User Responsibilities',
          text: 'You agree to: use the service legally and ethically, not abuse or overload our systems, not share explicit/harmful content, keep your credentials secure, and comply with AI model provider terms.'
        },
        {
          heading: 'Usage Limits',
          text: 'Free: 5,000 tokens/day, 3 images/day. Pro: 50,000 tokens/day, 20 images/day. Ultra: Unlimited tokens, 30 images/day. We may throttle excessive usage.'
        },
        {
          heading: 'Content Ownership',
          text: 'You retain ownership of your prompts and chat history. AI-generated responses are provided as-is. We claim no ownership of your content.'
        },
        {
          heading: 'Prohibited Use',
          text: 'Do not use Jainn AI for: illegal activities, generating harmful content, impersonating others, spamming, reverse engineering, or commercial scraping without permission.'
        },
        {
          heading: 'Service Availability',
          text: 'We strive for 99.9% uptime but do not guarantee uninterrupted service. Maintenance windows will be announced when possible.'
        },
        {
          heading: 'Limitation of Liability',
          text: 'Jainn AI is provided "as-is". We are not liable for: AI-generated content accuracy, service interruptions, data loss, or indirect damages. Maximum liability is limited to fees paid in the last 3 months.'
        },
        {
          heading: 'Changes to Terms',
          text: 'We may update these terms. Continued use after changes constitutes acceptance. Major changes will be notified via email.'
        }
      ]
    },
    shipping: {
      title: 'Shipping Policy',
      sections: [
        {
          heading: 'Digital Service',
          text: 'Jainn AI is a 100% digital service. There are no physical products or shipping involved.'
        },
        {
          heading: 'Instant Access',
          text: 'Upon successful payment, your subscription is activated immediately. You will receive instant access to all Pro or Ultra features.'
        },
        {
          heading: 'Delivery Method',
          text: 'Access is delivered electronically through your Jainn AI account. Simply log in to start using premium features.'
        },
        {
          heading: 'No Physical Delivery',
          text: 'As a software service, we do not ship any physical items. All services are accessed online at jainn.ai.'
        }
      ]
    }
  };

  const policy = content[type];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <Logo size={40} />
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-white/10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 dark:text-white">
            {policy.title}
          </h1>

          <div className="space-y-8">
            {policy.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-xl font-bold mb-3 dark:text-white">
                  {section.heading}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400">
            <p>Last Updated: December 17, 2024</p>
            <p className="mt-2">
              Questions? Contact us at{' '}
              <a href="mailto:jainn.ai.contact@gmail.com" className="text-blue-500 hover:underline">
                jainn.ai.contact@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
