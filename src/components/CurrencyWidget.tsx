import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Euro, CircleDollarSign } from 'lucide-react'

type CurrencyData = {
  code: string
  codein: string
  name: string
  bid: string
  pctChange: string
  varBid: string
}

type Currencies = {
  USD: CurrencyData
  EUR: CurrencyData
  JPY: CurrencyData
}

export function CurrencyWidget() {
  const [currencies, setCurrencies] = useState<Currencies | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchCurrencies = () => {
      fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,JPY-BRL')
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok')
          return res.json()
        })
        .then((data) => {
          setCurrencies({
            USD: data.USDBRL,
            EUR: data.EURBRL,
            JPY: data.JPYBRL,
          })
          setError(false)
        })
        .catch((err) => {
          console.error('Failed to fetch currencies:', err)
          setError(true)
        })
    }

    fetchCurrencies()
    const interval = setInterval(fetchCurrencies, 60000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Taxas de câmbio indisponíveis no momento
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!currencies) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full overflow-x-auto pb-1">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="flex-1 min-w-[200px] shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderCurrency = (data: CurrencyData, icon: React.ReactNode) => {
    const current = parseFloat(data.bid)
    const varBid = parseFloat(data.varBid)
    const previous = current - varBid
    const pctChange = parseFloat(data.pctChange)
    const isPositive = pctChange > 0
    const isNegative = pctChange < 0

    return (
      <Card className="flex-1 min-w-[200px] shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">{icon}</div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {data.code}/BRL
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  R$ {current.toFixed(4)}
                </p>
                <span
                  className={`flex items-center text-[10px] font-bold px-1 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : isNegative
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  ) : isNegative ? (
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                  ) : null}
                  {Math.abs(pctChange).toFixed(2)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Anterior: R$ {previous.toFixed(4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full overflow-x-auto pb-1">
      {renderCurrency(
        currencies.USD,
        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      )}
      {renderCurrency(
        currencies.EUR,
        <Euro className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      )}
      {renderCurrency(
        currencies.JPY,
        <CircleDollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      )}
    </div>
  )
}
