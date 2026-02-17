import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(1),
  company: z.string().optional().default('')
});

function envValue(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value : '';
}

function buildTransporter() {
  const host = envValue('SMTP_HOST');
  const port = Number(envValue('SMTP_PORT'));
  const user = envValue('SMTP_USER');
  const pass = envValue('SMTP_PASS');

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: envValue('SMTP_SECURE') === 'true',
    auth: { user, pass }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { ok: false, errors: result.error.flatten().fieldErrors, message: 'Invalid payload.' },
        { status: 400 }
      );
    }

    if (result.data.company) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const transporter = buildTransporter();

    if (!transporter) {
      return Response.json(
        { ok: false, message: 'Email service is not configured on this server.' },
        { status: 500 }
      );
    }

    const to = envValue('CONTACT_TO_EMAIL');
    const from = envValue('CONTACT_FROM_EMAIL');

    if (!to || !from) {
      return Response.json(
        { ok: false, message: 'Contact destination email is not configured.' },
        { status: 500 }
      );
    }

    await transporter.sendMail({
      from,
      to,
      subject: `Portfolio contact request from ${result.data.name}`,
      text: `Name: ${result.data.name}\nEmail: ${result.data.email}\n\n${result.data.message}`,
      replyTo: result.data.email
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (_error) {
    return Response.json(
      { ok: false, message: 'Unable to send contact request at this time.' },
      { status: 500 }
    );
  }
}
