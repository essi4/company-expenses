export function requireSameOrigin(request: Request): Response | null {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && origin !== expectedOrigin) {
    return Response.json({ success: false, message: "درخواست نامعتبر است." }, { status: 403 });
  }

  if (!origin && referer) {
    try {
      if (new URL(referer).origin !== expectedOrigin) {
        return Response.json({ success: false, message: "درخواست نامعتبر است." }, { status: 403 });
      }
    } catch {
      return Response.json({ success: false, message: "درخواست نامعتبر است." }, { status: 403 });
    }
  }

  return null;
}
