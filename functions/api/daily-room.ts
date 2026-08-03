export const onRequestPost = async (context: { request: Request; env?: any }) => {
  try {
    const data = await context.request.json() as { bookingId?: string };
    const bookingId = data.bookingId || "session";
    const cleanId = bookingId.replace(/[^a-zA-Z0-9_-]/g, "");

    const apiKey = (context.env && context.env.DAILY_API_KEY) ||
      (typeof process !== "undefined" && process.env && process.env.DAILY_API_KEY);

    const jitsiUrl = `https://meet.jit.si/BarbaarWellness-Session-${cleanId}`;

    if (apiKey) {
      try {
        const response = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            name: `barbaar-session-${cleanId}`,
            privacy: "public",
            properties: {
              enable_chat: true,
              start_audio_off: false,
              start_video_off: false,
            },
          }),
        });
        const resData = await response.json() as any;
        if (resData && resData.url) {
          return new Response(JSON.stringify({ 
            url: resData.url, 
            jitsiUrl, 
            hasDailyApiKey: true 
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.warn("Daily API endpoint fetch error:", err);
      }
    }

    const domain = (context.env && context.env.DAILY_DOMAIN) ||
      (typeof process !== "undefined" && process.env && process.env.DAILY_DOMAIN) ||
      "barbaar";

    const roomUrl = `https://${domain}.daily.co/session-${cleanId}`;
    return new Response(JSON.stringify({ 
      url: roomUrl, 
      jitsiUrl, 
      hasDailyApiKey: false 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      url: "https://barbaar.daily.co/session-room", 
      jitsiUrl: "https://meet.jit.si/BarbaarWellness-Session-Room",
      hasDailyApiKey: false 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
