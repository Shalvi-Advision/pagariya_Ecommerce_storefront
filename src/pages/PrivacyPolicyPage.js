import React from 'react';
import { COLORS } from '../constants/theme';

const sections = [
  {
    title: 'Scope of the Policy',
    paragraphs: [
      'This Policy describes how we collect and use information that customers provide to us in connection with the creation, registration or administration of their respective accounts on the web site, which we refer to as "Account Information". For example, Account Information includes names, usernames, phone numbers, email addresses and billing information associated with a customer\'s Pagariya account.',
    ],
  },
  {
    title: 'Applicability of this Policy and Confidentiality',
    paragraphs: [
      'This Policy applies to customers Account Information only. We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.',
      'We may release your information to comply with applicable law or to abide by any order from appropriate authority, enforce our site policies, or protect our interest if necessary.',
      'However, non-personal identifiable information may be provided, to other parties for marketing, advertising, or other uses as permitted by law.',
    ],
  },
  {
    title: 'How Pagariya uses Account Information',
    paragraphs: [
      'Any of the information we collect from you may be used in one of the following ways: To offer personalized and enhanced shopping experience on our website. To administer various promotions, surveys, or other site features. To send periodic updates and emails. To send you information and to respond to enquiries and other requests you may have.',
    ],
  },
  {
    title: 'Cookies',
    paragraphs: [
      'A "cookie" is a small piece of information stored by a web server on a web browser so it can be later read back from that browser. Cookies are useful for enabling the browser to remember information specific to a given user. We place both permanent and temporary cookies in your computer\'s hard drive. The cookies do not contain any of your personally identifiable information. We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits, keep track of advertisements and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future.',
    ],
  },
  {
    title: 'Third Party Links',
    paragraphs: [
      'While shopping online you could sometimes access third party products or services. These links and offers on third party sites have separate and independent privacy policies. Pagariya has no responsibility or liability for the content and activities of these linked sites if any. Nonetheless, we seek to protect the integrity of our site and welcome any feedback about these sites.',
    ],
  },
  {
    title: 'Minors Accessing the Website',
    paragraphs: [
      'Pagariya shall not be held liable for any transactions done on the website by a minor representing that he/she is a major. Contracts entered by minors are void ab initio as per Indian law.',
    ],
  },
  {
    title: 'Amendment to the Policy',
    paragraphs: [
      'Pagariya reserves the right to change the Policy to its business requirements. We will post those changes on this site as and when modified. Do frequent this website to access the updated Pagariya Privacy Policy as modified from time to time.',
    ],
  },
  {
    title: 'Consent',
    paragraphs: [
      'By accessing our website, you consent to the terms and conditions of the policy.',
    ],
  },
];

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: COLORS.white }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: COLORS.gray[500] }}>
          Data collection and usage policies
        </p>

        <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
          <p>
            We receive information from you when you register on our mobile app, subscribe to our
            product updates, or fill out a form sharing your personal data.
          </p>
          <p>
            When ordering or registering on our site, you may be requested to share your name,
            e-mail address or phone number. We appreciate that you care about how your information
            is used and secured at our end. We value the trust you place in us, and are committed
            to handling your data with the required level of confidentiality. We employ the highest
            standards for secure transactions and customer information privacy. Please read the
            following policy statement to learn more.
          </p>
          <p>
            We may release your information to comply with applicable law or to abide by any order
            from appropriate authority, enforce our site policies, or protect our interest if
            necessary.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" style={{ color: COLORS.gray[900] }}>
              {section.title}
            </h2>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
