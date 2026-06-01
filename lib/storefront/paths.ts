export function getStorefrontHomePath() {
  return "/";
}

export function getStorefrontSectionPath(sectionId: string) {
  return `/section/${sectionId}`;
}

export function toPublicStorefrontPath(pathname: string, subdomain: string) {
  const internalBase = `/store/${subdomain}`;

  if (pathname === internalBase) {
    return getStorefrontHomePath();
  }

  if (pathname.startsWith(`${internalBase}/`)) {
    return pathname.slice(internalBase.length) || getStorefrontHomePath();
  }

  return pathname;
}
