import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    // 1. Seller ගේ ලින්ක් එකට Request එක යවනවා
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 60 } // විනාඩියකට සැරයක් Cache වෙනවා (Speed වෙන්න)
    });

    const html = await res.text();

    // 2. ඔයා එවපු Screenshot එකේ තියෙන Classes Regex වලින් හොයනවා
    // <div class="card-value vpn-data-used">4.202 GB</div>
    const dataUsedMatch = html.match(/class="[^"]*vpn-data-used[^"]*">([^<]+)<\/div>/i);
    
    // <div class="card-sub">Limit: 200 GB (2.1%)</div>
    const limitMatch = html.match(/class="[^"]*card-sub[^"]*">([^<]+)<\/div>/i);

    return NextResponse.json({
      dataUsed: dataUsedMatch ? dataUsedMatch[1].trim() : "N/A",
      limit: limitMatch ? limitMatch[1].trim() : "Unlimited / Unverified"
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}