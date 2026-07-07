import { Helmet } from "react-helmet-async";

export default function SEO({

title,

description,

image,

url,

type = "website",

jsonLd

}) {

return (

<Helmet>

<title>{title}</title>

<meta name="description" content={description} />

<link rel="canonical" href={url} />

<meta property="og:type" content={type} />

<meta property="og:title" content={title} />

<meta property="og:description" content={description} />

<meta property="og:image" content={image} />

<meta property="og:url" content={url} />

<meta name="twitter:card" content="summary_large_image" />

<meta name="twitter:title" content={title} />

<meta name="twitter:description" content={description} />

<meta name="twitter:image" content={image} />

{jsonLd && (

<script type="application/ld+json">

{JSON.stringify(jsonLd)}

</script>

)}

</Helmet>

);

}