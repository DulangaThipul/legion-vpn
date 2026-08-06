import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'No VPN ID provided' }, { status: 400 });
  }

  try {
    // 🚀 ඔයා හොයාගත්ත CloudNet API Link එක
    const fetchUrl = `https://app.cloudnet.one/ajax/vpn/usage?id=${id}`;
    
    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      next: { revalidate: 30 } // තත්පර 30න් 30ට අලුත් වෙනවා
    });

    if (!res.ok) throw new Error("Failed to fetch from CloudNet");
    
    // JSON Data එක ගන්නවා
    const data = await res.json();

    if (data.success && data.has_account) {
      return NextResponse.json({
        dataUsed: `${data.used_gb} GB`,
        limit: data.limit_gb > 0 ? `Limit: ${data.limit_gb} GB (${data.percent}%)` : 'Unlimited Plan'
      });
    } else {
       return NextResponse.json({ error: 'No Data Found' }, { status: 404 });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
