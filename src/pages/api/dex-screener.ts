// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { JSDOM } from 'jsdom'

type DexScreenerResult = {
  name: string
  dexScreenerData: any
}

const DEX_SCREENER_BASEURL = 'https://dexscreener.com'

let increment: number = 0

setInterval(() => increment++, 1000)

export default async function handler(req: NextApiRequest, res: NextApiResponse<DexScreenerResult>) {
  // TODO: filter is now completely manual
  const result = await fetchDexScreener(DEX_SCREENER_BASEURL, {
    rankBy: 'trendingScoreH6',
    order: 'desc',
    chainIds: 'solana',
    minLiq: 1000
  })

  res.status(200).json({ name: 'DEX Screener :D ' + increment, dexScreenerData: result.route.data.dexScreenerData })
}

const fetchDexScreener = async (baseUrl: string, filters?: Record<string, string | number>) => {
  const queryParams: string[] = []

  if (filters) {
    Object.keys(filters).forEach((key) => {
      queryParams.push(`${key}=${filters[key]}`)
    })
  }

  const url = `${baseUrl}?${queryParams.join('&')}`

  console.log(`Loading url: ${url}`)

  const resp = await fetch(url, {
    headers: {
      // faking the browser
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

      // this is a must: first load always goes through cloudflare, so we need to have some cookie attacahed to the request
      // otherwise it's going to fail.
      // TODO: need to figure out some automation to update this cookie
      Cookie:
        '_ga=GA1.1.2026134968.1705559369; chakra-ui-color-mode=dark; __cuid=a717ad62e9774a709109950ca2ec4d6f; amp_fef1e8=9b5d5883-980e-41ad-b73a-5a8fc011ea55R...1hktc0vg4.1hktc0vg7.a.5.f; _ga_RD6VMQDXZ6=GS1.1.1706153694.8.0.1706153694.0.0.0; cf_clearance=Z35GqdHXAksRxLr9kRxJv8BjjHDlAgBVbcWzqjvCHrM-1706174438-1-AdqtM8fdjOVqQ09uAy0T+9DKcwk5fE4kDBZpRorwvfBICGBPtOWkJePtQ2hMgv9aMjVsgqBvd8TtETBZJ3AOMxo=; __cf_bm=zJY7bsLN9rGdjfLAI3tDYisT1B3PcpbFRMW.F5h.wYo-1706176544-1-ARLVZaOhqXft104tRCuetoFx+q5n1y4K0AxOGMY3bD4oMhqmLhVnU8sGBAQWdKuaaXcn6dcOcnMGnZfyf3YW2rG9a0Pd6na+ZYZRmbuj3bqn; _ga_532KFVB4WT=GS1.1.1706176859.17.0.1706176868.51.0.0'
    }
  })
  const content = await resp.text()

  const dom = new JSDOM(content)

  const scripts = Array.from(dom.window.document.querySelectorAll('script'))
  const targetScript = scripts.find((script) => script.textContent?.includes('SERVER_DATA'))

  if (targetScript) {
    // adjust script content
    let serverData: any
    const scriptContent = targetScript.textContent!.replace('window.__SERVER_DATA', 'serverData')
    eval(scriptContent)

    console.log(`ServerData parsed successfully. PairsCnt: ${serverData.route.data.dexScreenerData.pairs.length}`)

    return serverData
  } else {
    console.log(`something wrong while fetching ${url}`)
    return content
  }
}
