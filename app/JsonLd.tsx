import Script from 'next/script';

export default function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RN Student Resources',
    url: 'https://yourdomain.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://yourdomain.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'RN Student Resources',
    url: 'https://yourdomain.com',
    logo: 'https://yourdomain.com/logo.png',
    description: 'Join over 50,000+ nursing students who have achieved their goals with our comprehensive study materials and practice tests',
    sameAs: [
      'https://twitter.com/yourhandle',
      'https://facebook.com/yourpage',
      'https://instagram.com/yourhandle'
    ]
  };

  return (
    <>
      <Script 
        id="website-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script 
        id="organization-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
} 