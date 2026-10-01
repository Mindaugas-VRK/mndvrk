import { GA_ID } from "./analytics-config";

/**
 * Google tag with Consent Mode v2, rendered into the server HTML of public pages
 * so Google can detect it. Everything is denied by default: no cookies are set
 * until the visitor clicks "Accept" in the cookie banner (components/analytics.tsx).
 */
export function GoogleTag() {
  const init = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('esg_cookie_consent')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}
gtag('js',new Date());
gtag('config','${GA_ID}');`;
  return (
    <>
      <script id="google-consent" dangerouslySetInnerHTML={{ __html: init }} />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
    </>
  );
}
