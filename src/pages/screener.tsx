import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { twMerge } from 'tailwind-merge'

import useAppSettings from '@/application/common/useAppSettings'
import { TimeBasis } from '@/application/concentrated/useConcentrated'
import useFarms from '@/application/farms/useFarms'
import { routeTo } from '@/application/routeTools'
import { SplToken } from '@/application/token/type'
import useToken from '@/application/token/useToken'
import useWallet from '@/application/wallet/useWallet'
import { AddressItem } from '@/components/AddressItem'
import AutoBox from '@/components/AutoBox'
import { Badge } from '@/components/Badge'
import Button from '@/components/Button'
import Card from '@/components/Card'
import CoinAvatar from '@/components/CoinAvatar'
import CoinAvatarPair from '@/components/CoinAvatarPair'
import Col from '@/components/Col'
import Collapse from '@/components/Collapse'
import CyberpunkStyleCard from '@/components/CyberpunkStyleCard'
import DecimalInput from '@/components/DecimalInput'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import Input from '@/components/Input'
import InputBox from '@/components/InputBox'
import List from '@/components/List'
import LoadingCircle from '@/components/LoadingCircle'
import { OpenBookTip } from '@/components/OpenBookTip'
import PageLayout from '@/components/PageLayout'
import Popover from '@/components/Popover'
import RefreshCircle from '@/components/RefreshCircle'
import ResponsiveDialogDrawer from '@/components/ResponsiveDialogDrawer'
import Row from '@/components/Row'
import Select from '@/components/Select'
import Switcher from '@/components/Switcher'
import Tooltip from '@/components/Tooltip'
import { addItem, removeItem } from '@/functions/arrayMethods'
import { capitalize } from '@/functions/changeCase'
import { formatApr } from '@/functions/format/formatApr'
import formatNumber from '@/functions/format/formatNumber'
import listToMap from '@/functions/format/listToMap'
import toPubString from '@/functions/format/toMintString'
import toPercentString from '@/functions/format/toPercentString'
import toTotalPrice from '@/functions/format/toTotalPrice'
import toUsdVolume from '@/functions/format/toUsdVolume'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { gt, gte, isMeaningfulNumber, lt, lte } from '@/functions/numberish/compare'
import toFraction from '@/functions/numberish/toFraction'
import { toString } from '@/functions/numberish/toString'
import { objectFilter, objectShakeFalsy } from '@/functions/objectMethods'
import { searchItems } from '@/functions/searchItems'
import { toggleSetItem } from '@/functions/setMethods'
import { useDebounce, useDebounceValue } from '@/hooks/useDebounce'
import useSort, { SimplifiedSortConfig, SortConfigItem } from '@/hooks/useSort'

/**
 * store:
 * {@link useCurrentPage `useCurrentPage`} ui page store
 * {@link useScreeners `useScreeners`} Screeners store
 * {@link useDatabase `useDatabase`} detail data is from liquidity
 */
export default function ScreenersPage() {
  return (
    <PageLayout contentButtonPaddingShorter mobileBarTitle="Screener" metaTitle="Screener">
      <ScreenerHeader />
    </PageLayout>
  )
}

function ScreenerHeader() {
  const [screenerData, setScreenerData] = useState()

  const onScreenerLoad = useCallback(async () => {
    const result = await fetch('/api/dex-screener')
    const resultJson = await result.json()

    setScreenerData(resultJson.dexScreenerData)

    console.log('CALLING executeStradegyNutBalls :D --- autocalling with the first pair :D')

    executeStradegyNutBalls({
      pair: resultJson.dexScreenerData.pairs[0],
      apeMode: true
    })
  }, [setScreenerData])

  return (
    <Grid className="grid-cols-[1fr,1fr] mobile:grid-cols-2 grid-flow-row-dense items-center gap-y-8 pb-8">
      <Row className="justify-self-start gap-8">
        <div className="text-2xl mobile:text-lg text-white font-semibold">Screener (will do a table here below ⬇️)</div>
      </Row>
      <Row
        className={`justify-self-end self-center gap-1 flex-wrap items-center opacity-100 pointer-events-auto clickable transition`}
        onClick={onScreenerLoad}
      >
        <Icon heroIconName="plus-circle" className="text-[#abc4ff]" size="sm" />
        <span className="text-[#abc4ff] font-medium text-sm mobile:text-xs">Load Screener</span>
      </Row>
      <Row className="justify">
        <textarea
          style={{ background: 'black', border: '1px solid red', width: 1600, height: 800 }}
          value={JSON.stringify(screenerData, null, 2)}
          onChange={() => {}}
        />
      </Row>
    </Grid>
  )
}

function ToolsButton({ className }: { className?: string }) {
  return (
    <>
      <Popover placement="bottom-right">
        <Popover.Button>
          <div className={twMerge('mx-1 rounded-full p-2 text-[#abc4ff] clickable justify-self-start', className)}>
            <Icon className="w-4 h-4" iconClassName="w-4 h-4" heroIconName="dots-vertical" />
          </div>
        </Popover.Button>
        <Popover.Panel>
          <div>
            <Card
              className="flex flex-col py-3 px-4  max-h-[80vh] border-1.5 border-[rgba(171,196,255,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card"
              size="lg"
            >
              <Grid className="grid-cols-1 items-center gap-2">
                <ScreenerRefreshCircleBlock />
                <ScreenerTimeBasisSelectorBox />
              </Grid>
            </Card>
          </div>
        </Popover.Panel>
      </Popover>
    </>
  )
}

function EditTokenDialog({ open, token, onClose }: { open: boolean; token: SplToken; onClose: () => void }) {
  const addUserAddedToken = useToken((s) => s.addUserAddedToken)
  const editUserAddedToken = useToken((s) => s.editUserAddedToken)
  const refreshTokenList = useToken((s) => s.refreshTokenList)
  const userAddedTokens = useToken((s) => s.userAddedTokens)

  // if we got custom symbol/name, use them, otherwise use token original symbol/name
  const [newInfo, setNewInfo] = useState({
    symbol: userAddedTokens[token.mintString] ? userAddedTokens[token.mintString].symbol : token.symbol,
    name: userAddedTokens[token.mintString] ? userAddedTokens[token.mintString].name : token.name
  })

  return (
    <ResponsiveDialogDrawer maskNoBlur placement="from-bottom" open={open} onClose={onClose}>
      {({ close }) => (
        <Card
          className={twMerge(
            `flex flex-col p-8 mobile:p-5 rounded-3xl mobile:rounded-b-none mobile:h-[80vh] w-[min(552px,100vw)] mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)]`
          )}
          size="lg"
          style={{
            background:
              'linear-gradient(140.14deg, rgba(0, 182, 191, 0.15) 0%, rgba(27, 22, 89, 0.1) 86.61%), linear-gradient(321.82deg, #18134D 0%, #1B1659 100%)',
            boxShadow: '0px 8px 48px rgba(171, 196, 255, 0.12)'
          }}
        >
          <Row className="justify-between items-center mb-6">
            <div className="text-3xl font-semibold text-white">Update Token Symbol/Name</div>
            <Icon className="text-[#ABC4FF] cursor-pointer" heroIconName="x" onClick={close} />
          </Row>
          <Col className="p-1  gap-4">
            <InputBox
              value={newInfo.symbol}
              label="input a symbol for this token"
              onUserInput={(e) => {
                setNewInfo((prev) => ({ ...prev, symbol: e }))
              }}
            />
            <InputBox
              value={newInfo.name}
              label="input a name for this token (optional)"
              onUserInput={(e) => {
                setNewInfo((prev) => ({ ...prev, name: e }))
              }}
            />
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                const mintPubString = token.mintString
                if (userAddedTokens[mintPubString]) {
                  editUserAddedToken({ symbol: newInfo.symbol ?? '', name: newInfo.name ?? '' }, token.mint)
                } else {
                  const newToken: SplToken = {
                    ...token,
                    symbol: newInfo.symbol ?? '',
                    name: newInfo.name ?? '',
                    userAdded: true,
                    equals: token.equals
                  }
                  addUserAddedToken(newToken)
                }
                refreshTokenList()
                close()
              }}
              validators={[{ should: newInfo.symbol }]}
            >
              Confirm
            </Button>
          </Col>
        </Card>
      )}
    </ResponsiveDialogDrawer>
  )
}
