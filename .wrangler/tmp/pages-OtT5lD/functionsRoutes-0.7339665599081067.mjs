import { onRequestPost as __api_send_booking_ts_onRequestPost } from "/app/applet/functions/api/send-booking.ts"
import { onRequestPost as __api_sifalo_pay_ts_onRequestPost } from "/app/applet/functions/api/sifalo-pay.ts"

export const routes = [
    {
      routePath: "/api/send-booking",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_send_booking_ts_onRequestPost],
    },
  {
      routePath: "/api/sifalo-pay",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sifalo_pay_ts_onRequestPost],
    },
  ]