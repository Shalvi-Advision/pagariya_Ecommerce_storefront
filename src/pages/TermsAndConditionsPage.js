import React from 'react';
import { COLORS } from '../constants/theme';

const sections = [
  {
    title: 'Offer and Acceptance',
    paragraphs: [
      'The Customer agrees to these T&C by accessing this Website. All commercial/contractual terms are offered by and agreed to between Customers and Pagariya alone.',
      "Pagariya may include additional or conflicting terms and conditions of sale in the product listing or product description as made available on the website ('Additional Terms of Sale'). If there is any conflict between the T&C and the additional terms of sale, the additional terms of sale shall take precedence to the extent of such conflict and in relation to that sale.",
      'Pagariya may at any time modify the Terms and Conditions for use of the Website without any prior notification to the customers. If a customer does not agree with the T&C he/she is advised not to buy or attempt to buy any product listed on the Website. However, if the customer continues to use the service he/she shall be deemed to have agreed to accept and abide by the modified Terms & Conditions of Use of this Website.',
    ],
  },
  {
    title: 'Limitations',
    paragraphs: [
      'Services associated with the Website would be available to only select geographies in India as solely determined by Pagariya.',
      'Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 as detailed in the Privacy Policy are not eligible to use the Website. Pagariya shall not be held directly or indirectly liable for any damages arising from the customer\'s or any 3rd party\'s misuse or violation of the Terms & Conditions of the Pagariya (Online) site and mobile apps, and any other related policies associated with the Website.',
      'Pagariya does not implicitly or explicitly endorse or advertise the products and associated brands on the Website.',
      "References on this Website to any names, marks, products or services of third parties or hypertext links to third party sites or information are provided solely as a convenience to the Customer and do not in any way constitute or imply to be Pagariya's endorsement, sponsorship or recommendation of the third party, information, product or service.",
    ],
  },
  {
    title: 'Intellectual Property Rights (IPR)',
    paragraphs: [
      "Pagariya expressly reserves all intellectual property rights in all text, programs, products, processes, technology, content and other materials, which appear on this Website and mobile apps. Access to this Website does not confer and shall not be considered as conferring upon anyone any license under any of Pagariya's or any third party's intellectual property rights.",
      'Apart from the brands / Intellectual Property Rights (IPR) owned by Pagariya, all other trademarks/ brands displayed on the Website are the property of their respective brand owners and displayed on the Website with prior consent by Pagariya.',
      'Pagariya hereby allows the Customer to only access the website for personal use and not to download or modify any portion of it. This website or any portion of this Website may not be reproduced, duplicated, copied, sold, resold, visited, or otherwise exploited for any commercial purpose without the express written consent of Pagariya.',
      'All reviews, comments, feedback, postcards, suggestions, ideas, and other submissions disclosed, submitted or offered to the Website on or by this Site or otherwise disclosed, submitted or offered in connection with the use of this Website (collectively, the "Feedback") shall be and remain the property of Pagariya. Such disclosure, submission or offer of any Feedback on the Website shall constitute an assignment to Pagariya of all worldwide rights, titles and interests in all copyrights and other intellectual properties in the Feedback by the Users.',
    ],
  },
  {
    title: 'Representation',
    paragraphs: [
      "Pagariya does not make any Representation or Warranty as to specifics (such as Product claims, manufacturer's product liability, etc.) of the Products proposed to be sold or offered to be sold or purchased on the Website.",
      'All offers of sale of a Product are governed by the description and specifications of the Product, terms of warranties provided by the respective manufacturer/brand owners (as applicable) in addition to these Terms and Conditions. In the event a manufacturer/brand owner (as applicable) is providing any warranty, details of such warranty will be specified on the relevant Product webpage on the Website or made available along with the Product. Such warranties are provided by manufacturer/ brand owner (as applicable) and will be fulfilled by the manufacturer/ brand owner (as applicable).',
    ],
  },
  {
    title: 'Warranty',
    paragraphs: [
      'With respect to the sale of Product by Pagariya to the Customer, Pagariya hereby represents and warrants to the Customer that:',
    ],
    list: [
      'Pagariya has the right to sell the Products to the Customer through the Website;',
      'Customer shall have and enjoy quiet possession of the Products on completion of sale;',
      'Products shall be free from any charge or encumbrance in favour of third party;',
      'Customer shall be entitled to all the warranties and other collaterals applicable to the Product or as generally made available by the manufacturer or brand owner of the Product;',
      'Pagariya has made every effort to display the Products that appear on the Website as accurately as possible. However, any deviance in appearance in actual product cannot be held against Pagariya.',
    ],
  },
  {
    title: 'Customer Representations',
    paragraphs: ['The Customer hereby represents and warrants to Pagariya:'],
    list: [
      'That the Customer is accessing the Website and transacting at his/her sole risk and is using his/her best informed and prudent judgment before entering into any transaction through this Website.',
      'Customer will use the Website for lawful purposes only and comply with all applicable laws and regulations while using and transacting on the Website.',
      'Customer will provide authentic and true information in all instances where such information is requested by Pagariya. Pagariya reserves the right to confirm and validate the information and other details provided by the customer at any point of time.',
      "If upon confirmation the Customer's details are found not to be true (wholly or partly), Pagariya has the right in its sole discretion to reject the registration and debar such customer from accessing the Website without prior intimation whatsoever.",
      'The address at which delivery of the product ordered by the Customer is to be made will be correct and proper in all respects. Customer is completely responsible and liable for the correctness of delivery address details in this regard.',
      "That before placing an order customer will check the product description carefully. By placing an order for a product he/she agrees to be bound by the conditions of sale included in the item's description.",
    ],
  },
  {
    title: 'Pricing Information',
    paragraphs: [
      'All the products listed on the Website will be sold at MRP unless otherwise specified. The prices mentioned at the time of ordering will be the prices charged on the date of the delivery. All prices are inclusive of GST unless stated otherwise.',
      'Pagariya may sometimes offer Buy 1 Get 1 products at half price each or less than half price each.',
    ],
  },
  {
    title: 'Delivery of the Product',
    paragraphs: [
      'Pagariya currently offer two modes of delivery for purchases made on mobile.',
    ],
  },
  {
    title: 'Home Delivery',
    paragraphs: [
      'Please note that for all home deliveries, Pagariya will charge a delivery fee. This delivery fee will be added to the billed amount at the time of checkout, while placing the order online.',
      "In case there is a delay in delivering the order to customers either due to Pagariya's own internal reasons or due to customer's unavailability - Pagariya is not obligated to compensate the customers for the inconvenience.",
      'Customers are liable to pay the entire amount of the order before or at the time of delivery.',
      'For Cash On Delivery customers who choose to pay by a credit/debit card at the time of delivery, Pagariya will make its best efforts to receive the order amount through a card swipe.',
    ],
  },
];

const TermsAndConditionsPage = () => {
  return (
    <div className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: COLORS.white }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: COLORS.gray[500] }}>
          Legal terms and user agreements
        </p>

        <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
          <p>
            The Terms and Conditions (T&amp;C) described below constitute an electronic contract,
            enforceable as per provisions of the Information Technology Act, 2000 and Rules made
            thereunder, as amended from time to time. Please note that the T&amp;C will not require
            any signature for acceptance and enforceability. We encourage our esteemed customers to
            read these terms fully before purchasing any products from our website or mobile apps.
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
              {section.list && (
                <ul className="list-disc pl-5 space-y-2">
                  {section.list.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
