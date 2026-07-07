import React from 'react';
import { COLORS } from '../constants/theme';

const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: COLORS.white }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: COLORS.gray[900] }}>
          Refund &amp; Return Policy
        </h1>
        <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: COLORS.gray[500] }}>
          Return, refund and delivery policies
        </p>

        <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
          <p>
            Products purchased from our online site can be returned for a refund at any Pagariya
            store within 7 days from the date of the invoice provided;
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The product has not been used and has not been altered in any manner,</li>
            <li>The product is intact and in saleable condition and</li>
            <li>The product is accompanied by the original invoice of purchase.</li>
          </ul>
          <p>
            The following types of products once accepted by customers cannot be returned:
            Refrigerated items such as Butter, Cheese, Dahi, Shrikhand, etc. Personal utility
            products such as, undergarments, handkerchiefs, socks and cosmetics.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" style={{ color: COLORS.gray[900] }}>
            Please Note
          </h2>
          <div className="space-y-3 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
            <p>
              Products can only be returned for a refund. We don't provide an exchange of products
              for purchases done through Online Shopping.
            </p>
            <p>
              Products purchased online from our web site or mobile app can be returned only at our
              Pagariya stores. In the event of any quality related complaint about a product, the
              customer should contact the Pagariya's consumer care number or the consumer care cell
              of the manufacturer/ marketer of the product. Details of the consumer care cell of the
              Manufacturer or Marketer will be present on the packaging of the product.
            </p>
            <p>
              Pagariya will refund customers through the same payment mode that was used to purchase
              the product online. Refunds for products that were purchased online using credit
              cards/Debit Cards/Internet Banking/UPIs will be credited back to the respective
              account.
            </p>
            <p>
              Pagariya shall not be held liable either directly or indirectly for the quality of any
              Product. Products covered under Manufacturer's warranty/guarantee cannot be returned
              to Pagariya, as the same is covered by the after-sale service offered by the
              manufacturer of the Product. Pagariya will not be directly or indirectly liable for
              goods covered under the manufacturer's warranty/guarantee.
            </p>
            <p>
              In the event of any disputes in this regard, the same shall be referred to courts of
              competent jurisdiction.
            </p>
            <p>
              Pagariya reserves the right to alter or modify any of the terms and conditions of this
              Policy without assigning any reason or providing intimation whatsoever. Pagariya's
              decision on the above would be final and the customer shall abide by the same
              unconditionally.
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" style={{ color: COLORS.gray[900] }}>
            Consent
          </h2>
          <div className="space-y-3 text-sm sm:text-base leading-relaxed" style={{ color: COLORS.gray[600] }}>
            <p>By accessing this website, you consent to the terms and conditions of the Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
