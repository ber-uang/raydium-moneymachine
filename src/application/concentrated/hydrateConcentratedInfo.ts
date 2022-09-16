import { TokenStore } from '@/application/token/useToken'
import toPubString from '@/functions/format/toMintString'
import { toPercent } from '@/functions/format/toPercent'
import toUsdCurrency from '@/functions/format/toUsdCurrency'
import { div } from '@/functions/numberish/operations'
import toBN from '@/functions/numberish/toBN'

import useToken from '../token/useToken'
import { recursivelyDecimalToFraction } from '../txTools/decimal2Fraction'

import { HydratedConcentratedInfo, SDKParsedConcentratedInfo } from './type'

export default function hydrateConcentratedInfo(concentratedInfo: SDKParsedConcentratedInfo): HydratedConcentratedInfo {
  return {
    ...concentratedInfo,
    ...hydratePoolInfo(concentratedInfo),
    ...hydrateFeeRate(concentratedInfo),
    ...hydrateUserPositionAccounnt(concentratedInfo),
    idString: toPubString(concentratedInfo.state.id),
    liquidity: toUsdCurrency(Math.round(concentratedInfo.state.liquidity.toNumber())),
    fee24h: toUsdCurrency(concentratedInfo.state.day.fee),
    fee7d: toUsdCurrency(concentratedInfo.state.week.fee),
    fee30d: toUsdCurrency(concentratedInfo.state.month.fee),
    volume24h: toUsdCurrency(concentratedInfo.state.day.volume),
    volume7d: toUsdCurrency(concentratedInfo.state.week.volume),
    volume30d: toUsdCurrency(concentratedInfo.state.month.volume)
  }
}

/**
 * part of {@link hydrateConcentratedInfo}
 */
function hydratePoolInfo(
  sdkConcentratedInfo: SDKParsedConcentratedInfo
): Pick<HydratedConcentratedInfo, 'base' | 'quote' | 'id' | 'name'> {
  const { getToken } = useToken.getState()
  const base = getToken(sdkConcentratedInfo.state.mintA.mint)
  const quote = getToken(sdkConcentratedInfo.state.mintB.mint)
  const name = (base ? base.symbol : 'unknown') + '-' + (quote ? quote?.symbol : 'unknown')

  return {
    id: sdkConcentratedInfo.state.id,
    base,
    quote,
    name
  }
}

/**
 * part of {@link hydrateConcentratedInfo}
 */
function hydrateFeeRate(
  sdkConcentratedInfo: SDKParsedConcentratedInfo
): Pick<HydratedConcentratedInfo, 'protocolFeeRate' | 'tradeFeeRate'> {
  return {
    protocolFeeRate: toPercent(div(sdkConcentratedInfo.state.ammConfig.protocolFeeRate, 10 ** 8)),
    tradeFeeRate: toPercent(div(sdkConcentratedInfo.state.ammConfig.tradeFeeRate, 10 ** 8))
  }
}

/**
 * part of {@link hydrateConcentratedInfo}
 */
function hydrateUserPositionAccounnt(
  sdkConcentratedInfo: SDKParsedConcentratedInfo
): Pick<HydratedConcentratedInfo, 'userPositionAccount'> {
  return {
    userPositionAccount: sdkConcentratedInfo.positionAccount?.map((a) => ({
      ...recursivelyDecimalToFraction(a),
      amountA: toBN(a.amountA),
      amountB: toBN(a.amountB),
      nftMint: a.nftMint // need this or nftMint will be buggy, this is only quick fixed
    }))
  }
}
