/**
 * Order handler: validates body, builds message, sends via Meta WhatsApp Cloud API.
 * Env: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_RECIPIENT_PHONE[, WHATSAPP_RECIPIENT_PHONE_2]
 */

const META_GRAPH_VERSION = 'v21.0';

function buildOrderMessage(body) {
  const { route, date, service, fullName, phoneNumber, pickup, destination } = body;
  const routeText = route === 'irbid_to_amman' ? 'Irbid → Amman' : 'Amman → Irbid';
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  let serviceDesc = '';
  switch (service.type) {
    case 'basic':
      serviceDesc = 'Basic Ride - 5 JOD';
      break;
    case 'private':
      serviceDesc = `Private Ride - 15 JOD (${service.alone ? 'Alone' : 'Family'})`;
      break;
    case 'airport':
      const airportPrice = route === 'irbid_to_amman' ? 25 : 15;
      serviceDesc = `Airport Service - ${airportPrice} JOD (${service.toAirport ? 'To Airport' : 'From Airport'})`;
      break;
    case 'instant':
      serviceDesc = `Instant Order: ${service.description}`;
      break;
    default:
      serviceDesc = 'Unknown service';
  }

  const pickupMapsUrl = `https://www.google.com/maps?q=${pickup.latitude},${pickup.longitude}`;
  const destMapsUrl = `https://www.google.com/maps?q=${destination.latitude},${destination.longitude}`;

  return `
New Trip5 Order
---
Route: ${routeText}
Date: ${dateStr} at ${timeStr}
Service: ${serviceDesc}
---
Pickup: ${pickup.address}
  Map: ${pickupMapsUrl}

Destination: ${destination.address}
  Map: ${destMapsUrl}
---
Name: ${fullName}
Phone: ${phoneNumber}
---
  `.trim();
}

async function sendWhatsAppMessage(phoneNumberId, accessToken, to, templateParams) {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar' },
        components: [
          {
            type: 'body',
            parameters: templateParams,
          },
        ],
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${errText}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    if (!body) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const { route, date, service, fullName, phoneNumber, pickup, destination } = body;
    if (!route || !service || !fullName || !phoneNumber || !pickup || !destination) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipient1 = process.env.WHATSAPP_RECIPIENT_PHONE;

    if (!token || !phoneNumberId || !recipient1) {
      return res.status(500).json({
        error:
          'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_RECIPIENT_PHONE in environment variables.',
      });
    }

    const routeText = route === 'irbid_to_amman' ? 'إربد → عمّان' : 'عمّان → إربد';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('ar-JO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

    let serviceDesc = '';
    switch (service.type) {
      case 'basic':
        serviceDesc = 'خدمة عادية - 5 دنانير';
        break;
      case 'private':
        serviceDesc = `خدمة خاصة - 15 دينار (${service.alone ? 'شخص واحد' : 'عائلة'})`;
        break;
      case 'airport': {
        const airportPrice = route === 'irbid_to_amman' ? 25 : 15;
        serviceDesc = `خدمة المطار - ${airportPrice} دينار (${service.toAirport ? 'إلى المطار' : 'من المطار'})`;
        break;
      }
      case 'instant':
        serviceDesc = `طلب فوري: ${service.description}`;
        break;
      default:
        serviceDesc = 'خدمة غير معروفة';
    }

    const pickupMapsUrl = `https://www.google.com/maps?q=${pickup.latitude},${pickup.longitude}`;
    const destMapsUrl = `https://www.google.com/maps?q=${destination.latitude},${destination.longitude}`;

    const templateParams = [
      { type: 'text', text: routeText }, // {{1}} المسار
      { type: 'text', text: `${dateStr} ${timeStr}` }, // {{2}} التاريخ/الوقت
      { type: 'text', text: serviceDesc }, // {{3}} نوع الخدمة
      { type: 'text', text: pickup.address }, // {{4}} عنوان الانطلاق
      { type: 'text', text: pickupMapsUrl }, // {{5}} رابط خريطة الانطلاق
      { type: 'text', text: destination.address }, // {{6}} عنوان الوجهة
      { type: 'text', text: destMapsUrl }, // {{7}} رابط خريطة الوجهة
      { type: 'text', text: fullName }, // {{8}} اسم العميل
      { type: 'text', text: phoneNumber }, // {{9}} رقم الهاتف
    ];

    const recipients = [recipient1];
    const recipient2 = process.env.WHATSAPP_RECIPIENT_PHONE_2;
    if (recipient2) recipients.push(recipient2);

    const results = await Promise.all(
      recipients.map((to) => sendWhatsAppMessage(phoneNumberId, token, to, templateParams))
    );

    return res.status(200).json({ success: true, messageIds: results.map((r) => r.messages?.[0]?.id).filter(Boolean) });
  } catch (err) {
    console.error('Order API error:', err);
    return res.status(500).json({ error: 'Failed to process order' });
  }
}
