import { google } from 'googleapis';

export async function POST(req: Request) {

  try {

    const { url } = await req.json();

    const auth = new google.auth.GoogleAuth({

      credentials: {

        client_email:
          process.env.GOOGLE_INDEXING_CLIENT_EMAIL,

        private_key:
          process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
          ),
      },

      scopes: [
        'https://www.googleapis.com/auth/indexing'
      ],
    });

    const indexing = google.indexing({
      version: 'v3',
      auth,
    });

    await indexing.urlNotifications.publish({

      requestBody: {

        url,

        type: 'URL_UPDATED',
      },
    });

    return Response.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    return Response.json(
      { success: false },
      { status: 500 }
    );
  }
}