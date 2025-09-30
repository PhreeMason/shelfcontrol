// Supabase Edge Function: Export Reading Progress CSV
/// <reference types="https://deno.land/x/deno@v1.37.0/cli/tsc/dts/lib.deno.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate user has email
    if (!user.email) {
      console.error('User has no email address');
      return new Response(JSON.stringify({
        error: 'User email not found'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Check rate limit: user can only export once per 24 hours
    const { data: recentExports, error: rateLimitError } = await supabaseClient
      .from('csv_export_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('exported_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (recentExports && recentExports.length > 0) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'You can only export your data once per 24 hours. Please try again later.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '86400'
        }
      });
    }

    // Execute the reading progress CSV query
    const { data, error } = await supabaseClient.rpc('get_reading_progress_csv', {
      p_user_id: user.id
    });
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch reading progress data'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Handle case where user has no data
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({
        message: 'No reading progress data found for export',
        recordCount: 0
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Generate CSV content
    const csvContent = convertToCSV(data);
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reading-progress-${timestamp}.csv`;
    // Send email with CSV attachment
    const emailResult = await sendEmailWithCSV(user.email, csvContent, filename, data.length);
    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return new Response(JSON.stringify({
        error: 'Failed to send email with CSV export',
        details: emailResult.error
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Log successful export for rate limiting
    const { error: logError } = await supabaseClient
      .from('csv_export_logs')
      .insert({
        user_id: user.id,
        record_count: data.length,
        exported_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log export:', logError);
    }

    return new Response(JSON.stringify({
      message: 'CSV exported and emailed successfully',
      filename: filename,
      recordCount: data.length,
      emailId: emailResult.emailId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
/**
 * Converts array of objects to CSV format
 */ function convertToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) {
    return 'No data available for export';
  }

  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Get and escape headers from first object
  const headers = Object.keys(data[0]).map(escapeCSVValue).join(',');
  // Convert each row to CSV format
  const rows = data.map((row)=>Object.values(row).map(escapeCSVValue).join(',')).join('\n');
  return `${headers}\n${rows}`;
}
/**
 * Send email with CSV attachment using Resend API
 */ async function sendEmailWithCSV(
  userEmail: string,
  csvContent: string,
  filename: string,
  recordCount: number
): Promise<EmailResult> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return {
      success: false,
      error: 'Resend API key not configured'
    };
  }
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@shelfcontrolapp.com';
  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [
          userEmail
        ],
        subject: 'Your Reading Progress Export',
        html: generateEmailHTML(filename, recordCount),
        attachments: [
          {
            filename: filename,
            content: btoa(unescape(encodeURIComponent(csvContent)))
          }
        ]
      })
    });
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return {
        success: false,
        error: `Email API returned ${emailResponse.status}: ${errorText}`
      };
    }
    const result = await emailResponse.json();
    return {
      success: true,
      emailId: result.id
    };
  } catch (error) {
    console.error('Email sending error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}
/**
 * Generate HTML email content
 */ function generateEmailHTML(filename: string, recordCount: number): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reading Progress Export</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        a { color: #1976d2; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Reading Progress Export</h1>
        <p>Your reading progress data has been successfully exported.</p>
      </div>

      <div class="stats">
        <h3>Export Details</h3>
        <ul>
          <li><strong>Generated:</strong> ${currentDate}</li>
          <li><strong>Filename:</strong> ${filename}</li>
          <li><strong>Total Records:</strong> ${recordCount} ${recordCount === 1 ? 'deadline' : 'deadlines'}</li>
        </ul>
      </div>

      <h3>Attachment Information</h3>
      <p>Your CSV file is attached to this email and contains the following information:</p>
      <ul>
        <li>Book titles and authors</li>
        <li>Reading format (physical, eBook, audio)</li>
        <li>Current progress and total quantity</li>
        <li>Deadline dates and status</li>
        <li>Source and flexibility settings</li>
        <li>Creation and completion dates</li>
      </ul>

      <h3>How to Use Your Export</h3>
      <p>You can open the CSV file in:</p>
      <ul>
        <li><strong>Excel:</strong> Double-click the file or import it</li>
        <li><strong>Google Sheets:</strong> Upload via File &rarr; Import</li>
        <li><strong>Numbers (Mac):</strong> Drag and drop the file</li>
        <li><strong>Any spreadsheet app:</strong> Import as CSV</li>
      </ul>

      <div class="footer">
        <p>This export was generated automatically from your reading progress data.</p>
        <p><small>If you have any questions about your export, please contact support.</small></p>
      </div>
    </body>
    </html>
  `;
}
